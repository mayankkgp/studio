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
import { useState, useCallback, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function DeliverablesPage() {
    const router = useRouter();
    const { order, saveAsDraft, updateDeliverable, removeDeliverable } = useOrder();
    const { toast } = useToast();
    const headerSummary = useHeaderSummary(order.eventDetails);
    
    const [rowStatus, setRowStatus] = useState<Record<string, { isValid: boolean }>>({});
    
    // Initialize committedItemIds with existing deliverables on mount
    // This ensures that navigating back from Commercials moves everything to Order List
    const [committedItemIds, setCommittedItemIds] = useState<string[]>(() => 
        order.deliverables.map(item => item.id)
    );
    
    const [openOrderListItems, setOpenOrderListItems] = useState<string[]>([]);

    const handleValidityChange = useCallback((id: string, isValid: boolean) => {
        setRowStatus(prev => {
            if (prev[id]?.isValid === isValid) return prev;
            return { ...prev, [id]: { isValid } };
        });
    }, []);

    const handleDone = useCallback(async (id: string, forceValid: boolean = false) => {
        // Move to top of Order List (committedItemIds)
        // Hard validation (missing variant/mandatory) blocks, soft constraints don't
        const isValid = forceValid || rowStatus[id]?.isValid;
        
        if (isValid) {
            setCommittedItemIds(prev => {
                const filtered = prev.filter(itemId => itemId !== id);
                return [id, ...filtered]; // Prepend recently completed to top
            });
            setOpenOrderListItems(prev => prev.filter(itemId => itemId !== id));
        } else {
            toast({
                variant: "destructive",
                title: "Setup Required",
                description: "Please select a variant and complete mandatory fields (marked with *) before confirming."
            });
        }
    }, [rowStatus, toast]);

    const handleOrderListEdit = useCallback((id: string) => {
        setOpenOrderListItems(prev => Array.from(new Set([...prev, id])));
    }, []);

    const handleRemove = useCallback((id: string) => {
        setCommittedItemIds(prev => prev.filter(itemId => itemId !== id));
        removeDeliverable(id);
    }, [removeDeliverable]);

    const { activeItems, orderListItems } = useMemo(() => {
        // Order list items follow committed order (most recent at top)
        const list = committedItemIds
            .map(id => order.deliverables.find(item => item.id === id))
            .filter(item => !!item);

        // Active items follow deliverables order (Newest added by CommandBar is prepended to deliverables array)
        const active = order.deliverables.filter(item => !committedItemIds.includes(item.id));

        return { 
            activeItems: active, 
            orderListItems: list as any[]
        };
    }, [order.deliverables, committedItemIds]);

    // CTA activation conditions:
    // 1. All product cards must be valid
    // 2. All product cards must be in closed/collapsed state (openOrderListItems.length === 0)
    // 3. The 'action' section must be empty (activeItems.length === 0)
    const isNextStepActive = useMemo(() => {
        const hasItems = order.deliverables.length > 0;
        const allConfirmed = activeItems.length === 0;
        const allCollapsed = openOrderListItems.length === 0;
        const allValid = order.deliverables.every(item => rowStatus[item.id]?.isValid);
        
        return hasItems && allConfirmed && allCollapsed && allValid;
    }, [order.deliverables, activeItems.length, openOrderListItems.length, rowStatus]);

    const handleNextStep = useCallback(() => {
        if (isNextStepActive) {
            router.push('/commercials');
        }
    }, [isNextStepActive, router]);

    return (
        <AppLayout>
            <div className="flex flex-col h-screen overflow-hidden">
                <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 md:px-6 bg-background z-50">
                    <MobileNav />
                    <div className="flex-1 overflow-hidden">
                        <h1 className="font-semibold text-base md:text-lg font-headline truncate" title={headerSummary}>
                            {headerSummary}
                        </h1>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Deliverables</p>
                    </div>
                    <div className="hidden lg:block font-mono text-xs opacity-50">{order.orderId}</div>
                </header>

                <main className="flex-1 overflow-y-auto bg-background">
                    <div className="mx-auto max-w-4xl px-4 md:px-6 pb-12">
                        <section className="sticky top-0 z-30 bg-background/95 backdrop-blur pt-4 md:pt-6 pb-6 mb-6">
                            <CommandBar />
                        </section>

                        <div className="space-y-12">
                            {/* Action Required: Only shown if there are active items */}
                            {activeItems.length > 0 && (
                                <section className="space-y-4">
                                    <h2 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Action Required ({activeItems.length})
                                    </h2>
                                    
                                    <Accordion 
                                        type="multiple" 
                                        value={activeItems.map(i => i.id)} 
                                        className="space-y-2 pointer-events-auto"
                                    >
                                        {activeItems.map((item) => (
                                            <DeliverableRow 
                                                key={item.id} 
                                                item={item} 
                                                isExpanded={true}
                                                isNonCollapsible={true}
                                                onEdit={() => {}}
                                                onDone={handleDone}
                                                onValidityChange={handleValidityChange}
                                                onUpdate={updateDeliverable}
                                                onRemove={handleRemove}
                                            />
                                        ))}
                                    </Accordion>
                                </section>
                            )}

                            {/* Order List: Collapsed by Default */}
                            {orderListItems.length > 0 && (
                                <section className="space-y-4">
                                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Order List ({orderListItems.length})
                                    </h2>
                                    <Accordion 
                                        type="multiple" 
                                        value={openOrderListItems} 
                                        onValueChange={setOpenOrderListItems} 
                                        className="space-y-2"
                                    >
                                        {orderListItems.map((item) => (
                                            <DeliverableRow 
                                                key={item.id} 
                                                item={item} 
                                                isExpanded={openOrderListItems.includes(item.id)}
                                                onEdit={() => handleOrderListEdit(item.id)}
                                                onDone={() => setOpenOrderListItems(prev => prev.filter(id => id !== item.id))}
                                                onValidityChange={handleValidityChange}
                                                onUpdate={updateDeliverable}
                                                onRemove={handleRemove}
                                                isPersistent={true}
                                            />
                                        ))}
                                    </Accordion>
                                </section>
                            )}
                            
                            {/* Empty State: Only shown if absolutely nothing is present */}
                            {order.deliverables.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-xl bg-card/50">
                                    <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                    <p className="text-muted-foreground text-sm font-medium">Search for products above to start building the order</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                <footer className="sticky bottom-0 z-40 flex h-20 shrink-0 items-center justify-between gap-4 border-t bg-background px-4 md:px-6">
                    <Button variant="outline" onClick={() => router.back()}>Back</Button>
                    <div className="flex items-center gap-4">
                        <Button variant="secondary" onClick={saveAsDraft}>Save as Draft</Button>
                        <Button onClick={handleNextStep} disabled={!isNextStepActive}>
                            Next Step (Commercials)
                        </Button>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}