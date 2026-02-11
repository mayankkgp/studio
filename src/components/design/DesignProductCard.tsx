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
import { 
    Package, 
    Circle, 
    Plus, 
    Pencil, 
    Trash2, 
    MoreVertical, 
    Maximize2, 
    X, 
    MessageSquare,
    PackageCheck,
    RotateCcw
} from 'lucide-react';
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
    DialogDescription,
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
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSidebarOpenInFull, setIsSidebarOpenInFull] = useState(false);
    const [compNameInput, setCompNameInput] = useState('');
    const [editingCompId, setEditingCompId] = useState<string | null>(null);
    
    // Optimistic local state to handle race conditions during upload
    const [newDrafts, setNewDrafts] = useState<Record<string, boolean>>({});

    const initialDesignData = useMemo(() => {
        const baseData = product.designData || {
            productId: product.id,
            isStock: false,
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
            isStock: baseData.isStock || false,
            components: (baseData.components || []).map(c => ({
                ...c,
                status: c.status || 'PENDING' as DesignWorkflowStatus,
                versions: c.versions || [],
                pins: c.pins || []
            }))
        } as DesignData;
    }, [product.id, product.designData]);

    // Local design data ensures immediate UI feedback while parent updates sync in background
    const [localDesignData, setLocalDesignData] = useState<DesignData>(initialDesignData);

    useEffect(() => {
        setLocalDesignData(initialDesignData);
    }, [initialDesignData]);

    const [activeCompId, setActiveCompId] = useState(localDesignData.components[0]?.id);
    const [highlightedPinId, setHighlightedPinId] = useState<string | null>(null);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

    useEffect(() => {
        const currentStillExists = localDesignData.components.some(c => c.id === activeCompId);
        if (!currentStillExists && localDesignData.components.length > 0) {
            setActiveCompId(localDesignData.components[0].id);
        }
    }, [localDesignData.components, activeCompId]);

    useEffect(() => {
        setSelectedVersionId(null);
    }, [activeCompId]);

    const activeComponent = localDesignData.components.find(c => c.id === activeCompId) || localDesignData.components[0];
    
    // Eligibility logic for "Mark as Stock"
    const isEligibleForStock = useMemo(() => {
        if (localDesignData.isStock) return false;
        return localDesignData.components.every(c => 
            c.status === 'PENDING' && (!c.versions || c.versions.length === 0)
        );
    }, [localDesignData]);

    const handleMarkAsStock = () => {
        if (window.confirm("Are you sure? Marking as stock will hide design tools for this item as it requires no custom creative work.")) {
            const updated = { ...localDesignData, isStock: true };
            handleUpdateDesignInternal(updated);
        }
    };

    const handleRestoreToDesign = () => {
        if (window.confirm("Restore standard design workflow for this product?")) {
            const updated = { ...localDesignData, isStock: false };
            handleUpdateDesignInternal(updated);
        }
    };

    if (!activeComponent) return null;

    const currentVersionNum = (activeComponent.versions && activeComponent.versions.length > 0)
        ? activeComponent.versions[activeComponent.versions.length - 1].versionNumber 
        : 0;
    
    const visibleVersions = useMemo(() => {
        if (isDesigner) return activeComponent.versions;
        // Manager restriction: Do not show newly uploaded unsubmitted drafts
        if (activeComponent.status === 'DRAFT' && newDrafts[activeCompId] && activeComponent.versions.length > 0) {
            return activeComponent.versions.slice(0, -1);
        }
        return activeComponent.versions;
    }, [activeComponent.versions, activeComponent.status, isDesigner, newDrafts, activeCompId]);

    const activeVersion = useMemo(() => {
        if (!visibleVersions || visibleVersions.length === 0) return null;
        if (selectedVersionId) {
            return visibleVersions.find(v => v.id === selectedVersionId) || visibleVersions[visibleVersions.length - 1];
        }
        return visibleVersions[visibleVersions.length - 1];
    }, [visibleVersions, selectedVersionId]);

    const viewedVersionNum = activeVersion?.versionNumber || 0;

    const handleUpdateDesignInternal = (updatedData: DesignData) => {
        setLocalDesignData(updatedData);
        onUpdateDesign(updatedData);
    };

    const handleAddComponent = () => {
        if (!compNameInput.trim()) return;
        const newComp: DesignComponent = {
            id: `comp-${Date.now()}`,
            name: compNameInput.trim(),
            status: 'PENDING',
            versions: [],
            pins: []
        };
        const updated = { ...localDesignData, components: [...localDesignData.components, newComp] };
        handleUpdateDesignInternal(updated);
        setActiveCompId(newComp.id);
        setIsAddModalOpen(false);
        setCompNameInput('');
    };

    const handleRenameComponent = () => {
        if (!compNameInput.trim() || !editingCompId) return;
        const updatedComponents = localDesignData.components.map(c => 
            c.id === editingCompId ? { ...c, name: compNameInput.trim() } : c
        );
        handleUpdateDesignInternal({ ...localDesignData, components: updatedComponents });
        setIsRenameModalOpen(false);
        setCompNameInput('');
        setEditingCompId(null);
    };

    const handleDeleteComponent = (compId: string) => {
        if (localDesignData.components.length <= 1) return;
        const updatedComponents = localDesignData.components.filter(c => c.id !== compId);
        handleUpdateDesignInternal({ ...localDesignData, components: updatedComponents });
    };

    const handleUpdatePins = (newPins: DesignPin[]) => {
        const updatedComponents = localDesignData.components.map(c => 
            c.id === activeCompId ? { ...c, pins: newPins } : c
        );
        handleUpdateDesignInternal({ ...localDesignData, components: updatedComponents });
    };

    const handleStatusChange = (status: DesignWorkflowStatus) => {
        if (status === 'INTERNAL_REVIEW' || status === 'PENDING') {
            setNewDrafts(prev => ({ ...prev, [activeCompId]: false }));
        }
        
        const updatedComponents = localDesignData.components.map(c => 
            c.id === activeCompId ? { ...c, status } : c
        );
        handleUpdateDesignInternal({ ...localDesignData, components: updatedComponents });
    };

    const handleUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            
            setLocalDesignData(prev => {
                const activeComp = prev.components.find(c => c.id === activeCompId);
                const currentVNum = (activeComp?.versions && activeComp.versions.length > 0)
                    ? activeComp.versions[activeComp.versions.length - 1].versionNumber 
                    : 0;
                
                const newVersionNum = currentVNum + 1;
                const newVersion: DesignVersion = {
                    id: `v-${Date.now()}`,
                    versionNumber: newVersionNum,
                    imageUrl: result,
                    timestamp: new Date().toISOString(),
                    author: isDesigner ? 'Designer' : 'Manager'
                };

                const updatedComponents = prev.components.map(c => 
                    c.id === activeCompId ? { 
                        ...c, 
                        versions: [...(c.versions || []), newVersion],
                        status: 'DRAFT' as DesignWorkflowStatus
                    } : c
                );
                
                const nextData = { ...prev, components: updatedComponents };
                
                // Sidebar sub-state update
                setNewDrafts(d => ({ ...d, [activeCompId]: true }));
                setSelectedVersionId(newVersion.id);
                
                // Notify parent
                onUpdateDesign(nextData);
                
                return nextData;
            });
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateVersions = (newVersions: DesignVersion[]) => {
        const updatedComponents = localDesignData.components.map(c => {
            if (c.id === activeCompId) {
                const nextStatus: DesignWorkflowStatus = newVersions.length === 0 ? 'PENDING' : c.status;
                return { ...c, versions: newVersions, status: nextStatus };
            }
            return c;
        });
        handleUpdateDesignInternal({ ...localDesignData, components: updatedComponents });
    };

    const handleDeleteDraft = () => {
        if (activeComponent.versions.length > 0) {
            const newVersions = [...activeComponent.versions];
            newVersions.pop();
            handleUpdateVersions(newVersions);
            setNewDrafts(prev => ({ ...prev, [activeCompId]: false }));
            setSelectedVersionId(null);
        }
    };

    const handleAddPin = (x: number, y: number) => {
        const newPin: DesignPin = {
            id: `pin-${Date.now()}`,
            x,
            y,
            status: 'open',
            author: isDesigner ? 'Designer' : 'Manager',
            timestamp: new Date().toISOString(),
            version: viewedVersionNum,
            text: '',
            replies: []
        };
        handleUpdatePins([...(activeComponent.pins || []), newPin]);
        setHighlightedPinId(newPin.id);
        
        if (isFullscreen) {
            setIsSidebarOpenInFull(true);
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
        onUpdateVersions: handleUpdateVersions,
        onDeleteDraft: handleDeleteDraft,
        hasNewDraft: !!newDrafts[activeCompId],
        onUpload: handleUpload,
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
                    
                    <div className="flex items-center gap-2">
                        {isEligibleForStock && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleMarkAsStock}
                                className="h-8 border-primary text-primary hover:bg-primary/5 font-black uppercase text-[10px] tracking-widest"
                            >
                                <PackageCheck className="h-3.5 w-3.5 mr-1.5" /> Mark as Stock
                            </Button>
                        )}
                        {localDesignData.isStock && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleRestoreToDesign}
                                className="h-8 border-primary text-primary hover:bg-primary/5 font-black uppercase text-[10px] tracking-widest"
                            >
                                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Restore to Design
                            </Button>
                        )}
                        {!localDesignData.isStock && (
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
                                        disabled={localDesignData.components.length <= 1}
                                        onClick={() => handleDeleteComponent(activeComponent.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Component
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {localDesignData.isStock ? (
                    <div className="flex flex-col items-center justify-center h-[400px] bg-muted/5 border-t border-primary/10 animate-in fade-in zoom-in-95 duration-500">
                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 border-2 border-primary/20 shadow-inner">
                            <PackageCheck className="h-10 w-10" />
                        </div>
                        <h3 className="font-headline font-black uppercase tracking-[0.2em] text-lg text-foreground">Stock Item</h3>
                        <p className="text-muted-foreground text-[11px] font-black uppercase max-w-sm text-center mt-3 tracking-widest opacity-60 leading-relaxed px-12">
                            This product has been marked as a standard catalogue item requiring no custom design review.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] h-[600px] overflow-hidden">
                        <div className="flex flex-col border-r border-primary/10 overflow-hidden bg-stone-50/50">
                            <div className="p-2 border-b bg-background/50 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2 overflow-hidden flex-1">
                                    <Tabs value={activeCompId} onValueChange={setActiveCompId} className="w-full">
                                        <TabsList className="h-11 bg-muted/20 p-1 gap-1 justify-start overflow-x-auto no-scrollbar">
                                            {(localDesignData.components || []).map(comp => {
                                                const dotColor = comp.status === 'APPROVED' ? 'text-green-500' :
                                                                comp.status === 'CUSTOMER_REVIEW' ? 'text-blue-500' :
                                                                comp.status === 'INTERNAL_REVIEW' ? 'text-amber-500' : 
                                                                comp.status === 'PENDING' ? 'text-muted-foreground/30' : 'text-primary/50';
                                                
                                                const vNum = (comp.versions && comp.versions.length > 0)
                                                    ? comp.versions[comp.versions.length - 1].versionNumber 
                                                    : 0;

                                                return (
                                                    <TabsTrigger 
                                                        key={comp.id} 
                                                        value={comp.id} 
                                                        className="text-[9px] font-black uppercase px-3 h-9 gap-2.5 flex items-center shrink-0 transition-all"
                                                    >
                                                        <Circle className={cn("h-1.5 w-1.5 fill-current", dotColor)} />
                                                        <div className="flex flex-col items-start gap-0.5">
                                                            <span className="truncate max-w-[90px] leading-tight text-foreground">{comp.name}</span>
                                                            <div className="flex items-center gap-1.5 text-[7px] font-bold opacity-50 lowercase tracking-widest">
                                                                <span className="font-mono">v{vNum}</span>
                                                                <span>•</span>
                                                                <span className="whitespace-nowrap">{comp.status.replace('_', ' ')}</span>
                                                            </div>
                                                        </div>
                                                    </TabsTrigger>
                                                );
                                            })}
                                        </TabsList>
                                    </Tabs>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-primary hover:bg-primary/10 shrink-0"
                                        onClick={() => { setCompNameInput(''); setIsAddModalOpen(true); }}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
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
                                    status={activeComponent.status || 'PENDING'}
                                    hasNewDraft={!!newDrafts[activeCompId]}
                                    onAddPin={handleAddPin}
                                    onPinClick={setHighlightedPinId}
                                    onUpdatePins={handleUpdatePins}
                                    onUpload={handleUpload}
                                    onToggleFullscreen={() => setIsFullscreen(true)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col overflow-hidden h-full">
                            <FeedbackSidebar {...feedbackSidebarProps} />
                        </div>
                    </div>
                )}
            </CardContent>

            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
                <DialogContent className="max-w-[100vw] w-screen h-screen p-0 gap-0 border-none rounded-none flex flex-col bg-stone-100 overflow-hidden">
                    <div className="flex-1 flex overflow-hidden relative">
                        <div className="flex-1 relative overflow-hidden flex flex-col">
                            <div className="absolute top-4 left-6 z-[50] pointer-events-none">
                                <h2 className="font-headline font-black text-lg leading-tight text-foreground drop-shadow-sm">{product.productName}</h2>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] bg-background/50 backdrop-blur-sm px-2 py-0.5 rounded w-fit mt-1">
                                    {activeComponent.name} — V{currentVersionNum} — {activeComponent.status.replace('_', ' ')}
                                </p>
                            </div>

                            <div className="absolute top-4 right-6 z-[50] flex items-center gap-3">
                                <Button 
                                    variant={isSidebarOpenInFull ? "default" : "secondary"} 
                                    size="sm" 
                                    className={cn(
                                        "gap-2 h-10 font-bold shadow-2xl border border-primary/20 px-4 transition-all",
                                        !isSidebarOpenInFull && "bg-background/90 backdrop-blur-md"
                                    )}
                                    onClick={() => setIsSidebarOpenInFull(!isSidebarOpenInFull)}
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    <span className="hidden sm:inline">{isSidebarOpenInFull ? "Hide Feedback" : "Show Feedback"}</span>
                                    {!isSidebarOpenInFull && activeComponent.pins.filter(p => p.status !== 'resolved' && p.version <= viewedVersionNum).length > 0 && (
                                        <Badge className="h-5 min-w-5 px-1 flex items-center justify-center bg-primary text-white ml-1">
                                            {activeComponent.pins.filter(p => p.status !== 'resolved' && p.version <= viewedVersionNum).length}
                                        </Badge>
                                    )}
                                </Button>
                                
                                <Button 
                                    variant="secondary" 
                                    size="icon" 
                                    className="h-10 w-10 rounded-full bg-background/90 backdrop-blur-md shadow-2xl border border-primary/20"
                                    onClick={() => setIsFullscreen(false)}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            <div className="flex-1 relative overflow-hidden">
                                <DesignCanvas 
                                    imageUrl={activeVersion?.imageUrl || null}
                                    pins={activeComponent.pins || []}
                                    highlightedPinId={highlightedPinId}
                                    isDesigner={isDesigner}
                                    version={viewedVersionNum}
                                    currentVersion={currentVersionNum}
                                    status={activeComponent.status || 'PENDING'}
                                    hasNewDraft={!!newDrafts[activeCompId]}
                                    onAddPin={handleAddPin}
                                    onPinClick={setHighlightedPinId}
                                    onUpdatePins={handleUpdatePins}
                                    onUpload={handleUpload}
                                />
                            </div>
                        </div>

                        {isSidebarOpenInFull && (
                            <div className="w-[360px] md:w-[400px] border-l border-primary/10 bg-background flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl z-[100] overflow-hidden">
                                <div className="p-4 border-b bg-muted/20 flex items-center justify-between shrink-0">
                                    <h3 className="font-headline font-black text-[10px] uppercase tracking-[0.2em] text-primary">Feedback & History</h3>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setIsSidebarOpenInFull(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <FeedbackSidebar {...feedbackSidebarProps} />
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

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
