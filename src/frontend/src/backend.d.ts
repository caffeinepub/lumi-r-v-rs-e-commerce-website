import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type ProductColor = {
    __kind__: "red";
    red: null;
} | {
    __kind__: "custom";
    custom: string;
} | {
    __kind__: "blue";
    blue: null;
} | {
    __kind__: "gold";
    gold: null;
} | {
    __kind__: "green";
    green: null;
} | {
    __kind__: "black";
    black: null;
} | {
    __kind__: "silver";
    silver: null;
} | {
    __kind__: "white";
    white: null;
};
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ContactForm {
    id: string;
    name: string;
    submittedAt: bigint;
    email: string;
    message: string;
    replied: boolean;
}
export type ProductImage = Uint8Array;
export interface Order {
    id: string;
    status: OrderStatus;
    customer: Principal;
    createdAt: bigint;
    totalPriceCents: bigint;
    locations: Array<DeliveryLocation>;
    items: Array<CartItem>;
    paymentIntentId: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type ProductSize = {
    __kind__: "l";
    l: null;
} | {
    __kind__: "m";
    m: null;
} | {
    __kind__: "s";
    s: null;
} | {
    __kind__: "xl";
    xl: null;
} | {
    __kind__: "xs";
    xs: null;
} | {
    __kind__: "xxl";
    xxl: null;
} | {
    __kind__: "custom";
    custom: string;
};
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface DeliveryLocation {
    latitude: number;
    longitude: number;
    timestamp: bigint;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Cart {
    id: string;
    owner: Principal;
    createdAt: bigint;
    totalPriceCents: bigint;
    items: Array<CartItem>;
    products: Array<Product>;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface CartItem {
    color: ProductColor;
    size: ProductSize;
    productId: string;
    quantity: bigint;
}
export type ProductCategory = {
    __kind__: "art";
    art: null;
} | {
    __kind__: "clothing";
    clothing: null;
} | {
    __kind__: "accessories";
    accessories: null;
} | {
    __kind__: "other";
    other: string;
} | {
    __kind__: "footwear";
    footwear: null;
} | {
    __kind__: "jewelry";
    jewelry: null;
} | {
    __kind__: "fragrances";
    fragrances: null;
} | {
    __kind__: "electronics";
    electronics: null;
} | {
    __kind__: "homeDecor";
    homeDecor: null;
};
export interface Product {
    id: string;
    featured: boolean;
    inStock: boolean;
    name: string;
    createdAt: bigint;
    description: string;
    sizes: Array<ProductSize>;
    category: ProductCategory;
    colors: Array<ProductColor>;
    priceCents: bigint;
    images: Array<ProductImage>;
}
export enum OrderStatus {
    shipped = "shipped",
    cancelled = "cancelled",
    paid = "paid",
    delivered = "delivered",
    processing = "processing"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProduct(product: Product): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearCart(cartId: string): Promise<void>;
    createCart(cart: Cart): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createOrder(order: Order): Promise<void>;
    deleteProduct(id: string): Promise<void>;
    getAllOrders(): Promise<Array<Order>>;
    getAllProducts(): Promise<Array<Product>>;
    getCallerUserRole(): Promise<UserRole>;
    getCart(cartId: string): Promise<Cart | null>;
    getContactForms(): Promise<Array<ContactForm>>;
    getFeaturedProducts(): Promise<Array<Product>>;
    getOrder(id: string): Promise<Order | null>;
    getOrderLocations(orderId: string): Promise<Array<DeliveryLocation>>;
    getOrdersByCustomer(customer: Principal): Promise<Array<Order>>;
    getProduct(id: string): Promise<Product>;
    getProductsByCategory(category: ProductCategory): Promise<Array<Product>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    markContactFormReplied(formId: string): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    submitContactForm(form: ContactForm): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateCart(cart: Cart): Promise<void>;
    updateOrder(order: Order): Promise<void>;
    updateOrderLocation(orderId: string, location: DeliveryLocation): Promise<void>;
    updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>;
    updateProduct(product: Product): Promise<void>;
}
