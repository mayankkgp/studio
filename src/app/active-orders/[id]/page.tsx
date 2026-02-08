'use client';

import * as React from 'react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { MobileNav } from '@/components/layout/MobileNav';
import { Button } from '@/components/ui/button';
import { useHeaderSummary } from '@/hooks/use-header-summary';
import { useToast } from '@/hooks/use-toast';
import { 
    Pencil, 
    ChevronLeft, 
    Loader2, 
    DollarSign, 
    Package, 
    CalendarDays, 
    MapPin, 
    Users,
    TrendingUp
} from 'lucide-react';
import { EventDetailsForm } from '@/components/flow1/EventDetailsForm';
import { DeliverableRow } from '@/components/flow2/DeliverableRow';
import { CommandBar } from '@/components/flow2/CommandBar';
import { Accordion } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { calculateBillableItems } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import type { Order, ConfiguredProduct, EventDetails } from '@/lib/types';

export default function ActiveOrderCommandCenter() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const { toast } = useToast();

    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);

    const headerSummary = useHeaderSummary(activeOrder?.eventDetails || {});

    const loadOrder = useCallback(() => {
        try {
            const raw = localStorage.getItem('srishbish_active_v1');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed[id]) {
                    setActiveOrder(parsed[id]);
                }
            }
        } catch (e) {
            console.error('Failed to load order', e);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    const syncToStorage = useCallback((updatedOrder: Order) => {
        try {
            const raw = localStorage.getItem('srishbish_active_v1');
            if (raw) {
                const parsed = JSON.parse(raw);
                parsed[id] = { ...updatedOrder, lastModifiedAt: new Date().toISOString() };
                localStorage.setItem('srishbish_active_v1', JSON.stringify(parsed));
                setActiveOrder(updatedOrder);
            }
        } catch (e) {
            toast({ variant: "destructive", title: "Sync Failed", description: "Could not save changes to local storage." });
        }
    }, [id, toast]);

    const updateDeliverable = (delId: string, updates: Partial<ConfiguredProduct>) => {
        if (!activeOrder) return;
        const newDeliverables = activeOrder.deliverables.map(d => d.id === delId ? { ...d, ...updates } : d);
        syncToStorage({ ...activeOrder, deliverables: newDeliverables });
    };

    const removeDeliverable = (delId: string) => {
        if (!activeOrder) return;
        const newDeliverables = activeOrder.deliverables.filter(d => d.id !== delId);
        syncToStorage({ ...activeOrder, deliverables: newDeliverables });
    };

    const addDeliverable = (del: ConfiguredProduct) => {
        if (!activeOrder) return;
        syncToStorage({ ...activeOrder, deliverables: [del, ...activeOrder.deliverables] });
    };

    const updateDetails = (details: EventDetails) => {
        if (!activeOrder) return;
        syncToStorage({ ...activeOrder, eventDetails: details });
    };

    const updatePayment = (amount: number) => {
        if (!activeOrder) return;
        syncToStorage({ ...activeOrder, paymentReceived: amount });
    };

    const billableItems = useMemo(() => {
        return activeOrder ? calculateBillableItems(activeOrder.deliverables) : [];
    }, [activeOrder]);

    const totalValue = useMemo(() => {
        return billableItems.reduce((acc, item) => 
            acc + item.components.reduce((cAcc, c) => cAcc + c.total, 0), 0
        );
    }, [billableItems]);

    const balance = totalValue - (activeOrder?.paymentReceived || 0);

    const getClientDisplay = () => {
        const d = activeOrder?.eventDetails;
        if (!d) return 'Unknown Client';
        if (d.eventType === 'Wedding') return `${d.brideName} & ${d.groomName}`;
        if (d.eventType === 'Engagement') return `${d.engagementBrideName} & ${d.engagementGroomName}`;
        if (d.eventType === 'Anniversary') return `${d.wifeName} & ${d.husbandName}`;
        return d.honoreeNameBirthday || d.honoreeNameOther || d.eventName || 'Unnamed Event';
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }

    if (!activeOrder) {
        return (
            <AppLayout>
                <div className="flex h-screen flex-col items-center justify-center gap-4">
                    <p className="text-muted-foreground font-medium">Order not found.</p>
                    <Button variant="outline" onClick={() => router.push('/active-orders')}>
                        <ChevronLeft className="h-4 w-4 mr-2" /> Back to List
                    </Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex flex-col h-screen overflow-hidden bg-background">
                {/* Header Area */}
                <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 md:px-6 bg-background z-50">
                    <MobileNav />
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => router.push('/active-orders')}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 overflow-hidden">
                        <h1 className="font-semibold text-base md:text-lg font-headline truncate">
                            {headerSummary}
                        </h1>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Command Center</p>
                    </div>
                    <div className="hidden lg:block font-mono text-xs opacity-50 bg-muted px-2 py-1 rounded">
                        {activeOrder.orderId}
                    </div>
                </header>

                <main className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Scope of Work */}
                    <div className="flex-1 overflow-y-auto bg-background/50 custom-scrollbar">
                        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-24">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-headline font-bold flex items-center gap-2">
                                    <Package className="h-5 w-5 text-primary" />
                                    Scope of Work
                                </h2>
                                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {activeOrder.deliverables.length} Items
                                </span>
                            </div>

                            {/* Always Active Command Bar */}
                            <div className="bg-card p-4 md:p-6 rounded-xl border-2 border-primary/10 shadow-sm sticky top-0 z-40 backdrop-blur-sm bg-card/95">
                                <CommandBar onAdd={addDeliverable} />
                            </div>

                            {/* Interactive Deliverables List */}
                            <div className="space-y-4">
                                {activeOrder.deliverables.length === 0 ? (
                                    <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/30">
                                        <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                                        <p className="text-sm text-muted-foreground font-medium">No deliverables added yet.</p>
                                        <p className="text-xs text-muted-foreground mt-1">Search products above to build the scope.</p>
                                    </div>
                                ) : (
                                    <Accordion type="multiple" defaultValue={activeOrder.deliverables.map(d => d.id)} className="space-y-3">
                                        {activeOrder.deliverables.map((item) => (
                                            <DeliverableRow 
                                                key={item.id} 
                                                item={item} 
                                                isExpanded={true} 
                                                isNonCollapsible={false}
                                                onEdit={() => {}}
                                                onDone={() => {}}
                                                onValidityChange={() => {}}
                                                onUpdate={updateDeliverable}
                                                onRemove={removeDeliverable}
                                                isPersistent={false}
                                            />
                                        ))}
                                    </Accordion>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar: Snapshot & Financials */}
                    <aside className="w-[24rem] shrink-0 border-l bg-card/30 hidden xl:flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar">
                        
                        {/* Event Snapshot */}
                        <Card className="shadow-none border-primary/10">
                            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Event Snapshot</CardTitle>
                                <Sheet open={isDetailsSheetOpen} onOpenChange={setIsDetailsSheetOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-7 px-2 text-primary hover:text-primary hover:bg-primary/10">
                                            <Pencil className="h-3 w-3 mr-1.5" /> Edit
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
                                        <SheetHeader className="mb-6">
                                            <SheetTitle className="font-headline text-2xl">Modify Event Details</SheetTitle>
                                        </SheetHeader>
                                        <EventDetailsForm 
                                            activeOrder={activeOrder} 
                                            onUpdate={(details) => {
                                                updateDetails(details);
                                            }} 
                                            hideFooters 
                                        />
                                        <div className="mt-8 pt-6 border-t">
                                            <Button className="w-full" onClick={() => setIsDetailsSheetOpen(false)}>
                                                Close & Return
                                            </Button>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-lg font-bold font-headline leading-tight">{getClientDisplay()}</p>
                                    <p className="text-xs text-primary font-bold uppercase">{activeOrder.eventDetails.eventType}</p>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-muted-foreground uppercase text-[9px] font-bold">
                                            <CalendarDays className="h-3 w-3" /> Event Date
                                        </div>
                                        <p className="text-xs font-semibold">
                                            {activeOrder.eventDetails.eventDate ? new Date(activeOrder.eventDetails.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-muted-foreground uppercase text-[9px] font-bold">
                                            <MapPin className="h-3 w-3" /> Venue
                                        </div>
                                        <p className="text-xs font-semibold truncate" title={activeOrder.eventDetails.venueName || '-'}>
                                            {activeOrder.eventDetails.venueName || '-'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Live Financials */}
                        <Card className="shadow-sm border-2 border-primary/20 bg-background">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                                    Live Financials
                                    <TrendingUp className="h-3 w-3 text-primary" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Total Order Value</p>
                                    <p className="text-4xl font-bold tracking-tight text-foreground">₹{totalValue.toLocaleString('en-IN')}</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Payment Received</p>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                        <input 
                                            type="number"
                                            value={activeOrder.paymentReceived || ''}
                                            onChange={(e) => updatePayment(Number(e.target.value))}
                                            className="w-full h-12 pl-7 pr-4 rounded-lg border-2 border-muted bg-muted/20 font-bold text-xl focus:border-primary focus:ring-0 transition-colors"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Current Balance Due</p>
                                    <p className={cn(
                                        "text-2xl font-bold flex items-baseline gap-1.5", 
                                        balance > 0 ? "text-destructive" : "text-green-600"
                                    )}>
                                        ₹{Math.abs(balance).toLocaleString('en-IN')}
                                        {balance < 0 && <span className="text-xs uppercase">(Excess)</span>}
                                        {balance === 0 && <span className="text-xs uppercase">(Paid)</span>}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Stats Placeholder */}
                        <div className="mt-auto pt-6 border-t flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Team Access: Admin</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => router.push('/active-orders')} className="h-8 text-[10px] font-bold uppercase">
                                Exit to List
                            </Button>
                        </div>
                    </aside>
                </main>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted)); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.3); }
            `}</style>
        </AppLayout>
    );
}
