'use client';

import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrder } from "@/context/OrderContext";
import { useRouter } from "navigation";
import { useEffect, useMemo, useState } from "react";
import { calculateBillableItems } from "@/lib/pricing";
import type { BillableItem } from "@/lib/types";
import { DollarSign, ChevronLeft, Save, Zap, Star } from "lucide-react";
import { useHeaderSummary } from "@/hooks/use-header-summary";
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

    const balanceDisplay = useMemo(() => {
        if (totalValue === 0 && payment === 0) return null;
        
        if (balance > 0) {
            return (
                <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Balance Due</div>
                    <div className="text-2xl font-bold text-destructive">
                        {formatCurrency(balance)}
                    </div>
                </div>
            );
        }
        
        return (
            <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase text-muted-foreground">Status</div>
                <div className="text-2xl font-bold text-green-600">
                    {balance < 0 ? `Excess: ${formatCurrency(Math.abs(balance))}` : 'Fully Paid'}
                </div>
            </div>
        );
    }, [totalValue, payment, balance]);

    return (
        <AppLayout>
            <div className="flex flex-col h-screen overflow-hidden bg-background">
                {/* Header: Simplified for high-density view */}
                <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 md:px-6 bg-background z-50">
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
                    {/* Left Panel: Billable Items List (Expert Workflow) */}
                    <main className="flex-1 flex flex-col overflow-hidden bg-background pt-6 pb-6">
                        {/* Scroll Wrapper: Full width to dock scrollbar to edge */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
                            {/* Centering Wrapper */}
                            <div className="max-w-4xl mx-auto w-full px-4 lg:px-6">
                                <div className="w-full">
                                    {billableItems.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-card border rounded-lg shadow-sm">
                                            <DollarSign className="h-12 w-12 opacity-20 mb-4" />
                                            <p className="font-medium">No price rows generated.</p>
                                            <p className="text-sm">Go back to configure deliverables.</p>
                                        </div>
                                    ) : (
                                        <table className="w-full caption-bottom text-sm border-separate border-spacing-0">
                                            <TableHeader className="relative z-30">
                                                <TableRow className="hover:bg-transparent border-none">
                                                    <TableHead className="bg-white h-10 text-xs font-bold uppercase sticky top-0 z-30 border-t border-b-2 border-l border-stone-200">Line Item</TableHead>
                                                    <TableHead className="bg-white h-10 text-xs font-bold uppercase text-center w-24 sticky top-0 z-30 border-t border-b-2 border-stone-200">Multiplier</TableHead>
                                                    <TableHead className="bg-white h-10 text-xs font-bold uppercase text-right w-32 sticky top-0 z-30 border-t border-b-2 border-stone-200">Rate (₹)</TableHead>
                                                    <TableHead className="bg-white h-10 text-xs font-bold uppercase text-right w-32 sticky top-0 z-30 border-t border-b-2 border-r border-stone-200">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {billableItems.map((item, itemIdx) => {
                                                    const itemTotal = item.components.reduce((acc, comp) => acc + comp.total, 0);
                                                    const isLastItem = itemIdx === billableItems.length - 1;

                                                    return (
                                                        <React.Fragment key={item.configuredProductId}>
                                                            {/* Product Header Row */}
                                                            <TableRow className="bg-[#5C4B35] hover:bg-[#5C4B35] transition-none z-10 relative">
                                                                <TableCell colSpan={3} className="py-2.5 font-bold text-sm text-[#FFFFFF] border-l border-stone-200">
                                                                    {item.productName}
                                                                </TableCell>
                                                                <TableCell className="py-2.5 text-right font-bold text-sm text-[#FFFFFF] border-r border-stone-200">
                                                                    {formatCurrency(itemTotal)}
                                                                </TableCell>
                                                            </TableRow>
                                                            {/* Component Rows */}
                                                            {item.components.map((comp, compIdx) => {
                                                                const isSpecialRequest = comp.label === 'Special Request' || comp.description !== undefined;
                                                                const isAbsoluteLastRow = isLastItem && compIdx === item.components.length - 1;
                                                                
                                                                return (
                                                                    <TableRow 
                                                                        key={`${item.configuredProductId}-${compIdx}`} 
                                                                        className="group h-10 bg-[#F9F2DC] hover:bg-[#E6DEBC] transition-colors"
                                                                    >
                                                                        <TableCell className={cn(
                                                                            "py-0 pl-8 text-sm text-[#2E261F] font-medium relative border-l border-b border-stone-300",
                                                                            isAbsoluteLastRow && "rounded-bl-lg"
                                                                        )}>
                                                                            {isSpecialRequest ? (
                                                                                <React.Fragment>
                                                                                    <Star className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 shrink-0 text-amber-500 fill-amber-500" />
                                                                                    <div className="truncate max-w-[200px] md:max-w-md lg:max-w-lg" title={comp.description || comp.label}>
                                                                                        {comp.description || comp.label}
                                                                                    </div>
                                                                                </React.Fragment>
                                                                            ) : (
                                                                                comp.label
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell className="py-0 text-center text-sm text-[#2E261F] cursor-default select-none border-b border-stone-300">
                                                                            {comp.isFixed ? "-" : comp.multiplier}
                                                                        </TableCell>
                                                                        <TableCell className="py-0 text-right border-b border-stone-300">
                                                                            <input
                                                                                type="number"
                                                                                defaultValue={comp.rate}
                                                                                onBlur={(e) => handleRateChange(item.configuredProductId, comp.label, Number(e.target.value))}
                                                                                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                                                                className="w-full h-8 text-right bg-transparent border-none focus:ring-1 focus:ring-primary rounded px-2 transition-all hover:bg-black/5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-semibold text-sm text-[#2E261F]"
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell className={cn(
                                                                            "py-0 text-right text-sm font-bold text-[#2E261F] border-r border-b border-stone-300",
                                                                            isAbsoluteLastRow && "rounded-br-lg"
                                                                        )}>
                                                                            {formatCurrency(comp.total)}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </TableBody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* Right Panel: Summary & Actions (Sticky) */}
                    <aside className="w-80 lg:w-96 shrink-0 border-l bg-card/50 flex flex-col p-6 z-40">
                        {/* Top Navigation */}
                        <div className="mb-6">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-9 -ml-2 text-muted-foreground hover:text-foreground"
                                onClick={() => router.back()}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Back to Deliverables
                            </Button>
                        </div>
                        
                        {/* Financial Calculation Unit */}
                        <div className="space-y-6">
                            {/* Total Order Value */}
                            <div className="space-y-0.5">
                                <div className="text-[10px] font-bold uppercase text-muted-foreground">Total Order Value</div>
                                <div className="text-5xl font-bold text-foreground tracking-tight">
                                    {formatCurrency(totalValue)}
                                </div>
                            </div>

                            {/* Payment Input Block */}
                            <div className="space-y-2">
                                <Label htmlFor="payment" className="text-[10px] font-bold uppercase text-muted-foreground">
                                    Payment Received
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                    <input 
                                        id="payment" 
                                        type="number" 
                                        placeholder="0"
                                        value={order.paymentReceived || ''}
                                        onChange={(e) => setPaymentReceived(Number(e.target.value))}
                                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 pl-7 text-lg font-semibold ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                            </div>
                            
                            {/* Balance/Status Block */}
                            <div>
                                {balanceDisplay}
                            </div>
                        </div>

                        {/* Action Buttons Pushed to Bottom */}
                        <div className="mt-auto space-y-3">
                            <Button 
                                variant="outline" 
                                className="w-full h-10 group bg-background/50" 
                                onClick={() => saveAsDraft()}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Save as Draft
                            </Button>
                            <Button 
                                className="w-full h-14 text-base font-bold gap-2 shadow-lg shadow-primary/20" 
                                onClick={() => alert("Order Activated!")}
                            >
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