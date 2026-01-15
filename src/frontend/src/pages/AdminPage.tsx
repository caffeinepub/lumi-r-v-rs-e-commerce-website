import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useIsCallerAdmin,
  useGetAllProducts,
  useAddProduct,
  useUpdateProduct,
  useDeleteProduct,
  useGetAllOrders,
  useUpdateOrderStatus,
  useUpdateOrderLocation,
  useGetContactForms,
  useMarkContactFormReplied,
  useIsStripeConfigured,
  useSetStripeConfiguration,
} from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Package, ShoppingBag, Mail, CreditCard } from 'lucide-react';
import type { Product, ProductCategory, Order, ContactForm, StripeConfiguration } from '../backend';
import { OrderStatus } from '../backend';

export default function AdminPage() {
  const { identity, login } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: products, isLoading: productsLoading } = useGetAllProducts();
  const { data: orders, isLoading: ordersLoading } = useGetAllOrders();
  const { data: contactForms, isLoading: formsLoading } = useGetContactForms();
  const { data: isStripeConfigured } = useIsStripeConfigured();

  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateOrderStatus = useUpdateOrderStatus();
  const markFormReplied = useMarkContactFormReplied();
  const setStripeConfig = useSetStripeConfiguration();

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stripeDialogOpen, setStripeDialogOpen] = useState(false);

  if (!identity) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Admin Access Required</h2>
        <p className="text-muted-foreground mb-6">Please login to access the admin dashboard</p>
        <Button onClick={login}>Login</Button>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to access this page</p>
      </div>
    );
  }

  const formatPrice = (cents: bigint) => {
    return `₹${(Number(cents) / 100).toFixed(2)}`;
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleSaveProduct = async (formData: FormData) => {
    // This is a simplified version - in production, you'd handle image uploads properly
    const productData: Product = {
      id: editingProduct?.id || `product-${Date.now()}`,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      priceCents: BigInt(Math.round(parseFloat(formData.get('price') as string) * 100)),
      category: { __kind__: 'clothing', clothing: null } as ProductCategory,
      sizes: [{ __kind__: 'm', m: null }],
      colors: [{ __kind__: 'black', black: null }],
      images: editingProduct?.images || [],
      inStock: formData.get('inStock') === 'true',
      featured: formData.get('featured') === 'true',
      createdAt: editingProduct?.createdAt || BigInt(Date.now() * 1000000),
    };

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync(productData);
        toast.success('Product updated successfully');
      } else {
        await addProduct.mutateAsync(productData);
        toast.success('Product added successfully');
      }
      setProductDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteProduct.mutateAsync(productId);
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, statusValue: string) => {
    let status: OrderStatus;
    
    switch (statusValue) {
      case 'processing':
        status = OrderStatus.processing;
        break;
      case 'paid':
        status = OrderStatus.paid;
        break;
      case 'shipped':
        status = OrderStatus.shipped;
        break;
      case 'delivered':
        status = OrderStatus.delivered;
        break;
      case 'cancelled':
        status = OrderStatus.cancelled;
        break;
      default:
        status = OrderStatus.processing;
    }

    try {
      await updateOrderStatus.mutateAsync({ orderId, status });
      toast.success('Order status updated');
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleMarkFormReplied = async (formId: string) => {
    try {
      await markFormReplied.mutateAsync(formId);
      toast.success('Marked as replied');
    } catch (error) {
      toast.error('Failed to update form');
    }
  };

  const handleSaveStripeConfig = async (formData: FormData) => {
    const config: StripeConfiguration = {
      secretKey: formData.get('secretKey') as string,
      allowedCountries: (formData.get('countries') as string).split(',').map((c) => c.trim()),
    };

    try {
      await setStripeConfig.mutateAsync(config);
      toast.success('Stripe configuration saved');
      setStripeDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save Stripe configuration');
    }
  };

  const getOrderStatusString = (status: OrderStatus): string => {
    return status.toString();
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        {!isStripeConfigured && (
          <Button variant="destructive" onClick={() => setStripeDialogOpen(true)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Configure Stripe
          </Button>
        )}
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">
            <Package className="mr-2 h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <Mail className="mr-2 h-4 w-4" />
            Contact Forms
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Manage Products</h2>
            <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingProduct(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveProduct(new FormData(e.currentTarget));
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" name="name" defaultValue={editingProduct?.name} required />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editingProduct?.description}
                      rows={4}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      placeholder="Enter price in rupees"
                      defaultValue={editingProduct ? Number(editingProduct.priceCents) / 100 : ''}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">Enter the price in rupees (₹)</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="inStock" name="inStock" value="true" defaultChecked={editingProduct?.inStock} />
                      <Label htmlFor="inStock">In Stock</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="featured" name="featured" value="true" defaultChecked={editingProduct?.featured} />
                      <Label htmlFor="featured">Featured</Label>
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {productsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {products?.map((product) => (
                <Card key={product.id}>
                  <CardContent className="flex justify-between items-center p-6">
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={product.inStock ? 'default' : 'secondary'}>
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                        {product.featured && <Badge>Featured</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-bold">{formatPrice(product.priceCents)}</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingProduct(product);
                            setProductDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <h2 className="text-2xl font-semibold">Manage Orders</h2>
          {ordersLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {orders?.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
                        <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                      </div>
                      <p className="text-lg font-bold">{formatPrice(order.totalPriceCents)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                      <Select
                        value={getOrderStatusString(order.status)}
                        onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Contact Forms Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <h2 className="text-2xl font-semibold">Contact Form Submissions</h2>
          {formsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {contactForms?.map((form) => (
                <Card key={form.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">{form.name}</h3>
                        <p className="text-sm text-muted-foreground">{form.email}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(form.submittedAt)}</p>
                      </div>
                      {form.replied ? (
                        <Badge>Replied</Badge>
                      ) : (
                        <Button size="sm" onClick={() => handleMarkFormReplied(form.id)}>
                          Mark as Replied
                        </Button>
                      )}
                    </div>
                    <p className="text-sm">{form.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Stripe Configuration Dialog */}
      <Dialog open={stripeDialogOpen} onOpenChange={setStripeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Stripe Payment</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveStripeConfig(new FormData(e.currentTarget));
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="secretKey">Stripe Secret Key</Label>
              <Input id="secretKey" name="secretKey" type="password" required />
            </div>
            <div>
              <Label htmlFor="countries">Allowed Countries (comma-separated)</Label>
              <Input id="countries" name="countries" defaultValue="IN,US,CA,GB" required />
            </div>
            <Button type="submit" className="w-full">
              Save Configuration
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
