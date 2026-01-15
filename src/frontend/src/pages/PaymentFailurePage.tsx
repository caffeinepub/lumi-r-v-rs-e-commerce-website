import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

export default function PaymentFailurePage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto text-center">
        <Card>
          <CardContent className="p-12">
            <div className="mb-6">
              <XCircle className="h-20 w-20 text-destructive mx-auto" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Payment Failed</h1>
            <p className="text-lg text-muted-foreground mb-8">
              We couldn't process your payment. Please try again or contact support if the problem persists.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate({ to: '/checkout' })}>
                Try Again
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate({ to: '/cart' })}>
                Back to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
