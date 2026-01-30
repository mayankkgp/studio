'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, DollarSign, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/icons/Logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useOrder } from '@/context/OrderContext';

const navItems = [
  { href: '/', label: 'Event Details', icon: Home },
  { href: '/deliverables', label: 'Deliverables', icon: Package },
  { href: '/commercials', label: 'Commercials', icon: DollarSign },
];

export function MobileNav() {
  const pathname = usePathname();
  const { order } = useOrder();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="lg:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        <nav className="grid gap-6 text-lg font-medium">
          <Link href="/" className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base">
            <Logo className="h-6 w-auto" />
            <span className="sr-only">SrishFlow</span>
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
                pathname === item.href && 'text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto absolute bottom-4 left-4 right-4">
            <div className="text-center text-xs text-muted-foreground">Order ID</div>
            <div className="text-center font-mono font-semibold text-primary">{order.orderId}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
