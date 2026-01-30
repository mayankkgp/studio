// This is a placeholder for Flow 2: Deliverables.
// The full implementation would be complex and is not included in this response.
// The structure would involve fetching product data, displaying a searchable catalog,
// and allowing users to configure and add products to the order.

'use client';

import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrder } from "@/context/OrderContext";
import { useRouter } from "next/navigation";

export default function DeliverablesPage() {
    const router = useRouter();
    const { order, saveAsDraft } = useOrder();

    return (
        <AppLayout>
            <div className="flex flex-col h-screen">
                <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
                    <MobileNav />
                    <div className="flex-1">
                    <h1 className="font-semibold text-lg md:text-xl font-headline">Deliverables</h1>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Catalog</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Product selection and configuration UI will be implemented here.</p>
                            <p className="text-muted-foreground text-sm mt-2">This is a placeholder for the full feature.</p>
                        </CardContent>
                    </Card>

                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Selected Deliverables</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {order.deliverables.length === 0 ? (
                                <p className="text-muted-foreground">No items added yet.</p>
                            ) : (
                                <ul>
                                    {order.deliverables.map(item => <li key={item.id}>{item.productName}</li>)}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </main>

                <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t bg-background px-4 md:px-6 h-20">
                     <Button variant="outline" onClick={() => router.back()}>Back</Button>
                    <div className="flex items-center gap-4">
                        <Button variant="secondary" onClick={saveAsDraft}>Save as Draft</Button>
                        <Button
                            onClick={() => router.push('/commercials')}
                            disabled={order.deliverables.length === 0}
                            style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}
                        >
                            Next Step (Commercials)
                        </Button>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}
