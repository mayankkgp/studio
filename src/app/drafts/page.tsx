'use client';

import { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MobileNav } from '@/components/layout/MobileNav';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrder } from '@/context/OrderContext';
import { useRouter } from 'next/navigation';
import { FileText, Trash2, Loader2, Search, HardDrive } from 'lucide-react';
import { calculateBillableItems } from '@/lib/pricing';
import { Input } from '@/components/ui/input';

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { loadDraft } = useOrder();
  const router = useRouter();

  const loadAllDrafts = useCallback(() => {
    setLoading(true);
    try {
      const raw = localStorage.getItem('srishbish_drafts_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        const data = Object.values(parsed).map((d: any) => ({ ...d }));
        setDrafts(data.sort((a: any, b: any) => new Date(b.lastSavedAt).getTime() - new Date(a.lastSavedAt).getTime()));
      } else {
        setDrafts([]);
      }
    } catch (e) {
      console.error('Failed to load drafts', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllDrafts();
  }, [loadAllDrafts]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this draft forever?')) {
      try {
        const raw = localStorage.getItem('srishbish_drafts_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          delete parsed[id];
          localStorage.setItem('srishbish_drafts_v1', JSON.stringify(parsed));
          setDrafts(prev => prev.filter(d => d.orderId !== id));
        }
      } catch (e) {}
    }
  };

  const getClientName = (details: any) => {
    if (!details) return 'Unknown Client';
    if (details.eventType === 'Wedding') return `${details.brideName} & ${details.groomName}`;
    if (details.eventType === 'Engagement') return `${details.engagementBrideName} & ${details.engagementGroomName}`;
    if (details.eventType === 'Anniversary') return `${details.wifeName} & ${details.husbandName}`;
    return details.honoreeNameBirthday || details.honoreeNameOther || details.eventName || 'Unnamed Event';
  };

  const filteredDrafts = drafts.filter(draft => 
    draft.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getClientName(draft.eventDetails).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex flex-col h-screen bg-background">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 md:px-6 bg-background">
          <MobileNav />
          <div className="flex-1">
            <h1 className="font-semibold text-lg font-headline">Order Drafts</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Saved to this device</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search Drafts..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="flex flex-col items-center py-24 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading storage...</p>
              </div>
            ) : filteredDrafts.length === 0 ? (
              <div className="flex flex-col items-center py-24 border-2 border-dashed rounded-xl bg-card">
                <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-sm">No drafts found on this device</p>
              </div>
            ) : (
              <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Order ID</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Storage</TableHead>
                      <TableHead className="text-right">Total (₹)</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDrafts.map((draft) => (
                      <TableRow key={draft.orderId} className="cursor-pointer group" onClick={() => { loadDraft(draft); router.push(draft.currentStep || '/'); }}>
                        <TableCell className="font-mono font-bold text-primary">{draft.orderId}</TableCell>
                        <TableCell className="font-medium">{getClientName(draft.eventDetails)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <HardDrive className="h-3 w-3 text-amber-500" />
                             <span className="text-[10px] uppercase font-bold text-muted-foreground">Local Only</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums">
                          {calculateBillableItems(draft.deliverables).reduce((acc, item) => acc + item.components.reduce((cAcc, c) => cAcc + c.total, 0), 0).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive opacity-0 group-hover:opacity-100"
                            onClick={(e) => handleDelete(e, draft.orderId)}
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