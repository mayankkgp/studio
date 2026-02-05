'use client';

import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrder } from "@/context/OrderContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { calculateBillableItems } from "@/lib/pricing";
import type { BillableItem } from "@/lib/types";
import { DollarSign, ChevronLeft, Save, Zap, Star } from "lucide-react";
import { useHeaderSummary } from "@/hooks/use-header-summary";
import { Separator } from "@/components/ui/separator";
import * as React from 'react';
import { cn } from "@/lib/utils";

export default function CommercialsPage() {
    const router = useRouter();
    const { order, setPaymentReceived, saveAsDraft, updateDeliverable } = useOrder();
    const headerSummary = useHeaderSummary(order.eventDetails);
    
    const [billableItems, setBillableItems] = useState<BillableItem[]>([]);

    useEffect(() => {
        setBillableItems(calculateBillableItems(order.deliverables));
    }, [order.deliverables]);

    const handleRateChange = (configuredProductId: string, label: string, value: number) => {
        const deliverable = order.deliverables.find(d => d.id === configuredProductId);
        if (!deliverable) return;

        const rateOverrides = { ...deliverable.rateOverrides, [label]: value };
        updateDeliverable(deliverable.id, { rateOverrides });
    };

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
        if (totalValue === 0 && payment === 0) return null;
        if (balance > 0) return <Badge variant="destructive" className="w-full justify-center py-1">Balance: {formatCurrency(balance)}</Badge>;
        if (balance < 0) return <Badge variant="secondary" className="w-full justify-center py-1">Excess: {formatCurrency(Math.abs(balance))}</Badge>;
        return <Badge variant="default" className="w-full justify-center py-1">Fully Paid</Badge>;
    }, [totalValue, payment, balance]);

    return (
        <AppLayout>
            <div className="flex flex-col h-screen overflow-hidden bg-background">
                {/* Header: Simplified for high-density view */}
                <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 md:px-6">
                    <MobileNav />
                    <div className="flex-1 overflow-hidden">
                        <h1 className="font-semibold text-base md:text-lg font-headline truncate" title={headerSummary}>
                            {headerSummary}
                        </h1>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Commercials</p>
                    </div>
                    <div className="hidden lg:block font-mono text-xs opacity-50">
                        {order.orderId}
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Panel: Billable Items (Scrollable) */}
                    <main className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
                        <div className="max-w-4xl mx-auto space-y-0">
                            {billableItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
                                    <DollarSign className="h-12 w-12 opacity-20 mb-4" />
                                    <p className="font-medium">No price rows generated.</p>
                                    <p className="text-sm">Go back to configure deliverables.</p>
                                </div>
                            ) : (
                                <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow className="hover:bg-transparent border-b">
                                                <TableHead className="h-10 text-xs font-bold uppercase">Line Item</TableHead>
                                                <TableHead className="h-10 text-xs font-bold uppercase text-center w-24">Multiplier</TableHead>
                                                <TableHead className="h-10 text-xs font-bold uppercase text-right w-32">Rate (₹)</TableHead>
                                                <TableHead className="h-10 text-xs font-bold uppercase text-right w-32">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {billableItems.map((item) => {
                                                const itemTotal = item.components.reduce((acc, comp) => acc + comp.total, 0);
                                                return (
                                                    <React.Fragment key={item.configuredProductId}>
                                                        {/* Product Header Row: mocha background, white text, top border */}
                                                        <TableRow className="bg-[#5C4B35] hover:bg-[#5C4B35] border-t-2 border-primary/20 transition-none">
                                                            <TableCell colSpan={3} className="py-2.5 font-bold text-sm text-[#FFFFFF]">
                                                                {item.productName}
                                                            </TableCell>
                                                            <TableCell className="py-2.5 text-right font-bold text-sm text-[#FFFFFF]">
                                                                {formatCurrency(itemTotal)}
                                                            </TableCell>
                                                        </TableRow>
                                                        {/* Component Rows: theme cream background, beige hover */}
                                                        {item.components.map((comp, idx) => {
                                                            const isSpecialRequest = comp.label === 'Special Request';
                                                            return (
                                                                <TableRow 
                                                                    key={`${item.configuredProductId}-${idx}`} 
                                                                    className="group h-10 border-b last:border-b-0 bg-[#F9F2DC] hover:bg-[#E6DEBC] transition-colors"
                                                                >
                                                                    <TableCell className="py-0 pl-8 text-sm text-[#2E261F] font-medium relative">
                                                                        {isSpecialRequest ? (
                                                                            <React.Fragment>
                                                                                <Star className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 shrink-0 text-amber-500 fill-amber-500" />
                                                                                <div className="truncate max-w-xs md:max-w-md lg:max-w-xl" title={comp.description}>
                                                                                    {comp.description}
                                                                                </div>
                                                                            </React.Fragment>
                                                                        ) : (
                                                                            comp.label
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="py-0 text-center text-sm text-[#2E261F] cursor-default select-none">
                                                                        {comp.isFixed ? "-" : comp.multiplier}
                                                                    </TableCell>
                                                                    <TableCell className="py-0 text-right">
                                                                        <input
                                                                            type="number"
                                                                            defaultValue={comp.rate}
                                                                            onBlur={(e) => handleRateChange(item.configuredProductId, comp.label, Number(e.target.value))}
                                                                            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                                                            className="w-full h-8 text-right bg-transparent border-none focus:ring-1 focus:ring-primary rounded px-2 transition-all hover:bg-black/5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-semibold text-sm text-[#2E261F]"
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell className="py-0 text-right text-sm font-bold text-[#2E261F]">
                                                                        {formatCurrency(comp.total)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    </main>

                    {/* Right Panel: Summary & Actions (Sticky) */}
                    <aside className="w-80 lg:w-96 shrink-0 border-l bg-card/50 flex flex-col p-6 space-y-8">
                        <div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
                                onClick={() => router.back()}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Back to Deliverables
                            </Button>
                            
                            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Commercial Summary</h2>
                            
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <div className="text-sm font-medium text-muted-foreground">Order Total</div>
                                    <div className="text-4xl font-bold font-headline text-primary">
                                        {formatCurrency(totalValue)}
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="payment" className="text-xs font-bold uppercase text-muted-foreground">
                                            Payment Received
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                            <Input 
                                                id="payment" 
                                                type="number" 
                                                placeholder="0"
                                                value={order.paymentReceived || ''}
                                                onChange={(e) => setPaymentReceived(Number(e.target.value))}
                                                className="pl-7 h-11 text-lg font-semibold bg-background"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="pt-2">
                                        {balanceStatus}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto space-y-3">
                            <Button variant="outline" className="w-full h-11 justify-between px-4 group" onClick={saveAsDraft}>
                                <span className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    Save as Draft
                                </span>
                                <span className="text-[10px] opacity-0 group-hover:opacity-50 transition-opacity">Session Only</span>
                            </Button>
                            <Button className="w-full h-12 text-base font-bold gap-2 shadow-lg shadow-primary/20" onClick={() => alert("Order Activated!")}>
                                <Zap className="h-5 w-5 fill-current" />
                                Activate Order
                            </Button>
                        </div>
                    </aside>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: hsl(var(--muted));
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: hsl(var(--muted-foreground) / 0.2);
                }
            `}</style>
        </AppLayout>
    );
}
