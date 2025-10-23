import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ParkingSquare, LayoutDashboard, Users, Car, FileText, DollarSign, LogOut, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/clientes', label: 'Clientes', icon: Users },
    { href: '/ingresos', label: 'Entrada/Salida', icon: Car },
    { href: '/tarifas', label: 'Tarifas', icon: DollarSign },
    { href: '/reportes', label: 'Reportes', icon: FileText },
  ];

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg sm:text-xl">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <ParkingSquare className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="hidden sm:inline">Estacionamiento</span>
              <span className="inline sm:hidden text-sm">Parking</span>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-1">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Desktop Logout */}
            <Button 
              variant="ghost" 
              onClick={signOut} 
              className="hidden sm:flex gap-2"
              size="sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </Button>

            {/* Mobile Menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <ParkingSquare className="w-5 h-5 text-primary" />
                    Menú
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={handleLinkClick}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-base",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {link.label}
                      </Link>
                    );
                  })}
                  <div className="border-t pt-4 mt-4">
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        handleLinkClick();
                        signOut();
                      }}
                      className="w-full gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
