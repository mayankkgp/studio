'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Package, DollarSign, FileText, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/icons/Logo';
import { useOrder } from '@/context/OrderContext';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Event Details', icon: Home },
  { href: '/deliverables', label: 'Deliverables', icon: Package },
  { href: '/commercials', label: 'Commercials', icon: DollarSign },
  { href: '/drafts', label: 'My Drafts', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { order, resetOrder } = useOrder();

  const handleCreateOrder = () => {
    resetOrder();
    router.push('/');
  };

  return (
    <div className="hidden border-r bg-card lg:block lg:w-64 fixed h-full">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo className="h-6 w-auto" />
          </Link>
        </div>
        
        <div className="px-4 py-4">
          <Button 
            onClick={handleCreateOrder}
            className="w-full justify-start gap-2 font-bold shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Create Order
          </Button>
        </div>

        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-card-foreground/70 transition-all hover:text-primary hover:bg-primary/10',
                  pathname === item.href && 'bg-primary/10 text-primary'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t">
            <div className="text-center text-[10px] font-bold uppercase text-muted-foreground mb-1">Current Order</div>
            <div className="text-center font-mono text-sm font-bold text-primary truncate">
              {order.orderId || 'NOT ASSIGNED'}
            </div>
        </div>
      </div>
    </div>
  );
}
