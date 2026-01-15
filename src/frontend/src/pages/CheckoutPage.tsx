import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetCart,
  useGetAllProducts,
  useCreateCheckoutSession,
  useIsStripeConfigured,
  useCreateOrder,
  useClearCart,
} from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { ShoppingItem, Order } from '../backend';
import { OrderStatus } from '../backend';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const cartId = identity ? `cart-${identity.getPrincipal().toString()}` : '';
  const { data: cart, isLoading: cartLoading } = useGetCart(cartId);
  const { data: allProducts } = useGetAllProducts();
  const { data: isStripeConfigured, isLoading: stripeLoading } = useIsStripeConfigured();
  const createCheckoutSession = useCreateCheckoutSession();
  const createOrder = useCreateOrder();
  const clearCart = useClearCart();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!identity) {
    navigate({ to: '/cart' });
    return null;
  }

  const formatPrice = (cents: bigint) => {
    return `$${(Number(cents) / 100).toFixed(2)}`;
  };

  const handleCheckout = async () => {
    if (!cart || !allProducts || !isStripeConfigured) return;

    setIsProcessing(true);

    try {
      const items: ShoppingItem[] = cart.items.map((item) => {
        const product = allProducts.find((p) => p.id === item.productId);
        if (!product) throw new Error('Product not found');

        return {
          productName: product.name,
          productDescription: product.description,
          priceInCents: product.priceCents,
          quantity: item.quantity,
          currency: 'usd',
        };
      });

      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/payment-success`;
      const cancelUrl = `${baseUrl}/payment-failure`;

      const session = await createCheckoutSession.mutateAsync({
        items,
        successUrl,
        cancelUrl,
      });

      // Create order
      const order: Order = {
        id: `order-${Date.now()}-${identity.getPrincipal().toString().slice(0, 8)}`,
        customer: identity.getPrincipal(),
        items: cart.items,
        totalPriceCents: cart.totalPriceCents,
        status: OrderStatus.processing,
        paymentIntentId: session.id,
        createdAt: BigInt(Date.now() * 1000000),
        locations: [],
      };

      await createOrder.mutateAsync(order);

      // Clear cart
      await clearCart.mutateAsync(cartId);

      // Redirect to Stripe
      window.location.href = session.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to process checkout');
      setIsProcessing(false);
    }
  };

  if (cartLoading || stripeLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    navigate({ to: '/cart' });
    return null;
  }

  if (!isStripeConfigured) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Payment Not Configured</h2>
        <p className="text-muted-foreground mb-6">
          Payment processing is not yet set up. Please contact the administrator.
        </p>
        <Button onClick={() => navigate({ to: '/cart' })}>Back to Cart</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.items.map((item, index) => {
                const product = allProducts?.find((p) => p.id === item.productId);
                if (!product) return null;

                return (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {Number(item.quantity)}</p>
                    </div>
                    <p className="font-semibold">
                      {formatPrice(product.priceCents * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(cart.totalPriceCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg mb-6">
                  <span>Total</span>
                  <span>{formatPrice(cart.totalPriceCents)}</span>
                </div>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={isProcessing || createCheckoutSession.isPending}
              >
                {isProcessing || createCheckoutSession.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Pay with Stripe'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
