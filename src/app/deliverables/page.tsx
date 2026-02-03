'use client';

import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { useOrder } from "@/context/OrderContext";
import { useRouter } from "next/navigation";
import { useHeaderSummary } from '@/hooks/use-header-summary';
import { CommandBar } from "@/components/flow2/CommandBar";
import { DeliverableRow } from "@/components/flow2/DeliverableRow";
import { Package } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export default function DeliverablesPage() {
    const router = useRouter();
    const { order, saveAsDraft } = useOrder();
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

    const handleNextStep = useCallback(() => {
        // Find first invalid item ID
        const firstInvalidId = Object.entries(rowValidity).find(([_, valid]) => !valid)?.[0];
        
        if (firstInvalidId) {
            toast({
                variant: "destructive",
                title: "Incomplete Items",
                description: "Please complete all required fields before moving to commercials."
            });

            // Expand it if it isn't already
            if (!openItems.includes(firstInvalidId)) {
                setOpenItems(prev => [...prev, firstInvalidId]);
            }
            // Scroll to it
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
            <div className="flex flex-col h-screen">
                <header className="sticky top-0 z-40 flex h-20 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
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
                        {/* Sticky Command Bar Section */}
                        <section className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 -mx-4 px-4 shadow-sm border-b md:border-none md:rounded-b-xl">
                            <CommandBar />
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Added Items ({order.deliverables.length})
                                </h2>
                                {Object.values(rowValidity).some(v => v === false) && (
                                    <span className="text-xs font-medium text-destructive animate-pulse">
                                        Please complete all items before moving to commercials
                                    </span>
                                )}
                            </div>
                            
                            {order.deliverables.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-card/50">
                                    <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <p className="text-muted-foreground font-medium">No items added yet</p>
                                    <p className="text-sm text-muted-foreground">Search above or press ⌘K to start building your quote</p>
                                </div>
                            ) : (
                                <Accordion 
                                    type="multiple" 
                                    value={openItems} 
                                    onValueChange={handleValueChange} 
                                    className="space-y-4"
                                >
                                    {order.deliverables.map((item) => (
                                        <DeliverableRow 
                                            key={item.id} 
                                            item={item} 
                                            isExpanded={openItems.includes(item.id)}
                                            onDone={() => handleDone(item.id)}
                                            onValidityChange={handleValidityChange}
                                        />
                                    ))}
                                </Accordion>
                            )}
                        </section>
                    </div>
                </main>

                <footer className="sticky bottom-0 z-40 flex items-center justify-between gap-4 border-t bg-background px-4 md:px-6 h-20">
                    <Button variant="outline" onClick={() => router.back()}>Back</Button>
                    <div className="flex items-center gap-4">
                        <Button variant="secondary" onClick={saveAsDraft}>Save as Draft</Button>
                        <Button
                            onClick={handleNextStep}
                        >
                            Next Step (Commercials)
                        </Button>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}
