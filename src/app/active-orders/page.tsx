
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { AppLayout } from '@/components/layout/AppLayout';
import { MobileNav } from '@/components/layout/MobileNav';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrder } from '@/context/OrderContext';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Zap, Trash2, Loader2, Search } from 'lucide-react';
import { calculateBillableItems } from '@/lib/pricing';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { useFirestore } from '@/firebase';

export default function ActiveOrdersPage() {
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { loadDraft } = useOrder();
  const router = useRouter();
  const db = useFirestore();

  const activeOrdersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'active-orders'), orderBy('activatedAt', 'desc'));
  }, [db]);

  useEffect(() => {
    if (!activeOrdersQuery) return;

    const unsubscribe = onSnapshot(
      activeOrdersQuery, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setActiveOrders(data);
        setLoading(false);
      },
      async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: 'active-orders',
          operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeOrdersQuery]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this active order?')) {
      const orderRef = doc(db, 'active-orders', id);
      deleteDoc(orderRef)
        .catch(async () => {
          const permissionError = new FirestorePermissionError({
            path: orderRef.path,
            operation: 'delete',
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        });
    }
  };

  const handleView = (order: any) => {
    // We treat active orders as read-only or re-editable drafts
    loadDraft(order);
    router.push('/commercials');
  };

  const getClientName = (details: any) => {
    if (!details) return 'Unknown Client';
    if (details.eventType === 'Wedding') return `${details.brideName} & ${details.groomName}`;
    if (details.eventType === 'Engagement') return `${details.engagementBrideName} & ${details.engagementGroomName}`;
    if (details.eventType === 'Anniversary') return `${details.wifeName} & ${details.husbandName}`;
    return details.honoreeNameBirthday || details.honoreeNameOther || details.eventName || 'Unnamed Event';
  };

  const getOrderTotal = (deliverables: any[]) => {
    if (!deliverables) return 0;
    const items = calculateBillableItems(deliverables);
    return items.reduce((acc, item) => {
      return acc + item.components.reduce((cAcc, c) => cAcc + c.total, 0);
    }, 0);
  };

  const filteredOrders = activeOrders.filter(order => 
    order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getClientName(order.eventDetails).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateValue: any) => {
    if (!dateValue) return '-';
    try {
      const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
      return format(date, 'dd MMM');
    } catch (e) { return '-'; }
  };

  const formatDateTime = (dateValue: any) => {
    if (!dateValue) return 'Recently';
    try {
      const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
      return format(date, 'dd MMM, HH:mm');
    } catch (e) { return 'Recently'; }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 md:px-6 bg-background z-50">
          <MobileNav />
          <div className="flex-1 overflow-hidden">
            <h1 className="font-semibold text-base md:text-lg font-headline">Active Orders</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Confirmed Business</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex items-center gap-4 max-w-sm">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search Active Orders..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Fetching active orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-xl bg-card/50">
                <Zap className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-sm font-medium">
                  {searchTerm ? 'No active orders match your search' : 'No active orders yet'}
                </p>
              </div>
            ) : (
              <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[140px]">Order ID</TableHead>
                      <TableHead className="w-[120px]">Event Type</TableHead>
                      <TableHead className="min-w-[200px]">Client Name</TableHead>
                      <TableHead className="w-[100px] text-center">Items</TableHead>
                      <TableHead className="w-[120px]">Event Date</TableHead>
                      <TableHead className="w-[120px] text-right">Value (₹)</TableHead>
                      <TableHead className="w-[140px]">Activated</TableHead>
                      <TableHead className="w-[60px] text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow 
                        key={order.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors group" 
                        onClick={() => handleView(order)}
                      >
                        <TableCell className="font-mono font-bold text-primary">
                          {order.orderId}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-semibold text-[10px] uppercase">
                            {order.eventDetails?.eventType || 'Other'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {getClientName(order.eventDetails)}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground text-xs font-bold">
                          {order.deliverables?.length || 0}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(order.eventDetails?.eventDate)}
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums">
                          {getOrderTotal(order.deliverables).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">
                          {formatDateTime(order.activatedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10" 
                            onClick={(e) => handleDelete(e, order.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
