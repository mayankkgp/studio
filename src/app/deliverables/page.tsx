'use client';

import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { useOrder } from "@/context/OrderContext";
import { useRouter } from "next/navigation";
import { useHeaderSummary } from '@/hooks/use-header-summary';
import { CommandBar } from "@/components/flow2/CommandBar";
import { DeliverableRow } from "@/components/flow2/DeliverableRow";
import { Package, CheckCircle2, AlertCircle } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

export default function DeliverablesPage() {
    const router = useRouter();
    const { order, saveAsDraft, updateDeliverable, removeDeliverable } = useOrder();
    const { toast } = useToast();
    const headerSummary = useHeaderSummary(order.eventDetails);
    
    const [openItems, setOpenItems] = useState<string[]>([]);
    const [rowStatus, setRowStatus] = useState<Record<string, { isValid: boolean, isInteracting: boolean }>>({});
    const prevCount = useRef(order.deliverables.length);

    // Track previously active items to handle "Sticky" movement logic
    const activeIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (order.deliverables.length > prevCount.current) {
            const newItem = order.deliverables[order.deliverables.length - 1];
            setOpenItems(prev => Array.from(new Set([...prev, newItem.id])));
            setTimeout(() => {
                const el = document.getElementById(`deliverable-${newItem.id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
        prevCount.current = order.deliverables.length;
    }, [order.deliverables]);

    const handleValidityChange = useCallback((id: string, isValid: boolean, isInteracting: boolean) => {
        setRowStatus(prev => {
            const current = prev[id];
            if (current?.isValid === isValid && current?.isInteracting === isInteracting) return prev;
            return { ...prev, [id]: { isValid, isInteracting } };
        });
    }, []);

    const handleDone = useCallback((id: string) => {
        setOpenItems(prev => prev.filter(itemId => itemId !== id));
    }, []);

    const handleValueChange = useCallback((newValues: string[]) => {
        const closingIds = openItems.filter(id => !newValues.includes(id));
        const invalidClosingIds = closingIds.filter(id => rowStatus[id]?.isValid === false);

        if (invalidClosingIds.length > 0) {
            // Re-open invalid items (Locked State)
            setOpenItems(Array.from(new Set([...newValues, ...invalidClosingIds])));
            return;
        }

        setOpenItems(newValues);
    }, [openItems, rowStatus]);

    // Split items into Action Required and Order List
    const { activeItems, orderListItems } = useMemo(() => {
        const active: any[] = [];
        const list: any[] = [];

        order.deliverables.forEach(item => {
            const status = rowStatus[item.id];
            
            // Movement Trigger Logic:
            // 1. Move to Action Required if Invalid AND (Closed OR Not Interacting)
            // 2. Stay in current section if Interacting (Typing) or if Valid
            
            const shouldBeActive = status 
                ? (!status.isValid && (!status.isInteracting || activeIdsRef.current.has(item.id)))
                : true;

            if (shouldBeActive) {
                active.push(item);
            } else {
                list.push(item);
            }
        });

        // Update tracking ref for next render
        activeIdsRef.current = new Set(active.map(i => i.id));

        return { 
            activeItems: active, 
            orderListItems: [...list].reverse() 
        };
    }, [order.deliverables, rowStatus]);

    const handleNextStep = useCallback(() => {
        const firstInvalidId = order.deliverables.find(item => rowStatus[item.id]?.isValid === false)?.id;
        
        if (firstInvalidId) {
            toast({
                variant: "destructive",
                title: "Incomplete Items",
                description: "Please complete all required fields before moving to commercials."
            });
            if (!openItems.includes(firstInvalidId)) {
                setOpenItems(prev => [...prev, firstInvalidId]);
            }
            setTimeout(() => {
                const el = document.getElementById(`deliverable-${firstInvalidId}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
        }

        if (order.deliverables.length === 0) {
            toast({ variant: "destructive", title: "No Items", description: "Add a product to continue." });
            return;
        }

        router.push('/commercials');
    }, [rowStatus, openItems, order.deliverables, router, toast]);

    return (
        <AppLayout>
            <div className="flex flex-col h-screen overflow-hidden">
                <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
                    <MobileNav />
                    <div className="flex-1">
                        <h1 className="font-semibold text-lg md:text-xl font-headline truncate" title={headerSummary}>
                            {headerSummary}
                        </h1>
                        <p className="text-sm text-muted-foreground">Deliverables</p>
                    </div>
                    <div className="hidden lg:block font-mono text-sm">{order.orderId}</div>
                </header>

                <main className="flex-1 overflow-y-auto bg-background">
                    <div className="mx-auto max-w-4xl space-y-8">
                        {/* Flush Sticky Command Bar */}
                        <section className="sticky top-0 z-30 bg-background/95 backdrop-blur pt-4 md:pt-6 px-4 md:px-6 shadow-sm border-b md:border-none">
                            <CommandBar />
                        </section>

                        <div className="space-y-12 pb-12 px-4 md:px-6 pt-6">
                            {/* Active Queue Section */}
                            <section className="space-y-4">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Action Required ({activeItems.length})
                                </h2>
                                
                                {activeItems.length === 0 && orderListItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-card/50">
                                        <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                        <p className="text-muted-foreground font-medium">Your queue is empty</p>
                                        <p className="text-sm text-muted-foreground">Search above or press ⌘K to start</p>
                                    </div>
                                ) : activeItems.length === 0 ? (
                                    <div className="py-8 text-center border rounded-xl bg-muted/20 border-dashed">
                                        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground font-medium">No items require attention</p>
                                    </div>
                                ) : (
                                    <Accordion type="multiple" value={openItems} onValueChange={handleValueChange} className="space-y-4">
                                        {activeItems.map((item) => (
                                            <DeliverableRow 
                                                key={item.id} 
                                                item={item} 
                                                isExpanded={openItems.includes(item.id)}
                                                onDone={handleDone}
                                                onValidityChange={handleValidityChange}
                                                onUpdate={updateDeliverable}
                                                onRemove={removeDeliverable}
                                            />
                                        ))}
                                    </Accordion>
                                )}
                            </section>

                            {/* Order List Section */}
                            {orderListItems.length > 0 && (
                                <section className="space-y-4 opacity-80">
                                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Order List ({orderListItems.length})
                                    </h2>
                                    <Accordion type="multiple" value={openItems} onValueChange={handleValueChange} className="space-y-2">
                                        {orderListItems.map((item) => (
                                            <DeliverableRow 
                                                key={item.id} 
                                                item={item} 
                                                isExpanded={openItems.includes(item.id)}
                                                onDone={handleDone}
                                                onValidityChange={handleValidityChange}
                                                onUpdate={updateDeliverable}
                                                onRemove={removeDeliverable}
                                            />
                                        ))}
                                    </Accordion>
                                </section>
                            )}
                        </div>
                    </div>
                </main>

                <footer className="sticky bottom-0 z-40 flex h-20 shrink-0 items-center justify-between gap-4 border-t bg-background px-4 md:px-6">
                    <Button variant="outline" onClick={() => router.back()}>Back</Button>
                    <div className="flex items-center gap-4">
                        <Button variant="secondary" onClick={saveAsDraft}>Save as Draft</Button>
                        <Button onClick={handleNextStep}>Next Step (Commercials)</Button>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}
