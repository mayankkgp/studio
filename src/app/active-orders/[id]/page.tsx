'use client';

import * as React from 'react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { MobileNav } from '@/components/layout/MobileNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHeaderSummary } from '@/hooks/use-header-summary';
import { useToast } from '@/hooks/use-toast';
import { 
    Pencil, 
    ChevronLeft, 
    Loader2, 
    Package, 
    CalendarDays, 
    MapPin, 
    Users,
    TrendingUp,
    Lock,
    Unlock,
    CheckCircle2,
    Receipt,
    WalletCards,
    ChevronUp,
    Info,
    AlertTriangle,
    Copy,
    Search,
    X
} from 'lucide-react';
import { EventDetailsForm } from '@/components/flow1/EventDetailsForm';
import { DeliverableRow } from '@/components/flow2/DeliverableRow';
import { CommandBar } from '@/components/flow2/CommandBar';
import { Accordion } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { calculateBillableItems, calculateItemBreakdown } from '@/lib/pricing';
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
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [viewMode, setViewMode] = useState<'scope' | 'bill'>('scope');
    const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
    const [isPaymentPopoverOpen, setIsPaymentPopoverOpen] = useState(false);
    const [itemSearchQuery, setItemSearchQuery] = useState('');
    
    const [projectedTotals, setProjectedTotals] = useState<Record<string, number>>({});
    const [initialTotal, setInitialTotal] = useState(0);

    const headerSummary = useHeaderSummary(activeOrder?.eventDetails || {});

    const loadOrder = useCallback(() => {
        try {
            const raw = localStorage.getItem('srishbish_active_v1');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed[id]) {
                    const order = parsed[id];
                    setActiveOrder(order);
                    
                    const items = calculateBillableItems(order.deliverables);
                    const total = items.reduce((acc, item) => 
                        acc + item.components.reduce((cAcc, c) => cAcc + c.total, 0), 0
                    );
                    setInitialTotal(total);
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
            toast({ variant: "destructive", title: "Sync Failed", description: "Could not save changes." });
        }
    }, [id, toast]);

    const patchRowToStorage = useCallback((rowId: string, itemData: ConfiguredProduct) => {
        try {
            const raw = localStorage.getItem('srishbish_active_v1');
            if (raw) {
                const parsed = JSON.parse(raw);
                const persistentOrder = parsed[id];
                if (persistentOrder) {
                    const existingIdx = persistentOrder.deliverables.findIndex((d: any) => d.id === rowId);
                    let newDeliverables = [...persistentOrder.deliverables];
                    if (existingIdx > -1) {
                        newDeliverables[existingIdx] = itemData;
                    } else {
                        newDeliverables = [itemData, ...newDeliverables];
                    }
                    
                    const updatedOrder = { 
                        ...persistentOrder, 
                        deliverables: newDeliverables,
                        lastModifiedAt: new Date().toISOString() 
                    };
                    parsed[id] = updatedOrder;
                    localStorage.setItem('srishbish_active_v1', JSON.stringify(parsed));
                    
                    const items = calculateBillableItems(newDeliverables);
                    const total = items.reduce((acc, item) => 
                        acc + item.components.reduce((cAcc, c) => cAcc + c.total, 0), 0
                    );
                    setInitialTotal(total);
                    setActiveOrder(updatedOrder);
                }
            }
        } catch (e) {
            toast({ variant: "destructive", title: "Save Failed", description: "Could not persist row changes." });
        }
    }, [id, toast]);

    const updateDeliverable = (delId: string, updates: Partial<ConfiguredProduct>) => {
        setActiveOrder(prev => {
            if (!prev) return null;
            return {
                ...prev,
                deliverables: prev.deliverables.map(d => d.id === delId ? { ...d, ...updates } : d)
            };
        });
    };

    const removeDeliverable = (delId: string) => {
        setActiveOrder(prev => {
            if (!prev) return null;
            const updated = { ...prev, deliverables: prev.deliverables.filter(d => d.id !== delId) };
            syncToStorage(updated);
            setProjectedTotals(prev => {
                const next = { ...prev };
                delete next[delId];
                return next;
            });
            return updated;
        });
        setExpandedItems(prev => prev.filter(i => i !== delId));
    };

    const addDeliverable = (del: ConfiguredProduct) => {
        setActiveOrder(prev => {
            if (!prev) return null;
            // Optimistically add to the current order state in memory
            return { ...prev, deliverables: [del, ...prev.deliverables] };
        });
        setExpandedItems(prev => [...prev, del.id]);
    };

    const handleEditRow = (rowId: string) => {
        setExpandedItems(prev => Array.from(new Set([...prev, rowId])));
    };

    const handleDoneRow = (rowId: string, isValid: boolean, confirmedData?: ConfiguredProduct) => {
        if (isValid && confirmedData) {
            patchRowToStorage(rowId, confirmedData);
        }
        setExpandedItems(prev => prev.filter(id => id !== rowId));
    };

    const handleToggleEditMode = () => {
        if (isEditMode) {
            if (expandedItems.length > 0) {
                setIsExitConfirmOpen(true);
                return;
            }
            setIsEditMode(false);
            setProjectedTotals({});
            loadOrder(); 
        } else {
            setIsEditMode(true);
            setViewMode('scope');
        }
    };

    const confirmExitEditMode = () => {
        setIsEditMode(false);
        setExpandedItems([]);
        setProjectedTotals({});
        setIsExitConfirmOpen(false);
        loadOrder();
    };

    const updateDetails = (details: EventDetails) => {
        if (!activeOrder) return;
        syncToStorage({ ...activeOrder, eventDetails: details });
    };

    const handleRecordPayment = (amount: number) => {
        if (!activeOrder) return;
        const currentTotal = activeOrder.paymentReceived || 0;
        const newTotal = Math.max(0, currentTotal + amount);
        syncToStorage({ ...activeOrder, paymentReceived: newTotal });
        setIsPaymentPopoverOpen(false);
    };

    const handleProjectedTotalChange = useCallback((id: string, total: number) => {
        setProjectedTotals(prev => {
            if (prev[id] === total) return prev;
            return { ...prev, [id]: total };
        });
    }, []);

    const workingTotal = useMemo(() => {
        if (!activeOrder) return 0;
        return activeOrder.deliverables.reduce((acc, item) => {
            const pTotal = projectedTotals[item.id];
            if (pTotal !== undefined) return acc + pTotal;
            const components = calculateItemBreakdown(item);
            return acc + components.reduce((sum, c) => sum + c.total, 0);
        }, 0);
    }, [activeOrder?.deliverables, projectedTotals]);

    const balance = workingTotal - (activeOrder?.paymentReceived || 0);
    const delta = workingTotal - initialTotal;
    const hasDiff = Math.abs(delta) > 0.01;

    const getClientDisplay = () => {
        const d = activeOrder?.eventDetails;
        if (!d) return 'Unknown Client';
        if (d.eventType === 'Wedding') return `${d.brideName} & ${d.groomName}`;
        if (d.eventType === 'Engagement') return `${d.engagementBrideName} & ${d.engagementGroomName}`;
        if (d.eventType === 'Anniversary') return `${d.wifeName} & ${d.husbandName}`;
        return d.honoreeNameBirthday || d.honoreeNameOther || d.eventName || 'Unnamed Event';
    };

    const handleCopySummary = () => {
        if (!activeOrder) return;
        
        const clientName = getClientDisplay();
        const deliverables = activeOrder.deliverables.map(item => {
            const components = calculateItemBreakdown(item);
            const itemTotal = components.reduce((sum, c) => sum + c.total, 0);
            const qty = item.quantity ? ` (x${item.quantity})` : '';
            return `• ${item.productName}${qty}: ₹${itemTotal.toLocaleString('en-IN')}`;
        }).join('\n');

        const summary = `Order #${activeOrder.orderId} Summary for ${clientName}:
${deliverables}

Total Order Value: ₹${workingTotal.toLocaleString('en-IN')}
Total Paid: ₹${(activeOrder.paymentReceived || 0).toLocaleString('en-IN')}
Current Balance Due: ₹${balance.toLocaleString('en-IN')}
        `.trim();

        navigator.clipboard.writeText(summary).then(() => {
            toast({
                title: "Summary Copied",
                description: "Order details have been copied to your clipboard.",
            });
        });
    };

    const billViewData = useMemo(() => {
        if (!activeOrder) return [];
        return activeOrder.deliverables.flatMap(item => {
            const components = calculateItemBreakdown(item);
            return components.map(c => ({
                productName: item.productName,
                label: c.label,
                multiplier: c.multiplier,
                rate: c.rate,
                total: c.total,
                isFixed: c.isFixed
            }));
        });
    }, [activeOrder?.deliverables, projectedTotals]);

    const filteredDeliverables = useMemo(() => {
        if (!activeOrder) return [];
        if (!itemSearchQuery.trim()) return activeOrder.deliverables;
        const query = itemSearchQuery.toLowerCase();
        return activeOrder.deliverables.filter(d => 
            d.productName.toLowerCase().includes(query)
        );
    }, [activeOrder?.deliverables, itemSearchQuery]);

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

    const FinancialSnapshot = (
        <div className="space-y-6">
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
                                    Close &amp; Return
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

            <Card className="shadow-sm border-2 border-primary/20 bg-background overflow-hidden">
                <CardHeader className="pb-2 bg-muted/20">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                        Live Financials
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/10" onClick={handleCopySummary} title="Copy Summary">
                                <Copy className="h-3 w-3" />
                            </Button>
                            <TrendingUp className="h-3 w-3 text-primary" />
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Order Value</p>
                        {hasDiff ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-muted-foreground/50 line-through text-sm">
                                    ₹{initialTotal.toLocaleString('en-IN')}
                                </div>
                                <div className="flex items-center justify-between group">
                                    <p className={cn(
                                        "text-4xl font-bold tracking-tight",
                                        delta > 0 ? "text-blue-600" : "text-amber-600"
                                    )}>
                                        ₹{workingTotal.toLocaleString('en-IN')}
                                    </p>
                                    <Badge variant="secondary" className={cn(
                                        "h-6 px-2 gap-1 text-[10px] font-black",
                                        delta > 0 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                        {delta > 0 ? '+' : '-'} ₹{Math.abs(delta).toLocaleString('en-IN')}
                                    </Badge>
                                </div>
                            </div>
                        ) : (
                            <p className="text-4xl font-bold tracking-tight text-foreground">₹{workingTotal.toLocaleString('en-IN')}</p>
                        )}
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Payment Received</p>
                            <Popover open={isPaymentPopoverOpen} onOpenChange={setIsPaymentPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-6 text-[9px] font-bold uppercase gap-1 text-primary hover:text-primary hover:bg-primary/5 border-primary/30">
                                        <WalletCards className="h-2.5 w-2.5" /> Record
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-4 space-y-4" align="end">
                                    <div className="space-y-1.5">
                                        <h4 className="font-bold text-xs uppercase tracking-wider">Record Payment</h4>
                                        <p className="text-[10px] text-muted-foreground">Add new payment received to the current balance.</p>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">₹</span>
                                        <input 
                                            type="number"
                                            min="0"
                                            placeholder="Enter amount"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleRecordPayment(Number(e.currentTarget.value));
                                                    (e.target as any).blur();
                                                }
                                            }}
                                            className="w-full h-10 pl-6 pr-3 text-sm font-bold border rounded-md"
                                        />
                                    </div>
                                    <Button 
                                        className="w-full h-8 text-[10px] font-bold uppercase" 
                                        onClick={(e) => {
                                            const val = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement).value;
                                            handleRecordPayment(Number(val));
                                        }}
                                    >
                                        Record Payment
                                    </Button>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="h-12 flex items-center px-4 bg-muted/30 rounded-lg border-2 border-transparent font-bold text-xl opacity-70 cursor-default">
                            ₹{(activeOrder.paymentReceived || 0).toLocaleString('en-IN')}
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
                            {balance < 0 && <span className="text-xs uppercase ml-1">(Excess)</span>}
                            {balance === 0 && <span className="text-xs uppercase ml-1">(Paid)</span>}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <AppLayout>
            <div className="flex flex-col h-screen overflow-hidden bg-background">
                <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 md:px-6 bg-background z-50">
                    <MobileNav />
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => router.push('/active-orders')}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-3">
                            <Button 
                                variant={isEditMode ? "default" : "outline"} 
                                size="sm" 
                                onClick={handleToggleEditMode}
                                className={cn(
                                    "h-8 font-bold gap-2 transition-all",
                                    isEditMode ? "bg-primary shadow-lg shadow-primary/20" : "border-primary/50 text-primary"
                                )}
                            >
                                {isEditMode ? (
                                    <><CheckCircle2 className="h-4 w-4" /> Done Editing</>
                                ) : (
                                    <><Unlock className="h-4 w-4" /> Modify Order</>
                                )}
                            </Button>
                            <Separator orientation="vertical" className="h-6" />
                            <h1 className="font-semibold text-base md:text-lg font-headline truncate">
                                {headerSummary}
                            </h1>
                        </div>
                    </div>
                </header>

                <main className="flex-1 flex overflow-hidden">
                    <div className="flex-1 overflow-y-auto bg-background/50 custom-scrollbar relative">
                        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-32">
                            <div className="flex items-center justify-between gap-4">
                                <h2 className="text-xl font-headline font-bold flex items-center gap-2 shrink-0">
                                    <Package className="h-5 w-5 text-primary" />
                                    Scope of Work
                                </h2>
                                
                                <div className="flex items-center gap-4 flex-1 justify-end">
                                    {viewMode === 'scope' && (
                                        <div className="relative max-w-[200px] hidden sm:block">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input 
                                                placeholder="Filter list..." 
                                                className="h-8 pl-8 text-xs bg-background"
                                                value={itemSearchQuery}
                                                onChange={(e) => setItemSearchQuery(e.target.value)}
                                            />
                                            {itemSearchQuery && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                                                    onClick={() => setItemSearchQuery('')}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                    <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="w-auto">
                                        <TabsList className="h-8 p-1 bg-muted/50 border">
                                            <TabsTrigger value="scope" className="text-[10px] font-bold uppercase h-6 px-3">
                                                <Info className="h-3 w-3 mr-1.5" /> Scope
                                            </TabsTrigger>
                                            <TabsTrigger value="bill" className="text-[10px] font-bold uppercase h-6 px-3">
                                                <Receipt className="h-3 w-3 mr-1.5" /> Bill View
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                    {!isEditMode && (
                                        <Badge variant="secondary" className="gap-1.5 text-[10px] font-bold uppercase tracking-wider hidden md:flex">
                                            <Lock className="h-3 w-3" /> Locked
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {isEditMode && (
                                <div className="bg-card p-4 md:p-6 rounded-xl border-2 border-primary/10 shadow-sm sticky top-0 z-40 backdrop-blur-sm bg-card/95">
                                    <CommandBar onAdd={addDeliverable} />
                                </div>
                            )}

                            {viewMode === 'scope' && (
                                <div className="sm:hidden mb-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="Search products..." 
                                            className="h-10 pl-10"
                                            value={itemSearchQuery}
                                            onChange={(e) => setItemSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {activeOrder.deliverables.length === 0 ? (
                                    <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/30">
                                        <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                                        <p className="text-sm text-muted-foreground font-medium">No deliverables in scope.</p>
                                    </div>
                                ) : viewMode === 'bill' ? (
                                    <div className="rounded-xl border bg-card overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-muted/40 border-b">
                                                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground">Product / Item</th>
                                                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground text-center">Multiplier</th>
                                                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground text-right">Rate (₹)</th>
                                                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground text-right">Total (₹)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {billViewData.map((row, i) => (
                                                    <tr key={i} className="border-b last:border-0 hover:bg-muted/10">
                                                        <td className="px-4 py-3">
                                                            <div className="font-bold text-foreground">{row.productName}</div>
                                                            <div className="text-[10px] text-muted-foreground font-medium uppercase">{row.label}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-mono">{row.isFixed ? '-' : row.multiplier}</td>
                                                        <td className="px-4 py-3 text-right tabular-nums">{row.rate.toLocaleString('en-IN')}</td>
                                                        <td className="px-4 py-3 text-right font-bold tabular-nums">{row.total.toLocaleString('en-IN')}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-primary/5 font-bold">
                                                    <td colSpan={3} className="px-4 py-4 text-right uppercase tracking-widest text-[10px]">Total Order Value</td>
                                                    <td className="px-4 py-4 text-right text-base text-primary tabular-nums">₹{workingTotal.toLocaleString('en-IN')}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <>
                                        {filteredDeliverables.length === 0 ? (
                                            <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
                                                <p className="text-muted-foreground text-sm">No items match "{itemSearchQuery}"</p>
                                                <Button variant="link" size="sm" onClick={() => setItemSearchQuery('')}>Clear filter</Button>
                                            </div>
                                        ) : (
                                            <Accordion 
                                                type="multiple" 
                                                value={expandedItems} 
                                                onValueChange={setExpandedItems}
                                                className="space-y-3"
                                            >
                                                {filteredDeliverables.map((item) => (
                                                    <DeliverableRow 
                                                        key={item.id} 
                                                        item={item} 
                                                        isReadOnly={!isEditMode}
                                                        isExpanded={expandedItems.includes(item.id)} 
                                                        isNonCollapsible={false}
                                                        onEdit={() => handleEditRow(item.id)}
                                                        onDone={handleDoneRow}
                                                        onValidityChange={() => {}}
                                                        onUpdate={updateDeliverable}
                                                        onRemove={removeDeliverable}
                                                        onProjectedTotalChange={handleProjectedTotalChange}
                                                        isPersistent={false}
                                                        manualSyncOnly={true}
                                                        showCommercials={true}
                                                    />
                                                ))}
                                            </Accordion>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <aside className="w-[24rem] shrink-0 border-l bg-card/30 hidden xl:flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar">
                        {FinancialSnapshot}
                        <div className="mt-auto pt-6 border-t flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Role: Manager</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => router.push('/active-orders')} className="h-8 text-[10px] font-bold uppercase">
                                Exit to List
                            </Button>
                        </div>
                    </aside>
                </main>

                <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-40 shadow-2xl animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center justify-between px-4 h-20">
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-bold uppercase text-muted-foreground">Order Value</p>
                            <p className={cn("text-xl font-black tabular-nums", hasDiff ? "text-primary" : "text-foreground")}>
                                ₹{workingTotal.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-[9px] font-bold uppercase text-muted-foreground">Balance</p>
                                <p className={cn("text-sm font-bold tabular-nums", balance > 0 ? "text-destructive" : "text-green-600")}>
                                    ₹{Math.abs(balance).toLocaleString('en-IN')}
                                </p>
                            </div>
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="secondary" size="icon" className="h-10 w-10 rounded-full shadow-lg">
                                        <ChevronUp className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-[80vh] px-4 pt-10 rounded-t-3xl overflow-y-auto custom-scrollbar">
                                    <SheetHeader className="sr-only">
                                        <SheetTitle>Financial Details</SheetTitle>
                                    </SheetHeader>
                                    {FinancialSnapshot}
                                    <div className="pt-8 pb-10">
                                        <Button variant="outline" className="w-full h-12 font-bold uppercase" onClick={() => router.push('/active-orders')}>
                                            Exit to List
                                        </Button>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </div>

            <AlertDialog open={isExitConfirmOpen} onOpenChange={setIsExitConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Unsaved Data Detected
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            You have one or more product configurations open. Exiting Edit Mode now will discard any unconfirmed changes in those rows.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Go Back &amp; Save</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmExitEditMode} className="bg-destructive hover:bg-destructive/90">
                            Discard Changes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted)); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.3); }
            `}</style>
        </AppLayout>
    );
}
