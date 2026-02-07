'use client';

import * as React from 'react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { MobileNav } from '@/components/layout/MobileNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useHeaderSummary } from '@/hooks/use-header-summary';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Save, ChevronLeft, Loader2, DollarSign, Package, CalendarDays } from 'lucide-react';
import { EventDetailsForm } from '@/components/flow1/EventDetailsForm';
import { DeliverableRow } from '@/components/flow2/DeliverableRow';
import { CommandBar } from '@/components/flow2/CommandBar';
import { Accordion } from '@/components/ui/accordion';
import { calculateBillableItems } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import type { Order, ConfiguredProduct, BillableItem } from '@/lib/types';

export default function ActiveOrderViewer() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const { toast } = useToast();

    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState<Record<string, boolean>>({
        details: false,
        deliverables: false,
        commercials: false
    });

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

    const saveOrder = async (updatedOrder: Order) => {
        try {
            const raw = localStorage.getItem('srishbish_active_v1');
            if (raw) {
                const parsed = JSON.parse(raw);
                parsed[id] = { ...updatedOrder, activatedAt: new Date().toISOString() };
                localStorage.setItem('srishbish_active_v1', JSON.stringify(parsed));
                setActiveOrder(updatedOrder);
                toast({ title: "Order Updated", description: "Changes saved successfully." });
            }
        } catch (e) {
            toast({ variant: "destructive", title: "Save Failed", description: "Could not update order." });
        }
    };

    const toggleEdit = (tab: string) => {
        setEditMode(prev => ({ ...prev, [tab]: !prev[tab] }));
    };

    const updateDeliverable = (delId: string, updates: Partial<ConfiguredProduct>) => {
        if (!activeOrder) return;
        const newDeliverables = activeOrder.deliverables.map(d => d.id === delId ? { ...d, ...updates } : d);
        setActiveOrder({ ...activeOrder, deliverables: newDeliverables });
    };

    const removeDeliverable = (delId: string) => {
        if (!activeOrder) return;
        const newDeliverables = activeOrder.deliverables.filter(d => d.id !== delId);
        setActiveOrder({ ...activeOrder, deliverables: newDeliverables });
    };

    const addDeliverable = (del: ConfiguredProduct) => {
        if (!activeOrder) return;
        setActiveOrder({ ...activeOrder, deliverables: [del, ...activeOrder.deliverables] });
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
                <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 md:px-6 bg-background z-50">
                    <MobileNav />
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => router.push('/active-orders')}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 overflow-hidden">
                        <h1 className="font-semibold text-base md:text-lg font-headline truncate">
                            {headerSummary}
                        </h1>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Active Order View</p>
                    </div>
                    <div className="hidden lg:block font-mono text-xs opacity-50">{activeOrder.orderId}</div>
                </header>

                <main className="flex-1 overflow-hidden flex flex-col">
                    <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-4 md:px-6 border-b bg-card/30">
                            <TabsList className="h-14 bg-transparent gap-6">
                                <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 border-primary rounded-none px-0 h-14 font-bold text-xs uppercase tracking-wider gap-2">
                                    <CalendarDays className="h-3.5 w-3.5" /> Details
                                </TabsTrigger>
                                <TabsTrigger value="deliverables" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 border-primary rounded-none px-0 h-14 font-bold text-xs uppercase tracking-wider gap-2">
                                    <Package className="h-3.5 w-3.5" /> Deliverables
                                </TabsTrigger>
                                <TabsTrigger value="commercials" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 border-primary rounded-none px-0 h-14 font-bold text-xs uppercase tracking-wider gap-2">
                                    <DollarSign className="h-3.5 w-3.5" /> Commercials
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
                            <TabsContent value="details" className="mt-0 focus-visible:ring-0">
                                <div className="max-w-3xl mx-auto space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-headline font-bold">Event Specifics</h2>
                                        <Button 
                                            variant={editMode.details ? "default" : "outline"} 
                                            size="sm" 
                                            onClick={() => editMode.details ? saveOrder(activeOrder).then(() => toggleEdit('details')) : toggleEdit('details')}
                                            className="gap-2"
                                        >
                                            {editMode.details ? <Save className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                                            {editMode.details ? "Save" : "Edit"}
                                        </Button>
                                    </div>
                                    <div className={cn("transition-all", !editMode.details && "pointer-events-none opacity-90")}>
                                        <EventDetailsForm activeOrder={activeOrder} onUpdate={(details) => setActiveOrder({...activeOrder, eventDetails: details})} hideFooters />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="deliverables" className="mt-0 focus-visible:ring-0">
                                <div className="max-w-4xl mx-auto space-y-8">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-headline font-bold">Scope of Work</h2>
                                        <Button 
                                            variant={editMode.deliverables ? "default" : "outline"} 
                                            size="sm" 
                                            onClick={() => editMode.deliverables ? saveOrder(activeOrder).then(() => toggleEdit('deliverables')) : toggleEdit('deliverables')}
                                            className="gap-2"
                                        >
                                            {editMode.deliverables ? <Save className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                                            {editMode.deliverables ? "Save" : "Edit"}
                                        </Button>
                                    </div>
                                    
                                    {editMode.deliverables && (
                                        <div className="bg-card p-6 rounded-xl border-2 border-primary/20 shadow-sm">
                                            <CommandBar onAdd={addDeliverable} />
                                        </div>
                                    )}

                                    <div className={cn("space-y-2", !editMode.deliverables && "pointer-events-none")}>
                                        <Accordion type="multiple" defaultValue={activeOrder.deliverables.map(d => d.id)} className="space-y-3">
                                            {activeOrder.deliverables.map((item) => (
                                                <DeliverableRow 
                                                    key={item.id} 
                                                    item={item} 
                                                    isExpanded={editMode.deliverables} 
                                                    isNonCollapsible={true}
                                                    onEdit={() => {}}
                                                    onDone={() => {}}
                                                    onValidityChange={() => {}}
                                                    onUpdate={updateDeliverable}
                                                    onRemove={removeDeliverable}
                                                    isPersistent={!editMode.deliverables}
                                                />
                                            ))}
                                        </Accordion>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="commercials" className="mt-0 focus-visible:ring-0">
                                <div className="max-w-4xl mx-auto space-y-8 pb-12">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-headline font-bold">Billing Breakdown</h2>
                                        <Button 
                                            variant={editMode.commercials ? "default" : "outline"} 
                                            size="sm" 
                                            onClick={() => editMode.commercials ? saveOrder(activeOrder).then(() => toggleEdit('commercials')) : toggleEdit('commercials')}
                                            className="gap-2"
                                        >
                                            {editMode.commercials ? <Save className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                                            {editMode.commercials ? "Save" : "Edit"}
                                        </Button>
                                    </div>

                                    <div className="grid lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-2 space-y-4">
                                            <div className="rounded-xl border overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted/50 border-b">
                                                        <tr>
                                                            <th className="p-3 text-left font-bold uppercase text-[10px]">Line Item</th>
                                                            <th className="p-3 text-center font-bold uppercase text-[10px] w-20">Mult</th>
                                                            <th className="p-3 text-right font-bold uppercase text-[10px] w-28">Rate (₹)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {billableItems.map((item) => (
                                                            <React.Fragment key={item.configuredProductId}>
                                                                <tr className="bg-muted/30">
                                                                    <td colSpan={3} className="p-3 font-bold text-primary">{item.productName}</td>
                                                                </tr>
                                                                {item.components.map((comp, idx) => (
                                                                    <tr key={idx} className="hover:bg-muted/10">
                                                                        <td className="p-3 pl-8 text-muted-foreground">{comp.label}</td>
                                                                        <td className="p-3 text-center font-mono">{comp.isFixed ? "-" : comp.multiplier}</td>
                                                                        <td className="p-3 text-right">
                                                                            {editMode.commercials ? (
                                                                                <input 
                                                                                    type="number"
                                                                                    defaultValue={comp.rate}
                                                                                    className="w-full h-8 text-right bg-background border rounded px-2"
                                                                                    onBlur={(e) => {
                                                                                        const deliverable = activeOrder.deliverables.find(d => d.id === item.configuredProductId);
                                                                                        if (deliverable) {
                                                                                            const rateOverrides = { ...(deliverable.rateOverrides || {}), [comp.label]: Number(e.target.value) };
                                                                                            updateDeliverable(deliverable.id, { rateOverrides });
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <span className="font-semibold">{comp.rate.toLocaleString('en-IN')}</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </React.Fragment>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div className="space-y-6 bg-card p-6 rounded-xl border border-primary/20 shadow-sm self-start sticky top-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Total Order Value</p>
                                                <p className="text-4xl font-bold tracking-tight">₹{totalValue.toLocaleString('en-IN')}</p>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Payment Received</p>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                                    <input 
                                                        disabled={!editMode.commercials}
                                                        type="number"
                                                        value={activeOrder.paymentReceived || ''}
                                                        onChange={(e) => setActiveOrder({...activeOrder, paymentReceived: Number(e.target.value)})}
                                                        className="w-full h-10 pl-7 pr-4 rounded-md border bg-background font-bold text-lg disabled:bg-muted/50"
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t">
                                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Balance Due</p>
                                                <p className={cn("text-2xl font-bold", balance > 0 ? "text-destructive" : "text-green-600")}>
                                                    ₹{Math.abs(balance).toLocaleString('en-IN')}
                                                    {balance < 0 && " (Excess)"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </main>
            </div>
        </AppLayout>
    );
}
