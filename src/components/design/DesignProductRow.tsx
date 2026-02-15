
'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import type { ConfiguredProduct, DesignData, DesignWorkflowStatus, DesignComponent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
    Package, 
    ChevronDown, 
    ChevronUp, 
    ExternalLink, 
    PackageCheck,
    Archive,
    History
} from 'lucide-react';
import { productCatalog } from '@/lib/product-data';
import { format } from 'date-fns';

interface DesignProductRowProps {
    product: ConfiguredProduct;
    isDesigner: boolean;
    onUpdateDesign: (data: DesignData) => void;
    onOpenWorkbench: () => void;
}

const STATUS_CONFIG: Record<DesignWorkflowStatus, { bg: string, border: string, text: string }> = {
    PENDING: { bg: 'bg-stone-400', border: 'border-stone-400', text: 'text-stone-900' },
    DRAFT: { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-white' },
    INTERNAL_REVIEW: { bg: 'bg-purple-600', border: 'border-purple-600', text: 'text-white' },
    CUSTOMER_REVIEW: { bg: 'bg-blue-600', border: 'border-blue-600', text: 'text-white' },
    APPROVED: { bg: 'bg-green-600', border: 'border-green-600', text: 'text-white' }
};

export function DesignProductRow({ product, isDesigner, onUpdateDesign, onOpenWorkbench }: DesignProductRowProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const designData = useMemo(() => product.designData || {
        productId: product.id,
        isStock: false,
        components: [{ id: 'comp-1', name: 'Main Layout', status: 'PENDING', versions: [], pins: [] }]
    }, [product.id, product.designData]);

    const aggregateStatus = useMemo(() => {
        if (designData.isStock) return 'APPROVED';
        const components = designData.components || [];
        if (components.length === 0) return 'PENDING';
        
        if (components.some(c => c.status === 'PENDING')) return 'PENDING';
        if (components.some(c => c.status === 'DRAFT')) return 'DRAFT';
        if (components.some(c => c.status === 'INTERNAL_REVIEW')) return 'INTERNAL_REVIEW';
        if (components.some(c => c.status === 'CUSTOMER_REVIEW')) return 'CUSTOMER_REVIEW';
        if (components.every(c => c.status === 'APPROVED')) return 'APPROVED';
        return 'PENDING';
    }, [designData]);

    const isEligibleForStock = useMemo(() => {
        if (designData.isStock) return false;
        // MUST be all PENDING and NO versions added in any component
        return designData.components.every(c => 
            c.status === 'PENDING' && (!c.versions || c.versions.length === 0)
        );
    }, [designData]);

    const getCoreSpecs = () => {
        const catalogItem = productCatalog.find(p => p.id === product.productId);
        const parts: string[] = [];
        
        if (product.variant) parts.push(product.variant);
        
        if (catalogItem?.configType === 'A' && typeof product.quantity === 'number') {
            parts.push(`Qty: ${product.quantity}`);
        } else if (catalogItem?.configType === 'B' && typeof product.pages === 'number') {
            parts.push(`${product.pages} Pgs`);
        }

        if (catalogItem?.customFields && product.customFieldValues) {
            catalogItem.customFields.forEach(field => {
                const val = product.customFieldValues?.[field.id];
                if (val && typeof val === 'number') {
                    parts.push(`${field.name}: ${val}`);
                }
            });
        }

        return parts.join(' • ');
    };

    const activeAddons = useMemo(() => {
        return (product.addons || []).filter((a: any) => a.value !== undefined && a.value !== false && a.value !== null);
    }, [product.addons]);

    const handleToggleStock = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUpdateDesign({ ...designData, isStock: !designData.isStock });
    };

    return (
        <div className="group/row w-full max-w-full overflow-hidden">
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "flex items-center h-16 bg-card hover:bg-muted/30 transition-all border-y border-primary/5 cursor-pointer relative w-full",
                    isExpanded && "bg-muted/20"
                )}
            >
                {/* Zone A: Status Indicator */}
                <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 transition-colors shrink-0", STATUS_CONFIG[aggregateStatus].bg)} />

                {/* Zone B: Identity */}
                <div className="w-64 px-6 shrink-0 flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Package className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold text-sm truncate">{product.productName}</div>
                        {designData.isStock && <Badge variant="secondary" className="h-4 text-[8px] font-black uppercase px-1">Stock</Badge>}
                    </div>
                </div>

                {/* Zone C: Unified Specs - The Scrolling Column */}
                <div className="flex-1 min-w-0 px-4 space-y-0.5 overflow-hidden flex flex-col justify-center">
                    <div className="text-[11px] font-bold text-foreground/80 truncate">
                        {getCoreSpecs() || "No core specs"}
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 whitespace-nowrap min-w-0">
                        {activeAddons.length > 0 && activeAddons.map((addon) => (
                            <Badge 
                                key={addon.id} 
                                variant="outline" 
                                className="h-4 text-[8px] font-black uppercase px-1 border-primary/20 text-primary shrink-0 whitespace-nowrap"
                            >
                                {addon.name}{typeof addon.value === 'number' ? `: ${addon.value}` : ''}
                            </Badge>
                        ))}
                        {product.specialRequest && (
                            <div className="text-[10px] italic font-semibold text-destructive whitespace-nowrap shrink-0 ml-1">
                                Req: {product.specialRequest}
                            </div>
                        )}
                    </div>
                </div>

                {/* Zone D: Component Track */}
                <div className="w-72 px-4 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap shrink-0">
                    {!designData.isStock ? (
                        designData.components.map((comp) => (
                            <div 
                                key={comp.id}
                                className={cn(
                                    "h-6 px-2 rounded-md flex items-center justify-center min-w-[3rem] shrink-0 shadow-sm border transition-all",
                                    STATUS_CONFIG[comp.status].bg,
                                    STATUS_CONFIG[comp.status].border,
                                    STATUS_CONFIG[comp.status].text
                                )}
                                title={`${comp.name}: ${comp.status}`}
                            >
                                <span className="text-[10px] font-black tracking-tighter">V{comp.versions.length}</span>
                            </div>
                        ))
                    ) : (
                        <div className="h-6 px-3 rounded-full bg-green-100 text-green-700 border border-green-200 flex items-center gap-1.5 shrink-0">
                            <PackageCheck className="h-3 w-3" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Ready</span>
                        </div>
                    )}
                </div>

                {/* Zone E: Actions */}
                <div className="w-64 px-6 flex items-center justify-end gap-3 shrink-0">
                    <div className="flex items-center justify-center w-8">
                        {(designData.isStock || isEligibleForStock) && (
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 w-8 p-0 border-primary/20 text-muted-foreground hover:text-primary opacity-0 group-hover/row:opacity-100 transition-opacity"
                                onClick={handleToggleStock}
                                title={designData.isStock ? "Restore Design Tools" : "Mark as Stock"}
                            >
                                {designData.isStock ? <Package className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                            </Button>
                        )}
                    </div>
                    <Button 
                        size="sm" 
                        className="h-8 text-[10px] font-black uppercase tracking-widest gap-1.5 shadow-sm min-w-[120px]"
                        onClick={(e) => { e.stopPropagation(); onOpenWorkbench(); }}
                    >
                        <ExternalLink className="h-3.5 w-3.5" /> Workbench
                    </Button>
                    <div className="w-6 flex items-center justify-center">
                        {isExpanded ? <ChevronUp className="h-4 w-4 opacity-30" /> : <ChevronDown className="h-4 w-4 opacity-30" />}
                    </div>
                </div>
            </div>

            {/* Zone F: Expansion Detail Panel */}
            {isExpanded && (
                <div className="bg-muted/10 border-b border-primary/5 animate-in slide-in-from-top-2 duration-200 w-full">
                    <div className="px-24 py-4">
                        <div className="rounded-lg border bg-background/50 overflow-hidden shadow-inner">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-muted/30 text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b">
                                        <th className="px-4 py-2">Component Name</th>
                                        <th className="px-4 py-2">Version</th>
                                        <th className="px-4 py-2">Status</th>
                                        <th className="px-4 py-2">Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px] font-semibold">
                                    {designData.components.map((comp) => {
                                        const lastVersion = comp.versions[comp.versions.length - 1];
                                        return (
                                            <tr key={comp.id} className="border-b last:border-0 hover:bg-muted/20">
                                                <td className="px-4 py-2.5 font-bold">{comp.name}</td>
                                                <td className="px-4 py-2.5">
                                                    <Badge variant="outline" className="h-5 rounded-md px-1.5 font-mono text-[10px] font-black">
                                                        V{comp.versions.length}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("h-2 w-2 rounded-full", STATUS_CONFIG[comp.status].bg)} />
                                                        <span className="uppercase text-[9px] tracking-tight text-muted-foreground">{comp.status.replace('_', ' ')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-muted-foreground text-[10px]">
                                                    {lastVersion ? format(new Date(lastVersion.timestamp), 'dd MMM, HH:mm') : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
