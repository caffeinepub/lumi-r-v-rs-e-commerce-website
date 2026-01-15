import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetProduct, useGetCart, useUpdateCart, useCreateCart } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import type { ProductSize, ProductColor, Cart, CartItem } from '../backend';

export default function ProductDetailPage() {
  const { productId } = useParams({ from: '/products/$productId' });
  const navigate = useNavigate();
  const { identity, login } = useInternetIdentity();
  const { data: product, isLoading } = useGetProduct(productId);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const cartId = identity ? `cart-${identity.getPrincipal().toString()}` : '';
  const { data: cart } = useGetCart(cartId);
  const updateCart = useUpdateCart();
  const createCart = useCreateCart();

  const formatPrice = (cents: bigint) => {
    return `₹${(Number(cents) / 100).toFixed(2)}`;
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

  const handleAddToCart = async () => {
    if (!identity) {
      toast.error('Please login to add items to cart');
      await login();
      return;
    }

    if (!product) return;

    if (!selectedSize || !selectedColor) {
      toast.error('Please select size and color');
      return;
    }

    try {
      const newItem: CartItem = {
        productId: product.id,
        size: selectedSize,
        color: selectedColor,
        quantity: BigInt(quantity),
      };

      if (cart) {
        const existingItemIndex = cart.items.findIndex(
          (item) =>
            item.productId === newItem.productId &&
            JSON.stringify(item.size) === JSON.stringify(newItem.size) &&
            JSON.stringify(item.color) === JSON.stringify(newItem.color)
        );

        let updatedItems: CartItem[];
        if (existingItemIndex >= 0) {
          updatedItems = [...cart.items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + newItem.quantity,
          };
        } else {
          updatedItems = [...cart.items, newItem];
        }

        const totalPrice = updatedItems.reduce((sum, item) => {
          return sum + Number(product.priceCents) * Number(item.quantity);
        }, 0);

        const updatedCart: Cart = {
          ...cart,
          items: updatedItems,
          totalPriceCents: BigInt(totalPrice),
          products: [product],
        };

        await updateCart.mutateAsync(updatedCart);
      } else {
        const newCart: Cart = {
          id: cartId,
          owner: identity.getPrincipal(),
          items: [newItem],
          totalPriceCents: product.priceCents * BigInt(quantity),
          createdAt: BigInt(Date.now() * 1000000),
          products: [product],
        };

        await createCart.mutateAsync(newCart);
      }

      toast.success('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="w-full h-[600px]" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-muted-foreground mb-4">Product not found</p>
        <Button onClick={() => navigate({ to: '/products' })}>Back to Products</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Button variant="ghost" onClick={() => navigate({ to: '/products' })} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Products
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg border">
            {product.images.length > 0 ? (
              <img
                src={convertImageToUrl(product.images[selectedImageIndex])}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">No image available</span>
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 ${
                    selectedImageIndex === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img
                    src={convertImageToUrl(image)}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
            <p className="text-3xl font-bold text-primary">{formatPrice(product.priceCents)}</p>
          </div>

          {!product.inStock && (
            <Badge variant="destructive" className="text-base px-4 py-2">
              Out of Stock
            </Badge>
          )}

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          {product.inStock && (
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Size Selection */}
                {product.sizes.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Size</label>
                    <Select
                      value={selectedSize ? JSON.stringify(selectedSize) : ''}
                      onValueChange={(value) => setSelectedSize(JSON.parse(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {product.sizes.map((size, index) => (
                          <SelectItem key={index} value={JSON.stringify(size)}>
                            {getSizeLabel(size)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Color Selection */}
                {product.colors.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Color</label>
                    <Select
                      value={selectedColor ? JSON.stringify(selectedColor) : ''}
                      onValueChange={(value) => setSelectedColor(JSON.parse(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent>
                        {product.colors.map((color, index) => (
                          <SelectItem key={index} value={JSON.stringify(color)}>
                            {getColorLabel(color)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">Quantity</label>
                  <Select value={quantity.toString()} onValueChange={(value) => setQuantity(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleAddToCart}
                  disabled={updateCart.isPending || createCart.isPending}
                  className="w-full"
                  size="lg"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {updateCart.isPending || createCart.isPending ? 'Adding...' : 'Add to Cart'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
