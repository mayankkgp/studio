'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import type { Order, DesignData, DesignComponent } from '@/lib/types';
import { DesignProductRow } from './DesignProductRow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, Filter, AlertCircle, Clock, CheckCircle2, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DesignReviewTabProps {
    order: Order;
    onUpdateOrder: (updatedOrder: Order) => void;
    role: 'MANAGER' | 'DESIGNER';
}

type FilterMode = 'needs_action' | 'waiting' | 'approved' | 'stock' | 'all';

export function DesignReviewTab({ order, onUpdateOrder, role }: DesignReviewTabProps) {
    const [activeFilter, setActiveFilter] = useState<FilterMode>('all');

    const handleUpdateProductDesign = (productId: string, designData: DesignData) => {
        const updatedDeliverables = order.deliverables.map(d => 
            d.id === productId ? { ...d, designData } : d
        );
        onUpdateOrder({ ...order, deliverables: updatedDeliverables });
    };

    const filteredProducts = useMemo(() => {
        const deliverables = order.deliverables || [];
        
        return deliverables.filter(p => {
            const data = p.designData || { components: [] as DesignComponent[], isStock: false };
            const components = data.components || [];
            
            if (activeFilter === 'all') return true;
            if (activeFilter === 'stock') return !!data.isStock;
            
            if (activeFilter === 'needs_action') {
                if (role === 'MANAGER') {
                    return components.some(c => c.status === 'INTERNAL_REVIEW');
                } else {
                    return components.some(c => c.status === 'PENDING' || c.status === 'DRAFT');
                }
            }

            if (activeFilter === 'waiting') {
                if (role === 'MANAGER') {
                    return components.some(c => c.status === 'PENDING' || c.status === 'CUSTOMER_REVIEW');
                } else {
                    return components.some(c => c.status === 'INTERNAL_REVIEW' || c.status === 'CUSTOMER_REVIEW');
                }
            }

            if (activeFilter === 'approved') {
                return components.length > 0 && components.every(c => c.status === 'APPROVED');
            }

            return true;
        });
    }, [order.deliverables, activeFilter, role]);

    if (!order.deliverables || order.deliverables.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground animate-in fade-in zoom-in-95 duration-500">
                <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mb-6 border-2 border-dashed border-muted/50">
                    <Palette className="h-10 w-10 opacity-30" />
                </div>
                <h3 className="text-xl font-headline font-black uppercase tracking-[0.2em] mb-3">No Products in Order</h3>
                <p className="text-sm font-semibold text-center max-w-sm leading-relaxed px-4 opacity-70">
                    Add products to the scope of work to enable design collaboration and feedback.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full lg:max-w-[calc(100vw-16.5rem)] overflow-hidden bg-background/50 min-w-0">
            {/* Triage Filters Bar */}
            <div className="shrink-0 px-4 md:px-8 py-4 border-b bg-card/20 flex items-center gap-4 w-full overflow-hidden min-w-0">
                <div className="flex items-center gap-2 text-muted-foreground mr-4 shrink-0">
                    <Filter className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Filter Items:</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border overflow-x-auto no-scrollbar min-w-0">
                    <FilterTab 
                        active={activeFilter === 'all'} 
                        onClick={() => setActiveFilter('all')} 
                        label="All Items" 
                        count={order.deliverables.length} 
                    />
                    <FilterTab 
                        active={activeFilter === 'needs_action'} 
                        onClick={() => setActiveFilter('needs_action')} 
                        label="Needs Action" 
                        icon={AlertCircle}
                        color="text-orange-600"
                    />
                    <FilterTab 
                        active={activeFilter === 'waiting'} 
                        onClick={() => setActiveFilter('waiting')} 
                        label="Waiting" 
                        icon={Clock}
                        color="text-blue-600"
                    />
                    <FilterTab 
                        active={activeFilter === 'approved'} 
                        onClick={() => setActiveFilter('approved')} 
                        label="Approved" 
                        icon={CheckCircle2}
                        color="text-green-600"
                    />
                    <FilterTab 
                        active={activeFilter === 'stock'} 
                        onClick={() => setActiveFilter('stock')} 
                        label="Stock" 
                        icon={Archive}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 w-full lg:max-w-[calc(100vw-16.5rem)] overflow-hidden min-w-0">
                <div className="w-full p-4 md:p-8 pb-32 min-w-0 overflow-hidden">
                    {filteredProducts.length === 0 ? (
                        <div className="py-20 text-center opacity-40 italic text-[11px] font-black uppercase tracking-widest w-full">
                            No items match the selected filter.
                        </div>
                    ) : (
                        <div className="w-full border rounded-xl bg-card/20 overflow-hidden flex flex-col min-w-0 shadow-sm">
                            {filteredProducts.map((product) => (
                                <DesignProductRow 
                                    key={product.id} 
                                    product={product} 
                                    isDesigner={role === 'DESIGNER'}
                                    onUpdateDesign={(data) => handleUpdateProductDesign(product.id, data)}
                                    onOpenWorkbench={() => {}}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

function FilterTab({ active, onClick, label, count, icon: Icon, color }: { 
    active: boolean, 
    onClick: () => void, 
    label: string, 
    count?: number, 
    icon?: any,
    color?: string
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "h-8 px-3 rounded-md flex items-center gap-2 transition-all shrink-0",
                active ? "bg-background text-foreground shadow-sm ring-1 ring-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
        >
            {Icon && <Icon className={cn("h-3.5 w-3.5", color)} />}
            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{label}</span>
            {count !== undefined && <span className="text-[9px] font-bold opacity-40 font-mono">[{count}]</span>}
        </button>
    );
}
