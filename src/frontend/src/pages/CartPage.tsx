import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCart, useUpdateCart, useClearCart, useGetAllProducts } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import type { Cart, CartItem, ProductSize, ProductColor } from '../backend';

export default function CartPage() {
  const navigate = useNavigate();
  const { identity, login } = useInternetIdentity();
  const cartId = identity ? `cart-${identity.getPrincipal().toString()}` : '';
  const { data: cart, isLoading } = useGetCart(cartId);
  const { data: allProducts } = useGetAllProducts();
  const updateCart = useUpdateCart();
  const clearCart = useClearCart();

  if (!identity) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
        <p className="text-muted-foreground mb-6">Please login to view your cart</p>
        <Button onClick={login}>Login</Button>
      </div>
    );
  }

  const formatPrice = (cents: bigint) => {
    return `$${(Number(cents) / 100).toFixed(2)}`;
  };

  const convertImageToUrl = (imageBytes: Uint8Array) => {
    const blob = new Blob([new Uint8Array(imageBytes)], { type: 'image/jpeg' });
    return URL.createObjectURL(blob);
  };

  const getSizeLabel = (size: ProductSize): string => {
    if ('xs' in size) return 'XS';
    if ('s' in size) return 'S';
    if ('m' in size) return 'M';
    if ('l' in size) return 'L';
    if ('xl' in size) return 'XL';
    if ('xxl' in size) return 'XXL';
    if ('custom' in size) return size.custom;
    return 'Unknown';
  };

  const getColorLabel = (color: ProductColor): string => {
    if ('white' in color) return 'White';
    if ('black' in color) return 'Black';
    if ('gold' in color) return 'Gold';
    if ('silver' in color) return 'Silver';
    if ('blue' in color) return 'Blue';
    if ('green' in color) return 'Green';
    if ('red' in color) return 'Red';
    if ('custom' in color) return color.custom;
    return 'Unknown';
  };

  const updateQuantity = async (itemIndex: number, newQuantity: number) => {
    if (!cart || !allProducts) return;

    if (newQuantity <= 0) {
      await removeItem(itemIndex);
      return;
    }

    const updatedItems = [...cart.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      quantity: BigInt(newQuantity),
    };

    const totalPrice = updatedItems.reduce((sum, item) => {
      const product = allProducts.find((p) => p.id === item.productId);
      if (!product) return sum;
      return sum + Number(product.priceCents) * Number(item.quantity);
    }, 0);

    const updatedCart: Cart = {
      ...cart,
      items: updatedItems,
      totalPriceCents: BigInt(totalPrice),
    };

    try {
      await updateCart.mutateAsync(updatedCart);
    } catch (error) {
      toast.error('Failed to update cart');
    }
  };

  const removeItem = async (itemIndex: number) => {
    if (!cart || !allProducts) return;

    const updatedItems = cart.items.filter((_, index) => index !== itemIndex);

    if (updatedItems.length === 0) {
      try {
        await clearCart.mutateAsync(cartId);
        toast.success('Cart cleared');
      } catch (error) {
        toast.error('Failed to clear cart');
      }
      return;
    }

    const totalPrice = updatedItems.reduce((sum, item) => {
      const product = allProducts.find((p) => p.id === item.productId);
      if (!product) return sum;
      return sum + Number(product.priceCents) * Number(item.quantity);
    }, 0);

    const updatedCart: Cart = {
      ...cart,
      items: updatedItems,
      totalPriceCents: BigInt(totalPrice),
    };

    try {
      await updateCart.mutateAsync(updatedCart);
      toast.success('Item removed');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
        <p className="text-muted-foreground mb-6">Start shopping to add items to your cart</p>
        <Button onClick={() => navigate({ to: '/products' })}>Browse Products</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item, index) => {
            const product = allProducts?.find((p) => p.id === item.productId);
            if (!product) return null;

            return (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg border">
                      {product.images.length > 0 ? (
                        <img
                          src={convertImageToUrl(product.images[0])}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Size: {getSizeLabel(item.size)} | Color: {getColorLabel(item.color)}
                      </p>
                      <p className="font-bold">{formatPrice(product.priceCents)}</p>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={updateCart.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(index, Number(item.quantity) - 1)}
                          disabled={updateCart.isPending}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{Number(item.quantity)}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(index, Number(item.quantity) + 1)}
                          disabled={updateCart.isPending}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(cart.totalPriceCents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(cart.totalPriceCents)}</span>
                </div>
              </div>
              <Button className="w-full" size="lg" onClick={() => navigate({ to: '/checkout' })}>
                Proceed to Checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
