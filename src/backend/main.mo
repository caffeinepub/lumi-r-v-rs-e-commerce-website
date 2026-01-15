import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Float "mo:core/Float";
import Principal "mo:core/Principal";

import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import OutCall "http-outcalls/outcall";

actor {
  // Type definitions
  type ProductCategory = {
    #clothing;
    #accessories;
    #footwear;
    #homeDecor;
    #jewelry;
    #fragrances;
    #electronics;
    #art;
    #other : Text;
  };

  type ProductSize = {
    #xs;
    #s;
    #m;
    #l;
    #xl;
    #xxl;
    #custom : Text;
  };

  type ProductColor = {
    #white;
    #black;
    #gold;
    #silver;
    #blue;
    #green;
    #red;
    #custom : Text;
  };

  type ProductImage = Storage.ExternalBlob;

  type Product = {
    id : Text;
    name : Text;
    description : Text;
    category : ProductCategory;
    priceCents : Nat;
    sizes : [ProductSize];
    colors : [ProductColor];
    images : [ProductImage];
    inStock : Bool;
    featured : Bool;
    createdAt : Int;
  };

  type CartItem = {
    productId : Text;
    size : ProductSize;
    color : ProductColor;
    quantity : Nat;
  };

  type Cart = {
    id : Text;
    owner : Principal;
    items : [CartItem];
    totalPriceCents : Nat;
    createdAt : Int;
    products : [Product];
  };

  type ContactForm = {
    id : Text;
    name : Text;
    email : Text;
    message : Text;
    submittedAt : Int;
    replied : Bool;
  };

  type DeliveryLocation = {
    latitude : Float;
    longitude : Float;
    timestamp : Int;
  };

  type OrderStatus = {
    #processing;
    #paid;
    #shipped;
    #delivered;
    #cancelled;
  };

  type Order = {
    id : Text;
    customer : Principal;
    items : [CartItem];
    totalPriceCents : Nat;
    status : OrderStatus;
    paymentIntentId : Text;
    createdAt : Int;
    locations : [DeliveryLocation];
  };

  type UserProfile = {
    name : Text;
    email : Text;
    shippingAddress : Text;
  };

  // Mixin for products
  module ProductSort {
    public func compare(product1 : Product, product2 : Product) : Order.Order {
      Text.compare(product1.name, product2.name);
    };

    public func compareByNewest(product1 : Product, product2 : Product) : Order.Order {
      Int.compare(product2.createdAt, product1.createdAt);
    };

    public func compareByPrice(product1 : Product, product2 : Product) : Order.Order {
      Nat.compare(product1.priceCents, product2.priceCents);
    };
  };

  // Add authorization and storage
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Product management stores
  let products = Map.empty<Text, Product>();
  let carts = Map.empty<Text, Cart>();
  let orders = Map.empty<Text, Order>();
  let contacts = Map.empty<Text, ContactForm>();
  var stripeSessionOwners = Map.empty<Text, Principal>();

  // Stripe configuration
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  // Product management - Public read, admin write
  public query ({ caller }) func getProduct(id : Text) : async Product {
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) { product };
    };
  };

  public query ({ caller }) func getProductsByCategory(category : ProductCategory) : async [Product] {
    products.values().toArray().filter(func(p) { p.category == category });
  };

  public query ({ caller }) func getFeaturedProducts() : async [Product] {
    products.values().toArray().filter(func(p) { p.featured });
  };

  public shared ({ caller }) func addProduct(product : Product) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add products");
    };
    products.add(product.id, product);
  };

  public shared ({ caller }) func updateProduct(product : Product) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };
    products.add(product.id, product);
  };

  public shared ({ caller }) func deleteProduct(id : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };
    products.remove(id);
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    products.values().toArray().sort();
  };

  // Shopping cart - Owner only access
  public shared ({ caller }) func createCart(cart : Cart) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can create carts");
    };
    if (cart.owner != caller) {
      Runtime.trap("Unauthorized: Cannot create cart for another user");
    };
    carts.add(cart.id, cart);
  };

  public shared ({ caller }) func updateCart(cart : Cart) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can update carts");
    };
    switch (carts.get(cart.id)) {
      case (null) {
        if (cart.owner != caller) {
          Runtime.trap("Unauthorized: Cannot create cart for another user");
        };
      };
      case (?existingCart) {
        if (existingCart.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own cart");
        };
      };
    };
    carts.add(cart.id, cart);
  };

  public query ({ caller }) func getCart(cartId : Text) : async ?Cart {
    switch (carts.get(cartId)) {
      case (null) { null };
      case (?cart) {
        if (cart.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own cart");
        };
        ?cart;
      };
    };
  };

  public shared ({ caller }) func clearCart(cartId : Text) : async () {
    switch (carts.get(cartId)) {
      case (null) { Runtime.trap("Cart not found") };
      case (?cart) {
        if (cart.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only clear your own cart");
        };
        carts.remove(cartId);
      };
    };
  };

  // Stripe checkout - Authenticated users only
  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can configure Stripe");
    };
    stripeConfig := ?config;
  };

  public query ({ caller }) func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  func getStripeConfig() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (?c) { c };
      case (null) { Runtime.trap("Stripe needs to be first configured") };
    };
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    // Verify caller owns this session or is admin
    switch (stripeSessionOwners.get(sessionId)) {
      case (null) { Runtime.trap("Session not found") };
      case (?owner) {
        if (owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own checkout sessions");
        };
      };
    };
    await Stripe.getSessionStatus(getStripeConfig(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can create checkout sessions");
    };
    let sessionId = await Stripe.createCheckoutSession(getStripeConfig(), caller, items, successUrl, cancelUrl, transform);
    stripeSessionOwners.add(sessionId, caller);
    sessionId;
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Order management - Owner or admin access
  public shared ({ caller }) func createOrder(order : Order) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can create orders");
    };
    if (order.customer != caller) {
      Runtime.trap("Unauthorized: Cannot create order for another user");
    };
    orders.add(order.id, order);
  };

  public shared ({ caller }) func updateOrder(order : Order) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update orders");
    };
    orders.add(order.id, order);
  };

  public query ({ caller }) func getOrder(id : Text) : async ?Order {
    switch (orders.get(id)) {
      case (null) { null };
      case (?order) {
        if (order.customer != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own orders");
        };
        ?order;
      };
    };
  };

  public query ({ caller }) func getOrdersByCustomer(customer : Principal) : async [Order] {
    if (caller != customer and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own orders");
    };
    let customerOrders = orders.values().toArray().filter(func(o) { o.customer == customer });
    customerOrders;
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray();
  };

  // Delivery tracking - Admin updates, owner or admin reads
  public shared ({ caller }) func updateOrderLocation(orderId : Text, location : DeliveryLocation) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update delivery locations");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedLocations = order.locations.concat([location]);
        let updatedOrder = { order with locations = updatedLocations };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  public query ({ caller }) func getOrderLocations(orderId : Text) : async [DeliveryLocation] {
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        if (order.customer != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own order locations");
        };
        order.locations;
      };
    };
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Text, status : OrderStatus) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder = { order with status };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  // Contact form handling - Anyone can submit, admin only for management
  public shared ({ caller }) func submitContactForm(form : ContactForm) : async () {
    contacts.add(form.id, form);
  };

  public shared ({ caller }) func markContactFormReplied(formId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can mark contact forms as replied");
    };
    switch (contacts.get(formId)) {
      case (null) { Runtime.trap("Form not found") };
      case (?form) {
        let updatedForm = { form with replied = true };
        contacts.add(formId, updatedForm);
      };
    };
  };

  public query ({ caller }) func getContactForms() : async [ContactForm] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view contact forms");
    };
    contacts.values().toArray();
  };
};
