'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import type { ConfiguredProduct, DesignData, DesignComponent, DesignPin, DesignPinStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DesignCanvas } from './DesignCanvas';
import { FeedbackSidebar } from './FeedbackSidebar';
import { cn } from '@/lib/utils';
import { Package, Layers } from 'lucide-react';

interface DesignProductCardProps {
    product: ConfiguredProduct;
    onUpdateDesign: (data: DesignData) => void;
}

export function DesignProductCard({ product, onUpdateDesign }: DesignProductCardProps) {
    // Initialize mock design data if not present
    const designData = useMemo(() => {
        if (product.designData) return product.designData;
        
        // Default components based on product type
        const components: DesignComponent[] = [
            {
                id: 'comp-1',
                name: 'Main Layout',
                imageUrl: `https://picsum.photos/seed/${product.id}-main/1200/800`,
                pins: []
            }
        ];

        // Add secondary component for specific items
        if (product.productName.toLowerCase().includes('invite')) {
            components.push({
                id: 'comp-2',
                name: 'Envelope',
                imageUrl: `https://picsum.photos/seed/${product.id}-env/1200/800`,
                pins: []
            });
        }

        return {
            currentVersion: 1,
            components
        } as DesignData;
    }, [product.id, product.designData, product.productName]);

    const [activeCompId, setActiveCompId] = useState(designData.components[0].id);
    const [highlightedPinId, setHighlightedPinId] = useState<string | null>(null);

    const activeComponent = designData.components.find(c => c.id === activeCompId)!;

    const handleUpdatePins = (newPins: DesignPin[]) => {
        const updatedComponents = designData.components.map(c => 
            c.id === activeCompId ? { ...c, pins: newPins } : c
        );
        onUpdateDesign({ ...designData, components: updatedComponents });
    };

    const handlePinClick = (pinId: string) => {
        setHighlightedPinId(pinId);
        // Reset highlight after a delay
        setTimeout(() => setHighlightedPinId(null), 3000);
    };

    return (
        <Card className="overflow-hidden border-2 border-primary/10 shadow-lg bg-card/50 backdrop-blur-sm group hover:border-primary/20 transition-all duration-300">
            <CardHeader className="bg-muted/30 border-b py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Package className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-headline font-black text-foreground">{product.productName}</CardTitle>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest h-4 px-1.5">
                                    {product.variant || 'Standard'}
                                </Badge>
                                {product.quantity && (
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                        Qty: {product.quantity}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Draft</span>
                            <span className="text-sm font-black text-primary">VERSION V{designData.currentVersion}</span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] h-[650px]">
                    {/* Left Pane: Canvas */}
                    <div className="flex flex-col border-r border-primary/10 overflow-hidden bg-stone-50/50">
                        <div className="p-3 border-b bg-background/50 flex items-center justify-between">
                            <Tabs value={activeCompId} onValueChange={setActiveCompId} className="w-auto">
                                <TabsList className="h-8 bg-muted/40 p-1">
                                    {designData.components.map(comp => (
                                        <TabsTrigger 
                                            key={comp.id} 
                                            value={comp.id}
                                            className="text-[10px] font-black uppercase px-3 h-6"
                                        >
                                            <Layers className="h-3 w-3 mr-1.5 opacity-50" />
                                            {comp.name}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                            <Badge variant="outline" className="text-[9px] font-bold border-primary/20 text-muted-foreground">
                                IMAGE: {activeComponent.imageUrl.split('/').pop()}
                            </Badge>
                        </div>
                        
                        <div className="flex-1 relative">
                            <DesignCanvas 
                                imageUrl={activeComponent.imageUrl}
                                pins={activeComponent.pins}
                                highlightedPinId={highlightedPinId}
                                onAddPin={(x, y) => {
                                    const newPin: DesignPin = {
                                        id: `pin-${Date.now()}`,
                                        x,
                                        y,
                                        status: 'open',
                                        author: 'Project Manager',
                                        timestamp: new Date().toISOString(),
                                        version: designData.currentVersion,
                                        text: '',
                                        replies: []
                                    };
                                    handleUpdatePins([...activeComponent.pins, newPin]);
                                    setHighlightedPinId(newPin.id);
                                }}
                                onPinClick={handlePinClick}
                                version={designData.currentVersion}
                            />
                        </div>
                    </div>

                    {/* Right Pane: Sidebar */}
                    <FeedbackSidebar 
                        pins={activeComponent.pins}
                        highlightedPinId={highlightedPinId}
                        onUpdatePins={handleUpdatePins}
                        onPinSelect={handlePinClick}
                        currentVersion={designData.currentVersion}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
