import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGetFeaturedProducts } from '../hooks/useQueries';
import { ArrowRight, Sparkles, Shield, Truck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const navigate = useNavigate();
  const { data: featuredProducts, isLoading } = useGetFeaturedProducts();

  const formatPrice = (cents: bigint) => {
    return `₹${(Number(cents) / 100).toFixed(2)}`;
  };

  const convertImageToUrl = (imageBytes: Uint8Array) => {
    const blob = new Blob([new Uint8Array(imageBytes)], { type: 'image/jpeg' });
    return URL.createObjectURL(blob);
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/assets/generated/hero-banner.dim_1200x600.jpg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
        </div>
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Lumièrè & Vërsē
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 font-light">
            Where Elegance Meets Timeless Style
          </p>
          <Button
            size="lg"
            onClick={() => navigate({ to: '/products' })}
            className="bg-white text-black hover:bg-white/90 text-lg px-8 py-6"
          >
            Explore Collection
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Premium Quality</h3>
              <p className="text-sm text-muted-foreground">
                Handcrafted with the finest materials and attention to detail
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Shopping</h3>
              <p className="text-sm text-muted-foreground">
                Safe and secure payment processing with Internet Identity
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Truck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Fast Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Track your order in real-time with our delivery tracking system
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Collection</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover our handpicked selection of luxury items that define sophistication
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="w-full h-64" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 4).map((product) => (
                <Card
                  key={product.id}
                  className="group cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate({ to: `/products/${product.id}` })}
                >
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden aspect-square">
                      {product.images.length > 0 ? (
                        <img
                          src={convertImageToUrl(product.images[0])}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-lg font-bold">{formatPrice(product.priceCents)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No featured products available</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Button onClick={() => navigate({ to: '/products' })} size="lg" variant="outline">
              View All Products
            </Button>
          </div>
        </div>
      </section>

      {/* Collections Banner */}
      <section
        className="relative h-[400px] flex items-center justify-center overflow-hidden"
        style={{ backgroundImage: 'url(/assets/generated/collections-banner.dim_1000x400.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">New Season Collection</h2>
          <p className="text-lg mb-6 text-white/90">
            Explore the latest trends in luxury fashion and lifestyle
          </p>
          <Button
            size="lg"
            onClick={() => navigate({ to: '/products' })}
            className="bg-white text-black hover:bg-white/90"
          >
            Shop Now
          </Button>
        </div>
      </section>
    </div>
  );
}
