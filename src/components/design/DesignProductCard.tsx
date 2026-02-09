'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import type { ConfiguredProduct, DesignData, DesignComponent, DesignPin, DesignWorkflowStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DesignCanvas } from './DesignCanvas';
import { FeedbackSidebar } from './FeedbackSidebar';
import { cn } from '@/lib/utils';
import { Package, Layers, Circle } from 'lucide-react';

interface DesignProductCardProps {
    product: ConfiguredProduct;
    isDesigner: boolean;
    onUpdateDesign: (data: DesignData) => void;
}

export function DesignProductCard({ product, isDesigner, onUpdateDesign }: DesignProductCardProps) {
    const designData = useMemo(() => {
        if (product.designData) return product.designData;
        
        // Mock default structure if none exists
        const components: DesignComponent[] = [
            {
                id: 'comp-1',
                name: 'Main Layout',
                status: 'DRAFT',
                versions: [],
                pins: []
            }
        ];

        if (product.productName.toLowerCase().includes('invite')) {
            components.push({
                id: 'comp-2',
                name: 'Envelope',
                status: 'DRAFT',
                versions: [],
                pins: []
            });
        }

        return {
            productId: product.id,
            components
        } as DesignData;
    }, [product.id, product.designData, product.productName]);

    const [activeCompId, setActiveCompId] = useState(designData.components[0].id);
    const [highlightedPinId, setHighlightedPinId] = useState<string | null>(null);

    const activeComponent = designData.components.find(c => c.id === activeCompId)!;
    const currentVersionNum = activeComponent.versions.length > 0 
        ? activeComponent.versions[activeComponent.versions.length - 1].versionNumber 
        : 0;
    
    const activeVersion = activeComponent.versions[activeComponent.versions.length - 1] || null;

    const handleUpdatePins = (newPins: DesignPin[]) => {
        const updatedComponents = designData.components.map(c => 
            c.id === activeCompId ? { ...c, pins: newPins } : c
        );
        onUpdateDesign({ ...designData, components: updatedComponents });
    };

    const handleStatusChange = (status: DesignWorkflowStatus) => {
        const updatedComponents = designData.components.map(c => 
            c.id === activeCompId ? { ...c, status } : c
        );
        onUpdateDesign({ ...designData, components: updatedComponents });
    };

    const handleUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            const newVersionNum = currentVersionNum + 1;
            const newVersion = {
                id: `v-${Date.now()}`,
                versionNumber: newVersionNum,
                imageUrl: result,
                timestamp: new Date().toISOString(),
                author: 'Designer Team'
            };

            const updatedComponents = designData.components.map(c => 
                c.id === activeCompId ? { 
                    ...c, 
                    versions: [...c.versions, newVersion],
                    status: 'DRAFT' as DesignWorkflowStatus
                } : c
            );
            onUpdateDesign({ ...designData, components: updatedComponents });
        };
        reader.readAsDataURL(file);
    };

    return (
        <Card className="overflow-hidden border-2 border-primary/10 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-muted/30 border-b py-3 px-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                            <Package className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-headline font-black text-foreground">{product.productName}</CardTitle>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="secondary" className="text-[8px] font-black uppercase h-3.5 px-1">
                                    {product.variant || 'Standard'}
                                </Badge>
                                {product.quantity && (
                                    <span className="text-[9px] text-muted-foreground font-bold uppercase">Qty: {product.quantity}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] h-[600px]">
                    <div className="flex flex-col border-r border-primary/10 overflow-hidden bg-stone-50/50">
                        <div className="p-2 border-b bg-background/50 flex items-center justify-between">
                            <Tabs value={activeCompId} onValueChange={setActiveCompId} className="w-auto">
                                <TabsList className="h-8 bg-muted/40 p-1">
                                    {designData.components.map(comp => {
                                        const dotColor = comp.status === 'APPROVED' ? 'text-green-500' :
                                                        comp.status === 'CHANGES_REQUESTED' ? 'text-destructive' :
                                                        comp.status === 'INTERNAL_REVIEW' ? 'text-amber-500' : 'text-muted-foreground/30';
                                        return (
                                            <TabsTrigger key={comp.id} value={comp.id} className="text-[9px] font-black uppercase px-2 h-6 gap-1.5">
                                                <Circle className={cn("h-1.5 w-1.5 fill-current", dotColor)} />
                                                {comp.name}
                                            </TabsTrigger>
                                        );
                                    })}
                                </TabsList>
                            </Tabs>
                        </div>
                        
                        <div className="flex-1 relative">
                            <DesignCanvas 
                                imageUrl={activeVersion?.imageUrl || null}
                                pins={activeComponent.pins}
                                highlightedPinId={highlightedPinId}
                                isDesigner={isDesigner}
                                version={currentVersionNum}
                                onAddPin={(x, y) => {
                                    if (activeComponent.status === 'APPROVED' || !activeVersion) return;
                                    const newPin: DesignPin = {
                                        id: `pin-${Date.now()}`,
                                        x,
                                        y,
                                        status: 'open',
                                        author: isDesigner ? 'Designer' : 'Manager',
                                        timestamp: new Date().toISOString(),
                                        version: currentVersionNum,
                                        text: '',
                                        replies: []
                                    };
                                    handleUpdatePins([...activeComponent.pins, newPin]);
                                    setHighlightedPinId(newPin.id);
                                }}
                                onPinClick={setHighlightedPinId}
                                onUpload={handleUpload}
                            />
                        </div>
                    </div>

                    <FeedbackSidebar 
                        pins={activeComponent.pins}
                        versions={activeComponent.versions}
                        highlightedPinId={highlightedPinId}
                        status={activeComponent.status}
                        isDesigner={isDesigner}
                        currentVersion={currentVersionNum}
                        onUpdatePins={handleUpdatePins}
                        onPinSelect={setHighlightedPinId}
                        onStatusChange={handleStatusChange}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
