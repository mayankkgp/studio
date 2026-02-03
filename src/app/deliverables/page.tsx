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

export default function DeliverablesPage() {
    const router = useRouter();
    const { order, saveAsDraft } = useOrder();
    const headerSummary = useHeaderSummary(order.eventDetails);

    return (
        <AppLayout>
            <div className="flex flex-col h-screen">
                <header className="sticky top-0 z-10 flex h-20 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
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
                        {/* Search & Quick Add Section */}
                        <section className="space-y-4">
                            <CommandBar />
                        </section>

                        {/* Deliverables List */}
                        <section className="space-y-4">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                Added Items ({order.deliverables.length})
                            </h2>
                            
                            {order.deliverables.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-card/50">
                                    <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <p className="text-muted-foreground font-medium">No items added yet</p>
                                    <p className="text-sm text-muted-foreground">Search above to start building your quote</p>
                                </div>
                            ) : (
                                <Accordion type="multiple" className="space-y-4">
                                    {order.deliverables.map((item) => (
                                        <DeliverableRow key={item.id} item={item} />
                                    ))}
                                </Accordion>
                            )}
                        </section>
                    </div>
                </main>

                <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t bg-background px-4 md:px-6 h-20">
                    <Button variant="outline" onClick={() => router.back()}>Back</Button>
                    <div className="flex items-center gap-4">
                        <Button variant="secondary" onClick={saveAsDraft}>Save as Draft</Button>
                        <Button
                            onClick={() => router.push('/commercials')}
                            disabled={order.deliverables.length === 0}
                        >
                            Next Step (Commercials)
                        </Button>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}
