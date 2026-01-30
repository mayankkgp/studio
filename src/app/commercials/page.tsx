// This is a placeholder for Flow 3: Commercials.
// The full implementation would be complex, involving transforming the cart
// into billable items, applying reference pricing, and calculating totals.

'use client';

import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useOrder } from "@/context/OrderContext";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

export default function CommercialsPage() {
    const router = useRouter();
    const { order, setPaymentReceived, saveAsDraft } = useOrder();

    // Placeholder for total value calculation
    const totalValue = useMemo(() => {
        // In a real implementation, this would sum up all billable item totals.
        return 0;
    }, []);

    const payment = order.paymentReceived || 0;
    const balance = totalValue - payment;

    const balanceStatus = useMemo(() => {
        if (totalValue === 0 && payment === 0) {
            return <Badge variant="secondary">No Items</Badge>;
        }
        if (balance > 0) {
            return <Badge variant="destructive" className="bg-red-500">Balance: {balance.toLocaleString()}</Badge>;
        }
        if (balance < 0) {
            return <Badge className="bg-orange-500">Excess: {Math.abs(balance).toLocaleString()}</Badge>;
        }
        return <Badge className="bg-green-500">Fully Paid</Badge>;
    }, [totalValue, payment, balance]);

    return (
        <AppLayout>
            <div className="flex flex-col h-screen">
                <header className="sticky top-0 z-10 flex h-24 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
                    <MobileNav />
                    <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm text-muted-foreground">Total Value</div>
                            <div className="text-3xl font-bold font-headline">₹{totalValue.toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="w-48">
                                <Label htmlFor="payment" className="text-sm text-muted-foreground">Payment Received</Label>
                                <Input 
                                    id="payment" 
                                    type="number" 
                                    placeholder="0"
                                    value={order.paymentReceived}
                                    onChange={(e) => setPaymentReceived(Number(e.target.value))}
                                    className="text-lg font-semibold"
                                />
                            </div>
                            <div className="mt-4">{balanceStatus}</div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Pricing List</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p>Billable items transformation and pricing UI will be implemented here.</p>
                             <p className="text-muted-foreground text-sm mt-2">This is a placeholder for the full feature.</p>
                        </CardContent>
                    </Card>
                </main>

                <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t bg-background px-4 md:px-6 h-20">
                     <Button variant="outline" onClick={() => router.back()}>Back</Button>
                    <div className="flex items-center gap-4">
                        <Button variant="secondary" onClick={saveAsDraft}>Save as Draft</Button>
                        <Button 
                            style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}
                            onClick={() => alert("Order Activated!")}
                        >
                            Activate Order
                        </Button>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}
