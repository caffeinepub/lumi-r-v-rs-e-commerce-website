import { Outlet, useNavigate } from '@tanstack/react-router';
import { ShoppingCart, Menu, User, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: isAdmin } = useIsCallerAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      navigate({ to: '/' });
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    { label: 'Contact', path: '/contact' },
  ];

  if (isAuthenticated) {
    navItems.push({ label: 'Orders', path: '/orders' });
  }

  if (isAdmin) {
    navItems.push({ label: 'Admin', path: '/admin' });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => navigate({ to: '/' })}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <img src="/assets/1768406151345.jpg" alt="Lumièrè & Vërsē" className="h-12 w-auto" />
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate({ to: item.path })}
                  className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate({ to: '/cart' })}
                  className="hidden sm:flex"
                >
                  <ShoppingCart className="h-5 w-5" />
                </Button>
              )}

              <Button
                onClick={handleAuth}
                disabled={isLoggingIn}
                variant={isAuthenticated ? 'outline' : 'default'}
                size="sm"
                className="hidden sm:flex"
              >
                {isLoggingIn ? (
                  'Logging in...'
                ) : isAuthenticated ? (
                  <>
                    <User className="h-4 w-4 mr-2" />
                    Logout
                  </>
                ) : (
                  'Login'
                )}
              </Button>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <nav className="flex flex-col space-y-4 mt-8">
                    {navItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate({ to: item.path });
                          setMobileMenuOpen(false);
                        }}
                        className="text-left text-lg font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                      >
                        {item.label}
                      </button>
                    ))}
                    {isAuthenticated && (
                      <button
                        onClick={() => {
                          navigate({ to: '/cart' });
                          setMobileMenuOpen(false);
                        }}
                        className="text-left text-lg font-medium text-foreground/80 hover:text-foreground transition-colors py-2 flex items-center"
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Cart
                      </button>
                    )}
                    <div className="pt-4 border-t">
                      <Button onClick={handleAuth} disabled={isLoggingIn} className="w-full">
                        {isLoggingIn ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login'}
                      </Button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <img src="/assets/1768406151345.jpg" alt="Lumièrè & Vërsē" className="h-10 w-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Luxury fashion and lifestyle brand offering timeless elegance and sophisticated style.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => navigate({ to: '/products' })}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Shop All
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate({ to: '/contact' })}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Contact Us
                  </button>
                </li>
                {isAuthenticated && (
                  <li>
                    <button
                      onClick={() => navigate({ to: '/orders' })}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      My Orders
                    </button>
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <p className="text-sm text-muted-foreground">Email: info@lumiere-verse.com</p>
              <p className="text-sm text-muted-foreground">Phone: +1 (555) 123-4567</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            © 2025. Built with love using{' '}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors underline"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
