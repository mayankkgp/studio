'use client';

import * as React from 'react';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
    Copy,
    Search,
    X,
    ClipboardCheck,
    Save,
    Palette,
    UserCircle
} from 'lucide-react';
import { EventDetailsForm } from '@/components/flow1/EventDetailsForm';
import { DeliverableRow } from '@/components/flow2/DeliverableRow';
import { CommandBar } from '@/components/flow2/CommandBar';
import { CustomerDataForm } from '@/components/flow2/CustomerDataForm';
import { DesignReviewTab } from '@/components/design/DesignReviewTab';
import { Accordion } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { calculateBillableItems, calculateItemBreakdown } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import type { Order, ConfiguredProduct, EventDetails, CustomerData } from '@/lib/types';
import { useOrder } from '@/context/OrderContext';

export default function ActiveOrderCommandCenter() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const { toast } = useToast();
    const { setNavigationLocked, navigationAttemptCount } = useOrder();

    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [viewMode, setViewMode] = useState<'scope' | 'bill'>('scope');
    const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
    const [isPaymentPopoverOpen, setIsPaymentPopoverOpen] = useState(false);
    const [itemSearchQuery, setItemSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [isSavingBrief, setIsSavingBrief] = useState(false);
    const [isCustomerEditMode, setIsCustomerEditMode] = useState(false);
    const [simulationRole, setSimulationRole] = useState<'MANAGER' | 'DESIGNER'>('MANAGER');
    
    const [projectedTotals, setProjectedTotals] = useState<Record<string, number>>({});
    const [initialTotal, setInitialTotal] = useState(0);

    const [shakeHeaderButton, setShakeHeaderButton] = useState(false);
    const headerButtonRef = useRef<HTMLButtonElement>(null);

    const hasUnsavedChanges = isEditMode || isCustomerEditMode;

    useEffect(() => {
        setNavigationLocked(hasUnsavedChanges);
    }, [hasUnsavedChanges, setNavigationLocked]);

    useEffect(() => {
        if (navigationAttemptCount > 0 && hasUnsavedChanges) {
            setShakeHeaderButton(true);
            const timer = setTimeout(() => setShakeHeaderButton(false), 500);
            return () => clearTimeout(timer);
        }
    }, [navigationAttemptCount, hasUnsavedChanges]);

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
            const parsed = raw ? JSON.parse(raw) : {};
            parsed[id] = { ...updatedOrder, lastModifiedAt: new Date().toISOString() };
            localStorage.setItem('srishbish_active_v1', JSON.stringify(parsed));
            setActiveOrder(updatedOrder);
        } catch (e: any) {
            console.error('Storage Sync Error:', e);
            const isQuotaError = e.name === 'QuotaExceededError' || e.code === 22 || e.name === 'NS_ERROR_DOM_QUOTA_REACHED';
            toast({ 
                variant: "destructive", 
                title: isQuotaError ? "Storage Full" : "Sync Failed", 
                description: isQuotaError 
                    ? "Your browser storage is full. Please delete some old drafts or active orders to save new designs." 
                    : "Could not save changes to local storage." 
            });
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
        } catch (e: any) {
            const isQuotaError = e.name === 'QuotaExceededError' || e.code === 22;
            toast({ 
                variant: "destructive", 
                title: "Save Failed", 
                description: isQuotaError ? "Storage full. Could not persist row." : "Unknown storage error." 
            });
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

    const handleSaveCustomerData = (data: CustomerData) => {
        if (!activeOrder) return;
        setIsSavingBrief(true);
        setTimeout(() => {
            syncToStorage({ ...activeOrder, customerData: data });
            setIsSavingBrief(false);
            setIsCustomerEditMode(false);
            toast({ title: "Brief Saved", description: "Creative data updated." });
        }, 600);
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
        const summary = `Order #${activeOrder.orderId} Summary for ${clientName}: \nTotal Value: ₹${workingTotal.toLocaleString('en-IN')}\nBalance: ₹${balance.toLocaleString('en-IN')}`;
        navigator.clipboard.writeText(summary).then(() => {
            toast({ title: "Summary Copied" });
        });
    };

    const handleTabChange = (val: string) => {
        if (hasUnsavedChanges) {
            setShakeHeaderButton(true);
            setTimeout(() => setShakeHeaderButton(false), 500);
            toast({ variant: "destructive", title: "Unsaved Changes", description: "Save or cancel edits first." });
            return;
        }
        setActiveTab(val);
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
    }, [activeOrder?.deliverables]);

    const filteredDeliverables = useMemo(() => {
        if (!activeOrder) return [];
        if (!itemSearchQuery.trim()) return activeOrder.deliverables;
        const query = itemSearchQuery.toLowerCase();
        return activeOrder.deliverables.filter(d => d.productName.toLowerCase().includes(query));
    }, [activeOrder?.deliverables, itemSearchQuery]);

    if (loading) return <AppLayout><div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
    if (!activeOrder) return <AppLayout><div className="flex h-screen flex-col items-center justify-center gap-4"><p>Order not found.</p><Button onClick={() => router.push('/active-orders')}>Back</Button></div></AppLayout>;

    const FinancialSnapshot = (
        <div className="space-y-6">
            <Card className="shadow-none border-primary/20">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Event Snapshot</CardTitle>
                    <Sheet open={isDetailsSheetOpen} onOpenChange={setIsDetailsSheetOpen}>
                        <SheetTrigger asChild><Button variant="ghost" size="sm" className="h-7 px-2 text-primary"><Pencil className="h-3 w-3 mr-1.5" /> Edit</Button></SheetTrigger>
                        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
                            <SheetHeader className="mb-6"><SheetTitle className="font-headline text-2xl">Modify Event</SheetTitle></SheetHeader>
                            <EventDetailsForm activeOrder={activeOrder} onUpdate={updateDetails} hideFooters />
                            <div className="mt-8 pt-6 border-t"><Button className="w-full" onClick={() => setIsDetailsSheetOpen(false)}>Close</Button></div>
                        </SheetContent>
                    </Sheet>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-lg font-bold font-headline">{getClientDisplay()}</p>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                        <div><div className="text-muted-foreground uppercase text-[9px] font-bold">Date</div><p className="text-xs font-bold">{activeOrder.eventDetails.eventDate ? new Date(activeOrder.eventDetails.eventDate).toLocaleDateString('en-IN') : '-'}</p></div>
                        <div><div className="text-muted-foreground uppercase text-[9px] font-bold">Venue</div><p className="text-xs font-bold truncate">{activeOrder.eventDetails.venueName || '-'}</p></div>
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-sm border-2 border-primary/20 bg-background overflow-hidden">
                <CardHeader className="pb-2 bg-muted/30"><CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">Financials <TrendingUp className="h-3 w-3 text-primary" /></CardTitle></CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Order Value</p><p className="text-4xl font-bold">₹{workingTotal.toLocaleString('en-IN')}</p></div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Paid</p>
                            <Popover open={isPaymentPopoverOpen} onOpenChange={setIsPaymentPopoverOpen}>
                                <PopoverTrigger asChild><Button variant="outline" size="sm" className="h-6 text-[9px] font-bold uppercase gap-1 text-primary">Record</Button></PopoverTrigger>
                                <PopoverContent className="w-64 p-4 space-y-4">
                                    <h4 className="font-bold text-xs uppercase">Record Payment</h4>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">₹</span>
                                        <input type="number" min="0" className="w-full h-10 pl-6 pr-3 text-sm font-bold border-2 border-primary/20 rounded-md focus:border-primary" onKeyDown={(e) => e.key === 'Enter' && handleRecordPayment(Number(e.currentTarget.value))} />
                                    </div>
                                    <Button className="w-full h-8 text-[10px] font-bold" onClick={(e) => handleRecordPayment(Number((e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement).value))}>Save</Button>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="h-12 flex items-center px-4 bg-muted/40 rounded-lg font-bold text-xl">₹{(activeOrder.paymentReceived || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <Separator />
                    <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Balance</p><p className={cn("text-2xl font-bold", balance > 0 ? "text-destructive" : "text-green-700")}>₹{Math.abs(balance).toLocaleString('en-IN')}</p></div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <AppLayout>
            <div className="flex flex-col h-screen overflow-hidden bg-background">
                <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 md:px-6 bg-background z-50">
                    <MobileNav />
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => router.push('/active-orders')}><ChevronLeft className="h-5 w-5" /></Button>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-3">
                            <h1 className="font-bold text-base md:text-lg font-headline truncate">{headerSummary}</h1>
                            {activeTab === 'overview' && (
                                <Button ref={headerButtonRef} variant={isEditMode ? "default" : "outline"} size="sm" onClick={handleToggleEditMode} className={cn("h-8 font-bold gap-2", isEditMode && shakeHeaderButton && "animate-shake")}>
                                    {isEditMode ? <><CheckCircle2 className="h-4 w-4" /> Done Editing</> : <><Unlock className="h-4 w-4" /> Modify Order</>}
                                </Button>
                            )}
                            {activeTab === 'customer' && (
                                <div className="flex items-center gap-2">
                                    {!isCustomerEditMode ? (
                                        <Button variant="outline" size="sm" onClick={() => setIsCustomerEditMode(true)} className="h-8 font-bold gap-2 text-[11px] uppercase tracking-widest"><Pencil className="h-3.5 w-3.5" /> Edit Brief</Button>
                                    ) : (
                                        <Button ref={headerButtonRef} size="sm" type="submit" form="creative-brief-form" disabled={isSavingBrief} className={cn("h-8 font-bold gap-2", shakeHeaderButton && "animate-shake")}>
                                            {isSavingBrief ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Brief
                                        </Button>
                                    )}
                                </div>
                            )}
                            {activeTab === 'design' && (
                                <div className="flex items-center gap-4 ml-auto">
                                    <Tabs value={simulationRole} onValueChange={(v: any) => setSimulationRole(v)}>
                                        <TabsList className="h-8 bg-muted/40 border p-1">
                                            <TabsTrigger value="MANAGER" className="text-[10px] font-black uppercase h-6 gap-1.5"><Users className="h-3 w-3" /> Manager</TabsTrigger>
                                            <TabsTrigger value="DESIGNER" className="text-[10px] font-black uppercase h-6 gap-1.5"><UserCircle className="h-3 w-3" /> Designer</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 md:px-8 border-b bg-muted/20">
                        <TabsList className="h-12 bg-transparent p-0 gap-8">
                            <TabsTrigger value="overview" className="h-12 rounded-none border-b-2 border-transparent font-bold text-xs uppercase tracking-widest"><Package className="h-4 w-4 mr-2" /> Overview</TabsTrigger>
                            <TabsTrigger value="customer" className="h-12 rounded-none border-b-2 border-transparent font-bold text-xs uppercase tracking-widest"><ClipboardCheck className="h-4 w-4 mr-2" /> Customer Data</TabsTrigger>
                            <TabsTrigger value="design" className="h-12 rounded-none border-b-2 border-transparent font-bold text-xs uppercase tracking-widest"><Palette className="h-4 w-4 mr-2" /> Design</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 relative">
                        <TabsContent value="overview" className="absolute inset-0 m-0 outline-none overflow-hidden">
                            <div className="flex h-full w-full overflow-hidden">
                                <main className="flex-1 overflow-y-auto bg-background/50 relative p-4 md:p-8 space-y-8 pb-32">
                                    <div className="max-w-4xl mx-auto space-y-8">
                                        <div className="flex items-center justify-between gap-4">
                                            <h2 className="text-xl font-headline font-bold flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Scope of Work</h2>
                                            <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                                                <TabsList className="h-8 p-1 bg-muted/40 border border-primary/20">
                                                    <TabsTrigger value="scope" className="text-[10px] font-bold uppercase h-6 px-3">Scope</TabsTrigger>
                                                    <TabsTrigger value="bill" className="text-[10px] font-bold uppercase h-6 px-3">Bill View</TabsTrigger>
                                                </TabsList>
                                            </Tabs>
                                        </div>
                                        {isEditMode && viewMode !== 'bill' && <div className="bg-card p-4 rounded-xl border-2 border-primary/20 shadow-sm sticky top-0 z-40"><CommandBar onAdd={addDeliverable} /></div>}
                                        <div className="space-y-4">
                                            {activeOrder.deliverables.length === 0 ? <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/20 border-primary/20"><p className="text-sm text-muted-foreground font-bold">No deliverables.</p></div> : 
                                            viewMode === 'bill' ? (
                                                <div className="rounded-xl border border-primary/20 bg-card overflow-hidden shadow-sm">
                                                    <table className="w-full text-left text-xs border-collapse">
                                                        <thead><tr className="bg-muted/40 border-b border-primary/10"><th className="px-4 py-3 font-bold uppercase">Product / Item</th><th className="px-4 py-3 font-bold uppercase text-center">Multiplier</th><th className="px-4 py-3 font-bold uppercase text-right">Rate</th><th className="px-4 py-3 font-bold uppercase text-right">Total</th></tr></thead>
                                                        <tbody>
                                                            {billViewData.map((row, i) => (
                                                                <tr key={i} className="border-b border-primary/5 last:border-0 hover:bg-primary/5 transition-colors"><td className="px-4 py-3"><div className="font-bold">{row.productName}</div><div className="text-[10px] text-muted-foreground font-bold uppercase">{row.label}</div></td><td className="px-4 py-3 text-center font-mono font-bold">{row.isFixed ? '-' : row.multiplier}</td><td className="px-4 py-3 text-right">{row.rate.toLocaleString('en-IN')}</td><td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">{row.total.toLocaleString('en-IN')}</td></tr>
                                                            ))}
                                                            <tr className="bg-primary/5 font-bold"><td colSpan={3} className="px-4 py-4 text-right uppercase tracking-widest text-[10px] text-muted-foreground">Total</td><td className="px-4 py-4 text-right text-base text-primary tabular-nums font-black">₹{workingTotal.toLocaleString('en-IN')}</td></tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-3">
                                                    {filteredDeliverables.map((item) => (
                                                        <DeliverableRow key={item.id} item={item} isReadOnly={!isEditMode} isExpanded={expandedItems.includes(item.id)} onEdit={() => handleEditRow(item.id)} onDone={handleDoneRow} onValidityChange={() => {}} onUpdate={updateDeliverable} onRemove={removeDeliverable} onProjectedTotalChange={handleProjectedTotalChange} isPersistent={true} manualSyncOnly={true} showCommercials={true} />
                                                    ))}
                                                </Accordion>
                                            )}
                                        </div>
                                    </div>
                                </main>
                                <aside className="w-[24rem] shrink-0 border-l border-primary/20 bg-card/30 hidden xl:flex flex-col p-6 gap-6 overflow-y-auto">{FinancialSnapshot}</aside>
                            </div>
                        </TabsContent>
                        <TabsContent value="customer" className="absolute inset-0 m-0 outline-none overflow-y-auto custom-scrollbar bg-background/50"><div className="max-w-5xl mx-auto p-4 md:p-12"><CustomerDataForm order={activeOrder} onSave={handleSaveCustomerData} isSaving={isSavingBrief} isEditMode={isCustomerEditMode} onEnterEditMode={() => setIsCustomerEditMode(true)} /></div></TabsContent>
                        <TabsContent value="design" className="absolute inset-0 m-0 outline-none overflow-hidden"><DesignReviewTab order={activeOrder} onUpdateOrder={syncToStorage} role={simulationRole} /></TabsContent>
                    </div>
                </Tabs>
            </div>
        </AppLayout>
    );
}
