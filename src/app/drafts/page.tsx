'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppLayout } from '@/components/layout/AppLayout';
import { MobileNav } from '@/components/layout/MobileNav';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrder } from '@/context/OrderContext';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { FileText, Trash2, Loader2, Search } from 'lucide-react';
import { calculateBillableItems } from '@/lib/pricing';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { loadDraft } = useOrder();
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, 'drafts'), orderBy('lastSavedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const draftsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDrafts(draftsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this draft?')) {
      await deleteDoc(doc(db, 'drafts', id));
    }
  };

  const handleResume = (draft: any) => {
    loadDraft(draft);
    router.push('/deliverables');
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

  const filteredDrafts = drafts.filter(draft => 
    draft.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getClientName(draft.eventDetails).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateValue: any) => {
    if (!dateValue) return '-';
    try {
      const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
      return format(date, 'dd MMM yyyy');
    } catch (e) {
      return '-';
    }
  };

  const formatDateTime = (dateValue: any) => {
    if (!dateValue) return 'Just now';
    try {
      const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
      return format(date, 'dd MMM, HH:mm');
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 md:px-6 bg-background z-50">
          <MobileNav />
          <div className="flex-1 overflow-hidden">
            <h1 className="font-semibold text-base md:text-lg font-headline">My Order Drafts</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Cloud Storage</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex items-center gap-4 max-w-sm">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by ID or Client..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading your drafts...</p>
              </div>
            ) : filteredDrafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-xl bg-card/50">
                <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-sm font-medium">
                  {searchTerm ? 'No drafts match your search' : 'No drafts found in your account'}
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
                      <TableHead className="w-[120px]">Due Date</TableHead>
                      <TableHead className="w-[120px] text-right">Total (₹)</TableHead>
                      <TableHead className="w-[140px]">Last Saved</TableHead>
                      <TableHead className="w-[60px] text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDrafts.map((draft) => (
                      <TableRow 
                        key={draft.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors group" 
                        onClick={() => handleResume(draft)}
                      >
                        <TableCell className="font-mono font-bold text-primary">
                          {draft.orderId}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-semibold text-[10px] uppercase">
                            {draft.eventDetails?.eventType || 'Other'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {getClientName(draft.eventDetails)}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground text-xs font-bold">
                          {draft.deliverables?.length || 0} Items
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(draft.eventDetails?.orderDueDate)}
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums">
                          {getOrderTotal(draft.deliverables).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">
                          {formatDateTime(draft.lastSavedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10" 
                            onClick={(e) => handleDelete(e, draft.id)}
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
