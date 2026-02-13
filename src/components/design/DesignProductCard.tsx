'use client';

import * as React from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import type { ConfiguredProduct, DesignData, DesignPin, DesignWorkflowStatus, DesignVersion, CustomerData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DesignCanvas } from './DesignCanvas';
import { FeedbackSidebar } from './FeedbackSidebar';
import { cn } from '@/lib/utils';
import { 
    Package, 
    X, 
    PackageCheck,
    LayoutPanelTop
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface DesignProductCardProps {
    product: ConfiguredProduct;
    isDesigner: boolean;
    onUpdateDesign: (data: DesignData) => void;
    customerData?: CustomerData;
}

export function DesignProductCard({ product, isDesigner, onUpdateDesign, customerData }: DesignProductCardProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [newDrafts, setNewDrafts] = useState<Record<string, boolean>>({});

    const lastLocalUpdateRef = useRef<number>(0);

    const initialDesignData = useMemo(() => {
        const baseData = product.designData || {
            productId: product.id,
            isStock: false,
            components: [{ id: 'comp-1', name: 'Main Layout', status: 'PENDING', versions: [], pins: [] }]
        };
        return {
            ...baseData,
            components: (baseData.components || []).map(c => ({
                ...c,
                status: c.status || 'PENDING',
                versions: c.versions || [],
                pins: c.pins || []
            }))
        } as DesignData;
    }, [product.id, product.designData]);

    const [localDesignData, setLocalDesignData] = useState<DesignData>(initialDesignData);
    
    useEffect(() => { 
        const timeSinceLastUpdate = Date.now() - lastLocalUpdateRef.current;
        if (timeSinceLastUpdate < 2000) {
            return;
        }
        setLocalDesignData(initialDesignData); 
    }, [initialDesignData]);

    const [activeCompId, setActiveCompId] = useState(localDesignData.components[0]?.id);
    const [highlightedPinId, setHighlightedPinId] = useState<string | null>(null);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

    useEffect(() => {
        const currentStillExists = localDesignData.components.some(c => c.id === activeCompId);
        if (!currentStillExists && localDesignData.components.length > 0) setActiveCompId(localDesignData.components[0].id);
    }, [localDesignData.components, activeCompId]);

    const activeComponent = localDesignData.components.find(c => c.id === activeCompId) || localDesignData.components[0];
    
    // Auto-open popover when a new pin is added locally
    useEffect(() => {
        const pins = activeComponent.pins || [];
        if (pins.length > 0) {
            const latestPin = pins[pins.length - 1];
            const isVeryRecent = Date.now() - new Date(latestPin.timestamp).getTime() < 1000;
            if (isVeryRecent && !latestPin.text && highlightedPinId !== latestPin.id) {
                // Use a small delay to ensure the DOM is ready for the popover
                const timer = setTimeout(() => {
                    setHighlightedPinId(latestPin.id);
                }, 50);
                return () => clearTimeout(timer);
            }
        }
    }, [activeComponent.pins]);

    const isEligibleForStock = useMemo(() => {
        if (localDesignData.isStock) return false;
        return localDesignData.components.every(c => c.status === 'PENDING' && (!c.versions || c.versions.length === 0));
    }, [localDesignData]);

    const currentVersionNum = (activeComponent.versions && activeComponent.versions.length > 0)
        ? activeComponent.versions[activeComponent.versions.length - 1].versionNumber : 0;
    
    const visibleVersions = useMemo(() => {
        if (isDesigner) return activeComponent.versions;
        if (activeComponent.status === 'DRAFT' && activeComponent.versions.length > 0) return activeComponent.versions.slice(0, -1);
        return activeComponent.versions;
    }, [activeComponent.versions, activeComponent.status, isDesigner]);

    const activeVersion = useMemo(() => {
        if (!visibleVersions || visibleVersions.length === 0) return null;
        if (selectedVersionId) return visibleVersions.find(v => v.id === selectedVersionId) || visibleVersions[visibleVersions.length - 1];
        return visibleVersions[visibleVersions.length - 1];
    }, [visibleVersions, selectedVersionId]);

    const viewedVersionNum = activeVersion?.versionNumber || 0;

    const handleUpdateDesignInternal = (updatedData: DesignData) => {
        lastLocalUpdateRef.current = Date.now();
        setLocalDesignData(updatedData);
        setTimeout(() => onUpdateDesign(updatedData), 0);
    };

    const handleStatusChange = (status: DesignWorkflowStatus) => {
        if (status === 'INTERNAL_REVIEW' || status === 'PENDING') {
            setNewDrafts(prev => ({ ...prev, [activeCompId]: false }));
        }
        const updatedComponents = localDesignData.components.map(c => c.id === activeCompId ? { ...c, status } : c);
        handleUpdateDesignInternal({ ...localDesignData, components: updatedComponents });
    };

    const handleUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            
            const targetComp = localDesignData.components.find(c => c.id === activeCompId) || localDesignData.components[0];
            const currentVNum = (targetComp?.versions && targetComp.versions.length > 0) 
                ? targetComp.versions[targetComp.versions.length - 1].versionNumber 
                : 0;
            
            const newVersion: DesignVersion = { 
                id: `v-${Date.now()}`, 
                versionNumber: currentVNum + 1, 
                imageUrl: result, 
                timestamp: new Date().toISOString(), 
                author: isDesigner ? 'Designer' : 'Manager' 
            };
            
            const updatedComponents = localDesignData.components.map((c, idx) => {
                const isTarget = activeCompId ? c.id === activeCompId : idx === 0;
                if (isTarget) {
                    return { ...c, versions: [...(c.versions || []), newVersion], status: 'DRAFT' as DesignWorkflowStatus };
                }
                return c;
            });
            
            const nextData = { ...localDesignData, components: updatedComponents };
            const effectiveCompId = activeCompId || localDesignData.components[0].id;
            
            setNewDrafts(prevDrafts => ({ ...prevDrafts, [effectiveCompId]: true }));
            setSelectedVersionId(newVersion.id);
            handleUpdateDesignInternal(nextData);
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteDraft = () => {
        if (activeComponent.versions.length > 0) {
            const newVersions = [...activeComponent.versions];
            newVersions.pop();
            const updatedComponents = localDesignData.components.map(c => 
                c.id === activeCompId ? { ...c, versions: newVersions, status: newVersions.length === 0 ? 'PENDING' : c.status } : c
            );
            const nextData = { ...localDesignData, components: updatedComponents };
            
            setNewDrafts(prev => ({ ...prev, [activeCompId]: false }));
            setSelectedVersionId(null);
            handleUpdateDesignInternal(nextData);
        }
    };

    const handleAddPin = (x: number, y: number) => {
        const newPinId = `pin-${Date.now()}`;
        const newPin: DesignPin = { 
            id: newPinId, 
            x, 
            y, 
            status: 'open', 
            author: isDesigner ? 'Designer' : 'Manager', 
            timestamp: new Date().toISOString(), 
            version: viewedVersionNum, 
            text: '', 
            replies: [] 
        };
        
        let componentUpdated = false;
        const updatedComponents = localDesignData.components.map(c => {
            if (c.id === activeCompId) {
                componentUpdated = true;
                return { ...c, pins: [...(c.pins || []), newPin] };
            }
            return c;
        });

        let finalComponents = updatedComponents;
        if (!componentUpdated && localDesignData.components.length > 0) {
            finalComponents = localDesignData.components.map((c, idx) => 
                idx === 0 ? { ...c, pins: [...(c.pins || []), newPin] } : c
            );
        }
        
        handleUpdateDesignInternal({ ...localDesignData, components: finalComponents });
    };

    const handleUpdatePins = (newPins: DesignPin[]) => {
        const updatedComponents = localDesignData.components.map(c => 
            c.id === activeCompId ? { ...c, pins: newPins } : c
        );
        handleUpdateDesignInternal({ ...localDesignData, components: updatedComponents });
    };

    const getStatusColor = (status: DesignWorkflowStatus) => {
        switch (status) {
            case 'APPROVED': return 'border-green-500 bg-green-500/10';
            case 'INTERNAL_REVIEW': case 'CUSTOMER_REVIEW': return 'border-blue-500 bg-blue-500/10';
            case 'DRAFT': return 'border-orange-500 bg-orange-500/10';
            default: return 'border-primary/10 bg-muted/5';
        }
    };

    const feedbackSidebarProps = {
        pins: activeComponent.pins || [],
        versions: visibleVersions,
        highlightedPinId: highlightedPinId,
        selectedVersionId: activeVersion?.id || null,
        status: activeComponent.status || 'PENDING',
        isDesigner: isDesigner,
        currentVersion: currentVersionNum,
        viewedVersion: viewedVersionNum,
        onUpdatePins: handleUpdatePins,
        onPinSelect: setHighlightedPinId,
        onVersionSelect: setSelectedVersionId,
        onStatusChange: handleStatusChange,
        onUpdateVersions: (v: any) => {},
        onDeleteDraft: handleDeleteDraft,
        hasNewDraft: !!newDrafts[activeCompId],
        onUpload: handleUpload,
        customerData,
        activeProductId: product.id.toString()
    };

    return (
        <>
            <Card className="overflow-hidden border-2 border-primary/10 shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader className="bg-muted/30 border-b py-3 px-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary"><Package className="h-5 w-5" /></div>
                            <div><CardTitle className="text-sm font-headline font-black">{product.productName}</CardTitle></div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isEligibleForStock && (
                                <Button variant="outline" size="sm" onClick={() => {
                                    if(confirm("Mark this product as stock? This will hide all design tools.")) {
                                        handleUpdateDesignInternal({ ...localDesignData, isStock: true });
                                    }
                                }} className="h-8 font-black uppercase text-[10px] tracking-widest"><PackageCheck className="h-3.5 w-3.5 mr-1.5" /> Stock</Button>
                            )}
                            <Button size="sm" onClick={() => setIsFullscreen(true)} className="h-8 font-black uppercase text-[10px] tracking-widest gap-1.5"><LayoutPanelTop className="h-3.5 w-3.5" /> Start Design</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {localDesignData.isStock ? (
                        <div className="flex flex-col items-center justify-center h-[200px] bg-muted/5">
                            <PackageCheck className="h-10 w-10 text-primary/40 mb-3" />
                            <h3 className="font-headline font-black uppercase tracking-widest text-xs">Stock Item</h3>
                            <Button variant="link" size="sm" onClick={() => handleUpdateDesignInternal({ ...localDesignData, isStock: false })} className="text-[10px] uppercase font-black tracking-widest">Restore Design Tools</Button>
                        </div>
                    ) : (
                        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {localDesignData.components.map(comp => (
                                <div key={comp.id} className={cn("p-3 rounded-lg border-2 text-center space-y-1 transition-all", getStatusColor(comp.status))}>
                                    <div className="text-[10px] font-black uppercase tracking-wider truncate">{comp.name}</div>
                                    <div className="flex items-center justify-center gap-2 text-[9px] font-bold opacity-60">
                                        <span>V{(comp.versions || []).length}</span>
                                        <span>•</span>
                                        <span className="uppercase tracking-tighter">{comp.status.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
                <DialogContent className="max-w-[100vw] w-screen h-screen p-0 gap-0 border-none rounded-none flex flex-col bg-background overflow-hidden animate-in zoom-in-95 duration-300">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Design Workbench - {product.productName}</DialogTitle>
                        <DialogDescription>Review design proofs and feedback for {product.productName}.</DialogDescription>
                    </DialogHeader>
                    <div className={cn("flex-1 flex overflow-hidden border-[6px] transition-colors duration-500", 
                        activeComponent.status === 'APPROVED' ? "border-green-500/30" : 
                        activeComponent.status === 'DRAFT' ? "border-orange-500/30" : "border-blue-500/30"
                    )}>
                        <div className="flex-1 relative flex flex-col min-w-0 bg-stone-100">
                            <div className="h-14 shrink-0 flex items-center justify-between px-6 bg-background/80 backdrop-blur-xl border-b z-50">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <h2 className="font-headline font-black text-sm truncate">{product.productName}</h2>
                                    <div className="h-4 w-px bg-border" />
                                    <Tabs value={activeCompId} onValueChange={setActiveCompId} className="hidden sm:block">
                                        <TabsList className="bg-transparent h-10 p-0 gap-4">
                                            {localDesignData.components.map(comp => (
                                                <TabsTrigger key={comp.id} value={comp.id} className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent font-black uppercase text-[10px] tracking-widest px-0">
                                                    {comp.name} <span className="ml-1 opacity-40 font-mono">V{(comp.versions || []).length}</span>
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                    </Tabs>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge className={cn("font-black text-[10px] px-3 h-7 tracking-widest", 
                                        activeComponent.status === 'APPROVED' ? "bg-green-600" :
                                        activeComponent.status === 'DRAFT' ? "bg-orange-500" : "bg-blue-600"
                                    )}>
                                        {activeComponent.status.replace('_', ' ')}
                                    </Badge>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setIsFullscreen(false)}><X className="h-5 w-5" /></Button>
                                </div>
                            </div>

                            <div className="flex-1 relative overflow-hidden">
                                <DesignCanvas 
                                    imageUrl={activeVersion?.imageUrl || null}
                                    pins={activeComponent.pins || []}
                                    highlightedPinId={highlightedPinId}
                                    isDesigner={isDesigner}
                                    version={viewedVersionNum}
                                    currentVersion={currentVersionNum}
                                    status={activeComponent.status}
                                    hasNewDraft={!!newDrafts[activeCompId]}
                                    onAddPin={handleAddPin}
                                    onPinClick={setHighlightedPinId}
                                    onUpdatePins={handleUpdatePins}
                                    onUpload={handleUpload}
                                    isWorkbench={true}
                                />
                            </div>

                            {visibleVersions.length > 0 && (
                                <div className="h-24 shrink-0 bg-background/80 backdrop-blur-xl border-t z-50 flex items-center px-6 overflow-x-auto no-scrollbar gap-4">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground vertical-text shrink-0 mr-4">Timeline</div>
                                    {visibleVersions.map((v) => (
                                        <button 
                                            key={v.id} 
                                            onClick={() => setSelectedVersionId(v.id)}
                                            className={cn(
                                                "h-16 w-24 shrink-0 rounded-lg border-2 overflow-hidden transition-all relative group",
                                                selectedVersionId === v.id || (!selectedVersionId && v.versionNumber === viewedVersionNum) 
                                                    ? "border-primary ring-4 ring-primary/10 scale-105 shadow-xl" 
                                                    : "border-transparent opacity-60 hover:opacity-100 hover:border-primary/40"
                                            )}
                                        >
                                            <img src={v.imageUrl} className="w-full h-full object-cover" alt={`Version ${v.versionNumber}`} />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] font-black text-white font-mono">V{v.versionNumber}</span>
                                            </div>
                                            {(selectedVersionId === v.id || (!selectedVersionId && v.versionNumber === viewedVersionNum)) && (
                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="w-[360px] md:w-[400px] flex flex-col shrink-0 bg-background shadow-2xl z-[100]">
                            <FeedbackSidebar {...feedbackSidebarProps} />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <style jsx global>{`
                .vertical-text { writing-mode: vertical-lr; transform: rotate(180deg); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </>
    );
}
