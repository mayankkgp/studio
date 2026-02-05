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
    const [rowStatus, setRowStatus] = useState<Record<string, { isValid: boolean }>>({});
    const [committedItemIds, setCommittedItemIds] = useState<string[]>([]);
    const prevCount = useRef(order.deliverables.length);

    const handleValidityChange = useCallback((id: string, isValid: boolean) => {
        setRowStatus(prev => {
            if (prev[id]?.isValid === isValid) return prev;
            return { ...prev, [id]: { isValid } };
        });
    }, []);

    const handleEdit = useCallback((id: string) => {
        setOpenItems(prev => Array.from(new Set([...prev, id])));
    }, []);

    const handleDone = useCallback(async (id: string) => {
        // Mark as committed to move to Order List permanently
        setCommittedItemIds(prev => Array.from(new Set([...prev, id])));
        setOpenItems(prev => prev.filter(itemId => itemId !== id));
    }, []);

    // Stable split: Once committed, it stays in the Order List.
    const { activeItems, orderListItems } = useMemo(() => {
        const active: any[] = [];
        const list: any[] = [];

        order.deliverables.forEach(item => {
            if (committedItemIds.includes(item.id)) {
                list.push(item);
            } else {
                active.push(item);
            }
        });

        return { 
            activeItems: active, 
            orderListItems: list 
        };
    }, [order.deliverables, committedItemIds]);

    useEffect(() => {
        if (order.deliverables.length > prevCount.current) {
            const newItem = order.deliverables[order.deliverables.length - 1];
            setOpenItems([newItem.id]);
        }
        prevCount.current = order.deliverables.length;
    }, [order.deliverables]);

    const handleNextStep = useCallback(() => {
        const firstInvalidItem = order.deliverables.find(item => rowStatus[item.id]?.isValid === false);
        
        if (firstInvalidItem) {
            toast({
                variant: "destructive",
                title: "Incomplete Items",
                description: "Please complete all required fields before moving to commercials."
            });
            setOpenItems([firstInvalidItem.id]);
            return;
        }

        if (order.deliverables.length === 0) {
            toast({ variant: "destructive", title: "No Items", description: "Add a product to continue." });
            return;
        }

        router.push('/commercials');
    }, [rowStatus, order.deliverables, router, toast]);

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
                    <div className="mx-auto max-w-4xl px-4 md:px-6">
                        <section className="sticky top-0 z-30 bg-background/95 backdrop-blur pt-4 md:pt-6 pb-6 mb-6">
                            <CommandBar />
                        </section>

                        <Accordion type="multiple" value={openItems} onValueChange={setOpenItems} className="space-y-12 pb-12">
                            <section className="space-y-4">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Action Required ({activeItems.length})
                                </h2>
                                
                                {activeItems.length === 0 && orderListItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-card/50">
                                        <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                        <p className="text-muted-foreground font-medium">Your queue is empty</p>
                                    </div>
                                ) : (
                                    activeItems.map((item) => (
                                        <DeliverableRow 
                                            key={item.id} 
                                            item={item} 
                                            isExpanded={openItems.includes(item.id)}
                                            onEdit={handleEdit}
                                            onDone={handleDone}
                                            onValidityChange={handleValidityChange}
                                            onUpdate={updateDeliverable}
                                            onRemove={removeDeliverable}
                                        />
                                    ))
                                )}
                            </section>

                            {orderListItems.length > 0 && (
                                <section className="space-y-4">
                                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Order List ({orderListItems.length})
                                    </h2>
                                    <div className="space-y-2">
                                        {orderListItems.map((item) => (
                                            <DeliverableRow 
                                                key={item.id} 
                                                item={item} 
                                                isExpanded={openItems.includes(item.id)}
                                                onEdit={handleEdit}
                                                onDone={handleDone}
                                                onValidityChange={handleValidityChange}
                                                onUpdate={updateDeliverable}
                                                onRemove={removeDeliverable}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </Accordion>
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
