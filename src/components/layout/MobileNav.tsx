
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Package, DollarSign, FileText, PanelLeft, PlusCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/icons/Logo';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useOrder } from '@/context/OrderContext';

const navItems = [
  { href: '/', label: 'Event Details', icon: Home },
  { href: '/deliverables', label: 'Deliverables', icon: Package },
  { href: '/commercials', label: 'Commercials', icon: DollarSign },
  { href: '/drafts', label: 'My Drafts', icon: FileText },
  { href: '/active-orders', label: 'Active Orders', icon: Zap },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { order, resetOrder } = useOrder();

  const handleCreateOrder = () => {
    resetOrder();
    router.push('/');
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="lg:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs flex flex-col">
        <SheetHeader className="sr-only">
          <SheetTitle>SrishFlow Navigation Menu</SheetTitle>
          <SheetDescription>
            Access and navigate through different sections of the order management system.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex h-16 items-center px-2">
          <Logo className="h-6 w-auto" />
        </div>

        <div className="py-4">
          <Button 
            onClick={handleCreateOrder}
            className="w-full justify-start gap-2 font-bold"
          >
            <PlusCircle className="h-4 w-4" />
            Create Order
          </Button>
        </div>

        <nav className="grid gap-4 text-lg font-medium">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
                pathname === item.href && 'text-foreground font-bold'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        
        <div className="mt-auto pb-6">
            <div className="text-center text-[10px] font-bold uppercase text-muted-foreground mb-1">Current Order</div>
            <div className="text-center font-mono font-bold text-primary">
              {order.orderId || 'NOT ASSIGNED'}
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
