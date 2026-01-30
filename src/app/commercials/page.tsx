'use client';

import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrder } from "@/context/OrderContext";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { calculateBillableItems } from "@/lib/pricing";
import type { BillableItem } from "@/lib/types";
import { DollarSign } from "lucide-react";

export default function CommercialsPage() {
    const router = useRouter();
    const { order, setPaymentReceived, saveAsDraft } = useOrder();

    const billableItems: BillableItem[] = useMemo(() => {
        return calculateBillableItems(order.deliverables);
    }, [order.deliverables]);

    const totalValue = useMemo(() => {
        return billableItems.reduce((acc, item) => {
            const itemTotal = item.components.reduce((compAcc, comp) => compAcc + comp.total, 0);
            return acc + itemTotal;
        }, 0);
    }, [billableItems]);

    const payment = order.paymentReceived || 0;
    const balance = totalValue - payment;

    const formatCurrency = (value: number) => {
        return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    const balanceStatus = useMemo(() => {
        if (totalValue === 0 && payment === 0) {
            return <Badge variant="secondary">No Items</Badge>;
        }
        if (balance > 0) {
            return <Badge variant="destructive" className="bg-red-500">Balance: {formatCurrency(balance)}</Badge>;
        }
        if (balance < 0) {
            return <Badge className="bg-orange-500">Excess: {formatCurrency(Math.abs(balance))}</Badge>;
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
                            <div className="text-3xl font-bold font-headline">{formatCurrency(totalValue)}</div>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="w-48">
                                <Label htmlFor="payment" className="text-sm text-muted-foreground">Payment Received</Label>
                                <Input 
                                    id="payment" 
                                    type="number" 
                                    placeholder="0"
                                    value={order.paymentReceived || ''}
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
                             {billableItems.length === 0 ? (
                                <div className="text-center text-muted-foreground py-12">
                                    <DollarSign className="mx-auto h-12 w-12" />
                                    <p className="mt-4">No items from deliverables to price.</p>
                                    <p className="text-sm">Go back to add products to the order.</p>
                                </div>
                             ) : (
                                <Accordion type="single" collapsible className="w-full">
                                    {billableItems.map(item => {
                                        const itemTotal = item.components.reduce((acc, comp) => acc + comp.total, 0);
                                        return (
                                            <AccordionItem value={item.configuredProductId} key={item.configuredProductId}>
                                                <AccordionTrigger>
                                                    <div className="flex justify-between w-full pr-4">
                                                        <span>{item.productName}</span>
                                                        <span className="font-semibold">{formatCurrency(itemTotal)}</span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Component</TableHead>
                                                                <TableHead>Multiplier</TableHead>
                                                                <TableHead>Rate</TableHead>
                                                                <TableHead className="text-right">Total</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {item.components.map((comp, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell>{comp.label}</TableCell>
                                                                    <TableCell>{comp.multiplier}</TableCell>
                                                                    <TableCell>{formatCurrency(comp.rate)}</TableCell>
                                                                    <TableCell className="text-right">{formatCurrency(comp.total)}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </AccordionContent>
                                            </AccordionItem>
                                        )
                                    })}
                                </Accordion>
                             )}
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
