'use client';

import * as React from 'react';
import type { Order, DesignData } from '@/lib/types';
import { DesignProductCard } from './DesignProductCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette } from 'lucide-react';

interface DesignReviewTabProps {
    order: Order;
    onUpdateOrder: (updatedOrder: Order) => void;
    role: 'MANAGER' | 'DESIGNER';
}

export function DesignReviewTab({ order, onUpdateOrder, role }: DesignReviewTabProps) {
    const handleUpdateProductDesign = (productId: string, designData: DesignData) => {
        const updatedDeliverables = order.deliverables.map(d => 
            d.id === productId ? { ...d, designData } : d
        );
        onUpdateOrder({ ...order, deliverables: updatedDeliverables });
    };

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
        <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-headline font-black text-foreground flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        Proofing & Approval
                    </h2>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                        Collaborative feedback loop
                    </p>
                </div>
            </div>

            <ScrollArea className="flex-1 bg-background/50">
                <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-12 pb-32">
                    <div className="grid grid-cols-1 gap-12">
                        {order.deliverables.map((product) => (
                            <DesignProductCard 
                                key={product.id} 
                                product={product} 
                                isDesigner={role === 'DESIGNER'}
                                onUpdateDesign={(data) => handleUpdateProductDesign(product.id, data)}
                            />
                        ))}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
