'use client';

import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import type { ConfiguredProduct, DesignData, DesignComponent, DesignPin, DesignWorkflowStatus, DesignVersion } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DesignCanvas } from './DesignCanvas';
import { FeedbackSidebar } from './FeedbackSidebar';
import { cn } from '@/lib/utils';
import { Package, Circle, Plus, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { productCatalog } from '@/lib/product-data';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DesignProductCardProps {
    product: ConfiguredProduct;
    isDesigner: boolean;
    onUpdateDesign: (data: DesignData) => void;
}

export function DesignProductCard({ product, isDesigner, onUpdateDesign }: DesignProductCardProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [compNameInput, setCompNameInput] = useState('');
    const [editingCompId, setEditingCompId] = useState<string | null>(null);
    
    // Tracker for new uploads in the current session (Work Started vs Draft Pending)
    const [newDrafts, setNewDrafts] = useState<Record<string, boolean>>({});

    const designData = useMemo(() => {
        const baseData = product.designData || {
            productId: product.id,
            components: [
                {
                    id: 'comp-1',
                    name: 'Main Layout',
                    status: 'PENDING' as DesignWorkflowStatus,
                    versions: [],
                    pins: []
                }
            ]
        };

        return {
            ...baseData,
            components: (baseData.components || []).map(c => ({
                ...c,
                status: c.status || 'PENDING' as DesignWorkflowStatus,
                versions: c.versions || [],
                pins: c.pins || []
            }))
        } as DesignData;
    }, [product.id, product.designData]);

    const [activeCompId, setActiveCompId] = useState(designData.components[0]?.id);
    const [highlightedPinId, setHighlightedPinId] = useState<string | null>(null);

    useEffect(() => {
        const currentStillExists = designData.components.some(c => c.id === activeCompId);
        if (!currentStillExists && designData.components.length > 0) {
            setActiveCompId(designData.components[0].id);
        }
    }, [designData.components, activeCompId]);

    const activeComponent = designData.components.find(c => c.id === activeCompId) || designData.components[0];
    
    if (!activeComponent) return null;

    const currentVersionNum = (activeComponent.versions && activeComponent.versions.length > 0)
        ? activeComponent.versions[activeComponent.versions.length - 1].versionNumber 
        : 0;
    
    const activeVersion = (activeComponent.versions && activeComponent.versions.length > 0)
        ? activeComponent.versions[activeComponent.versions.length - 1] 
        : null;

    const handleAddComponent = () => {
        if (!compNameInput.trim()) return;
        const newComp: DesignComponent = {
            id: `comp-${Date.now()}`,
            name: compNameInput.trim(),
            status: 'PENDING',
            versions: [],
            pins: []
        };
        const updated = { ...designData, components: [...designData.components, newComp] };
        onUpdateDesign(updated);
        setActiveCompId(newComp.id);
        setIsAddModalOpen(false);
        setCompNameInput('');
    };

    const handleRenameComponent = () => {
        if (!compNameInput.trim() || !editingCompId) return;
        const updatedComponents = designData.components.map(c => 
            c.id === editingCompId ? { ...c, name: compNameInput.trim() } : c
        );
        onUpdateDesign({ ...designData, components: updatedComponents });
        setIsRenameModalOpen(false);
        setCompNameInput('');
        setEditingCompId(null);
    };

    const handleDeleteComponent = (compId: string) => {
        if (designData.components.length <= 1) return;
        const updatedComponents = designData.components.filter(c => c.id !== compId);
        onUpdateDesign({ ...designData, components: updatedComponents });
    };

    const handleUpdatePins = (newPins: DesignPin[]) => {
        const updatedComponents = designData.components.map(c => 
            c.id === activeCompId ? { ...c, pins: newPins } : c
        );
        onUpdateDesign({ ...designData, components: updatedComponents });
    };

    const handleStatusChange = (status: DesignWorkflowStatus) => {
        // Clear new draft flag if submitting or reverting
        if (status === 'INTERNAL_REVIEW' || status === 'PENDING') {
            setNewDrafts(prev => ({ ...prev, [activeCompId]: false }));
        }
        
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
            const newVersion: DesignVersion = {
                id: `v-${Date.now()}`,
                versionNumber: newVersionNum,
                imageUrl: result,
                timestamp: new Date().toISOString(),
                author: isDesigner ? 'Designer Team' : 'Manager Team'
            };

            const updatedComponents = designData.components.map(c => 
                c.id === activeCompId ? { 
                    ...c, 
                    versions: [...(c.versions || []), newVersion],
                    status: 'DRAFT' as DesignWorkflowStatus
                } : c
            );
            onUpdateDesign({ ...designData, components: updatedComponents });
            setNewDrafts(prev => ({ ...prev, [activeCompId]: true }));
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateVersions = (newVersions: DesignVersion[]) => {
        const updatedComponents = designData.components.map(c => {
            if (c.id === activeCompId) {
                const nextStatus: DesignWorkflowStatus = newVersions.length === 0 ? 'PENDING' : c.status;
                return { ...c, versions: newVersions, status: nextStatus };
            }
            return c;
        });
        onUpdateDesign({ ...designData, components: updatedComponents });
    };

    const handleDeleteDraft = () => {
        if (activeComponent.versions.length > 0) {
            const newVersions = [...activeComponent.versions];
            newVersions.pop(); // Remove most recently added version
            handleUpdateVersions(newVersions);
            setNewDrafts(prev => ({ ...prev, [activeCompId]: false }));
        }
    };

    const getProductSpecsSummary = () => {
        const catalogItem = productCatalog.find(p => p.id === product.productId);
        const parts: React.ReactNode[] = [];
        
        if (product.variant) {
            parts.push(<span key="variant" className="font-black text-foreground">{product.variant}</span>);
        }

        if (catalogItem?.configType === 'A' && typeof product.quantity === 'number' && product.quantity > 0) {
            parts.push(<span key="qty" className="font-bold">Qty: {product.quantity}</span>);
        } else if (catalogItem?.configType === 'B' && typeof product.pages === 'number' && product.pages > 0) {
            parts.push(<span key="pages" className="font-bold">{product.pages} Pgs</span>);
        }

        if (catalogItem?.customFields && product.customFieldValues) {
            catalogItem.customFields.forEach(field => {
                const val = (product.customFieldValues as any)?.[field.id];
                if (val && typeof val === 'number' && val > 0) {
                    parts.push(<span key={field.id} className="font-bold">{field.name}: {val}</span>);
                }
            });
        }

        const activeAddons = (product.addons || []).filter((a: any) => a.value !== undefined && a.value !== false && a.value !== null);
        if (activeAddons.length > 0) {
            const addonsDisplay = activeAddons.map(a => {
                const valDisplay = typeof a.value === 'number' ? `: ${a.value}` : '';
                return `${a.name}${valDisplay}`;
            }).join(', ');
            parts.push(<span key="addons-label" className="font-black text-primary">Add-on: {addonsDisplay}</span>);
        }

        if (product.specialRequest) {
            parts.push(<span key="special" className="italic font-bold text-destructive">Note: {product.specialRequest}</span>);
        }

        return parts.length > 0 
            ? parts.reduce((prev, curr, i) => [prev, <span key={`sep-${i}`} className="mx-2 text-muted-foreground/30 font-black tracking-tighter">•</span>, curr])
            : null;
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
                            <div className="flex items-center text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">
                                {getProductSpecsSummary()}
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] h-[600px]">
                    <div className="flex flex-col border-r border-primary/10 overflow-hidden bg-stone-50/50">
                        <div className="p-2 border-b bg-background/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Tabs value={activeCompId} onValueChange={setActiveCompId} className="w-auto">
                                    <TabsList className="h-8 bg-muted/40 p-1">
                                        {(designData.components || []).map(comp => {
                                            const dotColor = comp.status === 'APPROVED' ? 'text-green-500' :
                                                            comp.status === 'CUSTOMER_REVIEW' ? 'text-blue-500' :
                                                            comp.status === 'INTERNAL_REVIEW' ? 'text-amber-500' : 
                                                            comp.status === 'PENDING' ? 'text-muted-foreground/30' : 'text-primary/50';
                                            return (
                                                <TabsTrigger key={comp.id} value={comp.id} className="text-[9px] font-black uppercase px-2 h-6 gap-1.5">
                                                    <Circle className={cn("h-1.5 w-1.5 fill-current", dotColor)} />
                                                    {comp.name}
                                                </TabsTrigger>
                                            );
                                        })}
                                    </TabsList>
                                </Tabs>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-primary hover:bg-primary/10"
                                    onClick={() => { setCompNameInput(''); setIsAddModalOpen(true); }}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-1">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                            setEditingCompId(activeComponent.id);
                                            setCompNameInput(activeComponent.name);
                                            setIsRenameModalOpen(true);
                                        }}>
                                            <Pencil className="h-3.5 w-3.5 mr-2" /> Rename Component
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            className="text-destructive focus:text-destructive"
                                            disabled={designData.components.length <= 1}
                                            onClick={() => handleDeleteComponent(activeComponent.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Component
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        
                        <div className="flex-1 relative">
                            <DesignCanvas 
                                imageUrl={activeVersion?.imageUrl || null}
                                pins={activeComponent.pins || []}
                                highlightedPinId={highlightedPinId}
                                isDesigner={isDesigner}
                                version={currentVersionNum}
                                status={activeComponent.status || 'PENDING'}
                                onAddPin={(x, y) => {
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
                                    handleUpdatePins([...(activeComponent.pins || []), newPin]);
                                    setHighlightedPinId(newPin.id);
                                }}
                                onPinClick={setHighlightedPinId}
                                onUpload={handleUpload}
                            />
                        </div>
                    </div>

                    <FeedbackSidebar 
                        pins={activeComponent.pins || []}
                        versions={activeComponent.versions || []}
                        highlightedPinId={highlightedPinId}
                        status={activeComponent.status || 'PENDING'}
                        isDesigner={isDesigner}
                        currentVersion={currentVersionNum}
                        onUpdatePins={handleUpdatePins}
                        onPinSelect={setHighlightedPinId}
                        onStatusChange={handleStatusChange}
                        onUpdateVersions={handleUpdateVersions}
                        onDeleteDraft={handleDeleteDraft}
                        hasNewDraft={!!newDrafts[activeCompId]}
                        onUpload={handleUpload}
                    />
                </div>
            </CardContent>

            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Design Component</DialogTitle>
                        <DialogDescription>Create a new design area for this product.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Component Name</Label>
                            <Input 
                                id="name" 
                                placeholder="e.g. Back Design" 
                                value={compNameInput}
                                onChange={(e) => setCompNameInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComponent()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddComponent} disabled={!compNameInput.trim()}>Create Component</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Component</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="rename">New Name</Label>
                            <Input 
                                id="rename" 
                                value={compNameInput}
                                onChange={(e) => setCompNameInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleRenameComponent()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsRenameModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleRenameComponent} disabled={!compNameInput.trim()}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
