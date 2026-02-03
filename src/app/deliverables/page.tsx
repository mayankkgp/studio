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
import { cn } from "@/lib/utils";

export default function DeliverablesPage() {
    const router = useRouter();
    const { order, saveAsDraft, updateDeliverable, removeDeliverable } = useOrder();
    const { toast } = useToast();
    const headerSummary = useHeaderSummary(order.eventDetails);
    
    const [openItems, setOpenItems] = useState<string[]>([]);
    const [rowValidity, setRowValidity] = useState<Record<string, boolean>>({});
    const prevCount = useRef(order.deliverables.length);

    // Auto-scroll to newly added items
    useEffect(() => {
        if (order.deliverables.length > prevCount.current) {
            const newItem = order.deliverables[order.deliverables.length - 1];
            // Auto-expand
            setOpenItems(prev => Array.from(new Set([...prev, newItem.id])));
            
            // Scroll to it
            setTimeout(() => {
                const el = document.getElementById(`deliverable-${newItem.id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
        prevCount.current = order.deliverables.length;
    }, [order.deliverables]);

    const handleValidityChange = useCallback((id: string, isValid: boolean) => {
        setRowValidity(prev => {
            if (prev[id] === isValid) return prev;
            return { ...prev, [id]: isValid };
        });
    }, []);

    const handleDone = useCallback((id: string) => {
        setOpenItems(prev => prev.filter(itemId => itemId !== id));
    }, []);

    const handleValueChange = useCallback((newValues: string[]) => {
        const closedItems = openItems.filter(id => !newValues.includes(id));
        const invalidClosedItems = closedItems.filter(id => rowValidity[id] === false);

        if (invalidClosedItems.length > 0) {
            // Re-open invalid items that the user tried to close
            setOpenItems(Array.from(new Set([...newValues, ...invalidClosedItems])));
            return;
        }

        setOpenItems(newValues);
    }, [openItems, rowValidity]);

    // Split items into Active and Completed
    // NEW LOGIC: Active Queue strictly contains INVALID items.
    const { activeItems, completedItems } = useMemo(() => {
        const active = order.deliverables.filter(item => rowValidity[item.id] === false);
        const completed = order.deliverables.filter(item => rowValidity[item.id] === true);
        
        // Items that haven't reported validity yet (on mount) are briefly "unclassified"
        // We put them in Active to avoid flicker and ensure "Action Required" check
        const unclassified = order.deliverables.filter(item => rowValidity[item.id] === undefined);

        return { 
            activeItems: [...active, ...unclassified], 
            completedItems: [...completed].reverse() 
        };
    }, [order.deliverables, rowValidity]);

    const handleNextStep = useCallback(() => {
        const firstInvalidId = Object.entries(rowValidity).find(([_, valid]) => !valid)?.[0];
        
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
            toast({
                variant: "destructive",
                title: "No Items",
                description: "Add at least one product to continue."
            });
            return;
        }

        router.push('/commercials');
    }, [rowValidity, openItems, order.deliverables.length, router, toast]);

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
                    <div className="hidden lg:block font-mono text-sm">
                        {order.orderId}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="mx-auto max-w-4xl space-y-8">
                        {/* Sticky Command Bar Section - Flush with top, no gaps */}
                        <section className="sticky top-[-16px] md:top-[-24px] lg:top-[-32px] z-30 bg-background pt-4 pb-4 -mx-4 px-4 shadow-sm border-b md:border-none md:rounded-b-xl">
                            <CommandBar />
                        </section>

                        <div className="space-y-12 pb-12">
                            {/* Active Queue Section - ONLY Invalid items */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Action Required ({activeItems.length})
                                    </h2>
                                </div>
                                
                                {activeItems.length === 0 && completedItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-card/50">
                                        <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                        <p className="text-muted-foreground font-medium">Your queue is empty</p>
                                        <p className="text-sm text-muted-foreground">Search above or press ⌘K to start building your quote</p>
                                    </div>
                                ) : activeItems.length === 0 ? (
                                    <div className="py-8 text-center border rounded-xl bg-muted/20 border-dashed">
                                        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground font-medium">No items require immediate attention</p>
                                    </div>
                                ) : (
                                    <Accordion 
                                        type="multiple" 
                                        value={openItems} 
                                        onValueChange={handleValueChange} 
                                        className="space-y-4"
                                    >
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

                            {/* Completed Items Section - Valid items (whether expanded or collapsed) */}
                            {completedItems.length > 0 && (
                                <section className="space-y-4 opacity-80">
                                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Completed ({completedItems.length})
                                    </h2>
                                    <Accordion 
                                        type="multiple" 
                                        value={openItems} 
                                        onValueChange={handleValueChange} 
                                        className="space-y-2"
                                    >
                                        {completedItems.map((item) => (
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
                        <Button onClick={handleNextStep}>
                            Next Step (Commercials)
                        </Button>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}
