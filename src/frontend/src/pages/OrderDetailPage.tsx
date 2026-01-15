import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetOrder, useGetOrderLocations, useGetAllProducts } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin } from 'lucide-react';
import type { OrderStatus, ProductSize, ProductColor } from '../backend';

export default function OrderDetailPage() {
  const { orderId } = useParams({ from: '/orders/$orderId' });
  const navigate = useNavigate();
  const { data: order, isLoading: orderLoading } = useGetOrder(orderId);
  const { data: locations } = useGetOrderLocations(orderId);
  const { data: allProducts } = useGetAllProducts();

  const formatPrice = (cents: bigint) => {
    return `₹${(Number(cents) / 100).toFixed(2)}`;
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

  const getStatusBadge = (status: OrderStatus) => {
    const statusString = status.toString();
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      processing: { variant: 'secondary', label: 'Processing' },
      paid: { variant: 'default', label: 'Paid' },
      shipped: { variant: 'default', label: 'Shipped' },
      delivered: { variant: 'default', label: 'Delivered' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    };

    const config = statusMap[statusString] || { variant: 'outline' as const, label: 'Unknown' };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (orderLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-muted-foreground mb-4">Order not found</p>
        <Button onClick={() => navigate({ to: '/orders' })}>Back to Orders</Button>
      </div>
    );
  }

  const hasLocations = locations && locations.length > 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Button variant="ghost" onClick={() => navigate({ to: '/orders' })} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Button>

      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold">Order #{order.id.slice(-8)}</h1>
            <p className="text-muted-foreground mt-1">{formatDate(order.createdAt)}</p>
          </div>
          {getStatusBadge(order.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item, index) => {
                const product = allProducts?.find((p) => p.id === item.productId);
                if (!product) return null;

                return (
                  <div key={index} className="flex justify-between items-start py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Size: {getSizeLabel(item.size)} | Color: {getColorLabel(item.color)}
                      </p>
                      <p className="text-sm text-muted-foreground">Quantity: {Number(item.quantity)}</p>
                    </div>
                    <p className="font-semibold">{formatPrice(product.priceCents * item.quantity)}</p>
                  </div>
                );
              })}
              <div className="pt-4 border-t">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(order.totalPriceCents)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delivery Tracking */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Delivery Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasLocations ? (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h3 className="font-semibold mb-4">Tracking Points</h3>
                    <div className="space-y-3">
                      {locations.map((location, index) => (
                        <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              Location {index + 1}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(location.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Last updated: {formatDate(locations[locations.length - 1].timestamp)}</p>
                    <p className="mt-1">{locations.length} tracking points recorded</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No tracking information available yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tracking details will appear here once your order is shipped
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
