'use client';

import * as React from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import type { ConfiguredProduct, DesignData, DesignPin, DesignWorkflowStatus, DesignVersion, CustomerData, DesignComponent } from '@/lib/types';
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
    LayoutPanelTop,
    Plus,
    Check,
    Lock,
    Trash2,
    Info,
    ChevronDown,
    ChevronUp,
    Clock,
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    MoreVertical,
    Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { productCatalog } from '@/lib/product-data';

interface AddComponentWidgetProps {
    mode: 'card' | 'workbench';
    onAdd: (name: string) => void;
}

function AddComponentWidget({ mode, onAdd }: AddComponentWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = () => {
        if (!name.trim()) return;
        onAdd(name.trim());
        setName('');
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === 'Enter') handleSubmit();
        if (e.key === 'Escape') setIsOpen(false);
    };

    useEffect(() => {
        if (mode === 'workbench' && isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [mode, isOpen]);

    if (mode === 'workbench') {
        if (!isOpen) {
            return (
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 w-7 rounded-full p-0 border-dashed border-primary/40 text-primary hover:bg-primary/5 shrink-0 ml-2"
                    onClick={() => setIsOpen(true)}
                >
                    <Plus className="h-3.5 w-3.5" />
                </Button>
            );
        }

        return (
            <div className="flex items-center gap-1.5 ml-2 animate-in slide-in-from-left-2 duration-200">
                <Input 
                    ref={inputRef}
                    placeholder="Component name..." 
                    className="h-7 w-32 text-[10px] font-bold border-primary/40 bg-background px-2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => { if (!name.trim()) setIsOpen(false); }}
                />
                <Button size="icon" className="h-7 w-7 shrink-0" onClick={handleSubmit}>
                    <Check className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground" onClick={() => setIsOpen(false)}>
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>
        );
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button 
                    className="p-3 rounded-lg border-2 border-dashed border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1 group w-full h-full"
                >
                    <Plus className="h-4 w-4 text-primary/40 group-hover:text-primary transition-colors" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Add Component</span>
                </button>
            </PopoverTrigger>
            <PopoverContent 
                className="w-64 p-4 shadow-2xl border-2 border-primary/20 z-[100]" 
                align="center" 
                sideOffset={10}
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center">
                            <Plus className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">New Design Component</h4>
                    </div>
                    <Input 
                        autoFocus
                        placeholder="e.g. Back Side, Inner Page..." 
                        className="h-9 text-xs font-bold border-primary/20 focus-visible:ring-primary/20 bg-muted/5"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <Button size="sm" className="w-full h-9 text-[10px] font-black uppercase tracking-widest shadow-md" onClick={handleSubmit}>Create Component</Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

interface DesignProductCardProps {
    product: ConfiguredProduct;
    isDesigner: boolean;
    onUpdateDesign: (data: DesignData) => void;
    customerData?: CustomerData;
    forceOpenWorkbench?: boolean;
    onCloseWorkbench?: () => void;
    modalOnly?: boolean;
}

export function DesignProductCard({ 
    product, 
    isDesigner, 
    onUpdateDesign, 
    customerData, 
    forceOpenWorkbench,
    onCloseWorkbench,
    modalOnly = false
}: DesignProductCardProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [newDrafts, setNewDrafts] = useState<Record<string, boolean>>({});
    const [draftText, setDraftText] = useState('');
    const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);
    const [isZenMode, setIsZenMode] = useState(false);
    const [showPopovers, setShowPopovers] = useState(true);
    const [isLightTable, setIsLightTable] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [selectedComparisonRefId, setSelectedComparisonRefId] = useState<string | null>(null);

    // Component Lifecycle Options
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [compToRename, setCompToRename] = useState<{ id: string; name: string } | null>(null);
    const [newNameValue, setNewNameValue] = useState('');

    // Overflow Tab indicators
    const tabScrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    useEffect(() => {
        if (forceOpenWorkbench) setIsFullscreen(true);
    }, [forceOpenWorkbench]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
            
            if (isFullscreen && !isTyping && e.key.toLowerCase() === 'f') {
                setIsZenMode(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

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
        if (timeSinceLastUpdate < 2000) return;
        const hasUnsavedDraft = localDesignData.components.some(c => c.status === 'DRAFT');
        if (hasUnsavedDraft && isFullscreen) return;
        setLocalDesignData(initialDesignData); 
    }, [initialDesignData, isFullscreen, localDesignData.components]);

    const [activeCompId, setActiveCompId] = useState(localDesignData.components[0]?.id);
    const [highlightedPinId, setHighlightedPinId] = useState<string | null>(null);
    const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

    useEffect(() => {
        const currentStillExists = localDesignData.components.some(c => c.id === activeCompId);
        if (!currentStillExists && localDesignData.components.length > 0) setActiveCompId(localDesignData.components[0].id);
    }, [localDesignData.components, activeCompId]);

    const checkTabOverflow = () => {
        if (tabScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tabScrollRef.current;
            setCanScrollLeft(scrollLeft > 2);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
        }
    };

    useEffect(() => {
        if (isFullscreen) {
            const timer = setTimeout(checkTabOverflow, 300);
            window.addEventListener('resize', checkTabOverflow);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('resize', checkTabOverflow);
            };
        }
    }, [isFullscreen, localDesignData.components]);

    const scrollTabs = (direction: 'left' | 'right') => {
        if (tabScrollRef.current) {
            const amount = 200;
            tabScrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
        }
    };

    const activeComponent = localDesignData.components.find(c => c.id === activeCompId) || localDesignData.components[0];
    
    const isEligibleForStock = useMemo(() => {
        if (localDesignData.isStock) return false;
        return localDesignData.components.every(c => c.status === 'PENDING' && (!c.versions || c.versions.length === 0));
    }, [localDesignData]);

    const currentVersionNum = (activeComponent.versions && activeComponent.versions.length > 0)
        ? activeComponent.versions[activeComponent.versions.length - 1].versionNumber : 0;
    
    const visibleVersions = useMemo(() => {
        return activeComponent.versions || [];
    }, [activeComponent.versions]);

    const activeVersion = useMemo(() => {
        if (!visibleVersions || visibleVersions.length === 0) return null;
        if (selectedVersionId) return visibleVersions.find(v => v.id === selectedVersionId) || visibleVersions[visibleVersions.length - 1];
        return visibleVersions[visibleVersions.length - 1];
    }, [visibleVersions, selectedVersionId]);

    const viewedVersionNum = activeVersion?.versionNumber || 0;

    const isLatestDraftLocked = !isDesigner && activeComponent.status === 'DRAFT' && viewedVersionNum === currentVersionNum && viewedVersionNum > 0;

    const comparisonImageUrl = useMemo(() => {
        if (!activeComponent.versions || activeComponent.versions.length < 2) return null;
        const refVersion = selectedComparisonRefId 
            ? activeComponent.versions.find(v => v.id === selectedComparisonRefId)
            : activeComponent.versions.find(v => v.versionNumber === viewedVersionNum - 1);
        
        return refVersion?.imageUrl || null;
    }, [activeComponent.versions, viewedVersionNum, selectedComparisonRefId]);

    const handleUpdateDesignInternal = (updatedData: DesignData, forcePersist: boolean = false) => {
        lastLocalUpdateRef.current = Date.now();
        setLocalDesignData(updatedData);
        
        const activeComp = updatedData.components.find(c => c.id === activeCompId) || updatedData.components[0];
        const isDraft = activeComp?.status === 'DRAFT';

        if (forcePersist || !isDraft) {
            onUpdateDesign(updatedData);
        }
    };

    const handleStatusChange = (status: DesignWorkflowStatus) => {
        if (status === 'INTERNAL_REVIEW' || status === 'PENDING') {
            setNewDrafts(prev => ({ ...prev, [activeCompId]: false }));
        }
        const updatedComponents = localDesignData.components.map(c => c.id === activeCompId ? { ...c, status } : c);
        const updatedData = { ...localDesignData, components: updatedComponents };
        handleUpdateDesignInternal(updatedData, true);
    };

    const handleAddComponent = (name: string) => {
        const newComp: DesignComponent = {
            id: `comp-${Date.now()}`,
            name: name,
            status: 'PENDING',
            versions: [],
            pins: []
        };
        
        const updatedData = {
            ...localDesignData,
            components: [...localDesignData.components, newComp]
        };
        
        handleUpdateDesignInternal(updatedData, true);
        setActiveCompId(newComp.id);
    };

    const handleDeleteComponent = (compId: string) => {
        if (localDesignData.components.length <= 1) {
            alert("A product must have at least one component.");
            return;
        }

        if (!confirm("Are you sure you want to delete this component? This will remove all associated versions and feedback.")) return;
        const updatedComponents = localDesignData.components.filter(c => c.id !== compId);
        const updatedData = { ...localDesignData, components: updatedComponents };
        handleUpdateDesignInternal(updatedData, true);
    };

    const handleRenameComponent = (compId: string, newName: string) => {
        if (!newName.trim()) return;
        const updatedComponents = localDesignData.components.map(c => 
            c.id === compId ? { ...c, name: newName.trim() } : c
        );
        handleUpdateDesignInternal({ ...localDesignData, components: updatedComponents }, true);
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
            handleUpdateDesignInternal(nextData, false);
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteDraft = () => {
        if (activeComponent.versions.length > 0) {
            const newVersions = [...activeComponent.versions];
            newVersions.pop();
            const updatedComponents = localDesignData.components.map(c => 
                c.id === activeCompId ? { ...c, versions: newVersions, status: newVersions.length === 0 ? 'DRAFT' : c.status } : c
            );
            const nextData = { ...localDesignData, components: updatedComponents };
            setNewDrafts(prev => ({ ...prev, [activeCompId]: false }));
            setSelectedVersionId(null);
            handleUpdateDesignInternal(nextData, false);
        }
    };

    const handlePinSelect = (id: string | null, openPopover: boolean = false) => {
        if (highlightedPinId && id !== highlightedPinId) {
            const pinToClose = activeComponent.pins.find(p => p.id === highlightedPinId);
            if (pinToClose?.isDraft && !draftText.trim()) {
                const updatedComponents = localDesignData.components.map(c => {
                    if (c.id === activeCompId) {
                        return { ...c, pins: c.pins.filter(p => p.id !== highlightedPinId) };
                    }
                    return c;
                });
                handleUpdateDesignInternal({ ...localDesignData, components: updatedComponents }, true);
            }
        }

        setHighlightedPinId(id);
        setSelectedPinId(openPopover ? id : null);
        
        if (id) {
            const allPins = isLightTable ? localDesignData.components.flatMap(c => c.pins) : activeComponent.pins;
            const pin = allPins.find(p => p.id === id);
            setDraftText(pin?.text || '');
        } else {
            setDraftText('');
        }
    };

    const handleAddPin = (x: number, y: number, componentId?: string) => {
        const newPinId = `pin-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const targetVNum = isLightTable && componentId 
            ? (localDesignData.components.find(c => c.id === componentId)?.versions.length || 0)
            : viewedVersionNum;

        const newPin: DesignPin = { 
            id: newPinId, 
            x, 
            y, 
            status: 'open',
            isMistake: false,
            author: isDesigner ? 'Designer' : 'Manager', 
            timestamp: new Date().toISOString(), 
            version: targetVNum, 
            text: '', 
            replies: [],
            isDraft: true
        };
        
        const targetCompId = componentId || activeCompId;
        const updatedComponents = localDesignData.components.map(c => {
            if (c.id === targetCompId) {
                return { ...c, pins: [...(c.pins || []), newPin] };
            }
            return c;
        });

        setDraftText('');
        handleUpdateDesignInternal({ ...localDesignData, components: updatedComponents });
        
        setTimeout(() => {
            handlePinSelect(newPinId, true);
        }, 50);
    };

    const handleUpdatePins = (newPins: DesignPin[]) => {
        // If Light Table, update pins for individual components correctly
        if (isLightTable) {
            const updatedComponents = localDesignData.components.map(c => {
                const componentPins = newPins.filter(p => c.pins.some(cp => cp.id === p.id));
                return { ...c, pins: componentPins };
            });
            handleUpdateDesignInternal({ ...localDesignData, components: updatedComponents });
        } else {
            const updatedComponents = localDesignData.components.map(c => 
                c.id === activeCompId ? { ...c, pins: newPins } : c
            );
            handleUpdateDesignInternal({ ...localDesignData, components: updatedComponents });
        }
    };

    const feedbackSidebarProps = {
        pins: isLightTable ? localDesignData.components.flatMap(c => c.pins) : activeComponent.pins || [],
        versions: visibleVersions,
        highlightedPinId: highlightedPinId,
        selectedVersionId: activeVersion?.id || null,
        status: activeComponent.status || 'PENDING',
        isDesigner: isDesigner,
        currentVersion: currentVersionNum,
        viewedVersion: viewedVersionNum,
        onUpdatePins: (newPins: DesignPin[]) => {
            if (isLightTable) {
                const updatedComponents = localDesignData.components.map(c => {
                    const cPins = newPins.filter(p => c.pins.some(cp => cp.id === p.id));
                    return { ...c, pins: cPins };
                });
                handleUpdateDesignInternal({ ...localDesignData, components: updatedComponents });
            } else {
                handleUpdatePins(newPins);
            }
        },
        onPinSelect: (id: string | null) => handlePinSelect(id, false),
        onVersionSelect: setSelectedVersionId,
        onStatusChange: handleStatusChange,
        onUpdateVersions: (v: any) => {},
        onDeleteDraft: handleDeleteDraft,
        hasNewDraft: !!newDrafts[activeCompId],
        onUpload: handleUpload,
        customerData,
        activeProductId: product.id.toString(),
        onClose: () => setIsFullscreen(false),
        isLightTable: isLightTable,
        isComparing: showComparison,
        onSetComparisonReference: setSelectedComparisonRefId,
        comparisonRefId: selectedComparisonRefId
    };

    return (
        <>
            {!modalOnly && (
                <Card className="overflow-hidden border-2 border-primary/10 shadow-lg bg-card/50 backdrop-blur-sm">
                    <CardHeader className="bg-muted/30 border-b py-3 px-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary"><Package className="h-5 w-5" /></div>
                                <div className="flex flex-col">
                                    <CardTitle className="text-sm font-headline font-black">{product.productName}</CardTitle>
                                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{localDesignData.components.length} Components</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isEligibleForStock && (
                                    <Button variant="outline" size="sm" onClick={() => {
                                        if(confirm("Mark this product as stock? This will hide all design tools.")) {
                                            handleUpdateDesignInternal({ ...localDesignData, isStock: true }, true);
                                        }
                                    }} className="h-8 font-black uppercase text-[10px] tracking-widest"><PackageCheck className="h-3.5 w-3.5 mr-1.5" /> Stock</Button>
                                )}
                                <Button size="sm" onClick={() => setIsFullscreen(true)} className="h-8 font-black uppercase text-[10px] tracking-widest gap-1.5 shadow-sm"><LayoutPanelTop className="h-3.5 w-3.5" /> Workbench</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="px-4 py-2 border-b bg-muted/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
                            <Info className="h-3 w-3 text-muted-foreground shrink-0" />
                            <div className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap flex items-center">
                                No specs configured
                            </div>
                        </div>
                        {localDesignData.isStock ? (
                            <div className="flex flex-col items-center justify-center h-[200px] bg-muted/5">
                                <PackageCheck className="h-10 w-10 text-primary/40 mb-3" />
                                <h3 className="font-headline font-black uppercase tracking-widest text-xs text-muted-foreground">Stock Item</h3>
                                <Button variant="link" size="sm" onClick={() => handleUpdateDesignInternal({ ...localDesignData, isStock: false }, true)} className="text-[10px] uppercase font-black tracking-widest text-primary">Restore Design Tools</Button>
                            </div>
                        ) : (
                            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                {localDesignData.components.map(comp => (
                                    <div key={comp.id} className={cn("p-3 rounded-lg border-2 text-center space-y-1 transition-all shadow-sm relative group/comp", "border-primary/10 bg-muted/5")}>
                                        <div className="text-[10px] font-black uppercase tracking-wider truncate">{comp.name}</div>
                                        <div className="flex items-center justify-center gap-2 text-[9px] font-bold opacity-60">
                                            <span>V{(comp.versions || []).length}</span>
                                            <span>•</span>
                                            <span className="uppercase tracking-tighter">{comp.status.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                ))}
                                <AddComponentWidget mode="card" onAdd={handleAddComponent} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Dialog open={isFullscreen} onOpenChange={(open) => {
                if (!open) {
                    handlePinSelect(null);
                    setLocalDesignData(initialDesignData);
                    setIsZenMode(false);
                    setIsLightTable(false);
                    setShowComparison(false);
                    onCloseWorkbench?.();
                }
                setIsFullscreen(open);
            }}>
                <DialogContent 
                    className="max-w-[100vw] w-screen h-screen p-0 gap-0 border-none rounded-none flex flex-col bg-background overflow-hidden animate-in zoom-in-95 duration-300"
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogHeader className="sr-only">
                        <DialogTitle>Design Workbench - {product.productName}</DialogTitle>
                        <DialogDescription>Review design proofs and feedback for {product.productName}.</DialogDescription>
                    </DialogHeader>
                    <div className={cn("flex-1 flex overflow-hidden border-[6px] transition-all duration-500", 
                        activeComponent.status === 'APPROVED' ? "border-green-500/30" : 
                        activeComponent.status === 'DRAFT' ? "border-orange-500/30" : "border-blue-500/30",
                        isZenMode && "border-0"
                    )}>
                        <div className="flex-1 relative flex flex-col min-w-0 bg-stone-950">
                            {isZenMode && (
                                <div className="absolute top-4 right-4 z-[200]">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-10 w-10 rounded-full bg-background/50 backdrop-blur-xl border border-primary/20 shadow-2xl hover:bg-background"
                                        onClick={() => setIsFullscreen(false)}
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            )}

                            {!isZenMode && (
                                <div className="h-14 shrink-0 flex items-center justify-between px-6 bg-background/80 backdrop-blur-xl border-b z-50">
                                    <div className="flex-1 flex items-center gap-4 overflow-hidden">
                                        <div className="flex items-center gap-2 shrink-0">
                                            <h2 className="font-headline font-black text-sm truncate">{product.productName}</h2>
                                        </div>
                                        
                                        {!isLightTable && (
                                            <>
                                                <div className="h-4 w-px bg-border shrink-0" />
                                                <div className="relative flex-1 flex items-center overflow-hidden min-w-0 group/tabs">
                                                    {canScrollLeft && (
                                                        <>
                                                            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="absolute left-0 z-20 h-7 w-7 bg-background/80 backdrop-blur rounded-full shadow-md hover:bg-background"
                                                                onClick={() => scrollTabs('left')}
                                                            >
                                                                <ChevronLeft className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    
                                                    <div 
                                                        onScroll={checkTabOverflow}
                                                        ref={tabScrollRef}
                                                        className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar py-1 pr-4"
                                                    >
                                                        <Tabs value={activeCompId} onValueChange={(val) => {
                                                            handlePinSelect(null);
                                                            setActiveCompId(val);
                                                        }} className="shrink-0">
                                                            <TabsList className="bg-transparent h-10 p-0 gap-4">
                                                                {localDesignData.components.map(comp => (
                                                                    <TabsTrigger key={comp.id} value={comp.id} className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent font-black uppercase text-[10px] tracking-widest px-0">
                                                                        {comp.name} <span className="ml-1 opacity-40 font-mono">V{(comp.versions || []).length}</span>
                                                                    </TabsTrigger>
                                                                ))}
                                                            </TabsList>
                                                        </Tabs>
                                                        <AddComponentWidget mode="workbench" onAdd={handleAddComponent} />
                                                    </div>

                                                    {canScrollRight && (
                                                        <>
                                                            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="absolute right-0 z-20 h-7 w-7 bg-background/80 backdrop-blur rounded-full shadow-md hover:bg-background"
                                                                onClick={() => scrollTabs('right')}
                                                            >
                                                                <ChevronRight className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 ml-4 shrink-0">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md hover:bg-primary/10 hover:text-primary lg:hidden" onClick={() => setIsFullscreen(false)}>
                                            <X className="h-5 w-5" />
                                        </Button>
                                        {!isLightTable && activeComponent && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md hover:bg-primary/10 hover:text-primary">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => {
                                                        setCompToRename({ id: activeComponent.id, name: activeComponent.name });
                                                        setNewNameValue(activeComponent.name);
                                                        setIsRenameDialogOpen(true);
                                                    }}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        <span>Rename Component</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => handleDeleteComponent(activeComponent.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Delete Component</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 relative overflow-hidden">
                                <DesignCanvas 
                                    imageUrl={isLatestDraftLocked ? null : (activeVersion?.imageUrl || null)}
                                    comparisonImageUrl={comparisonImageUrl}
                                    pins={isLightTable ? localDesignData.components.flatMap(c => c.pins) : (activeComponent.pins || [])}
                                    highlightedPinId={highlightedPinId}
                                    selectedPinId={selectedPinId}
                                    isDesigner={isDesigner}
                                    version={viewedVersionNum}
                                    currentVersion={currentVersionNum}
                                    status={activeComponent.status}
                                    hasNewDraft={!!newDrafts[activeCompId]}
                                    onAddPin={handleAddPin}
                                    onPinClick={(id) => handlePinSelect(id, true)}
                                    onUpdatePins={handleUpdatePins}
                                    onUpload={handleUpload}
                                    isWorkbench={true}
                                    isLatestDraftLocked={isLatestDraftLocked}
                                    draftText={draftText}
                                    onDraftTextChange={setDraftText}
                                    isZenMode={isZenMode}
                                    onToggleZen={() => setIsZenMode(!isZenMode)}
                                    showPopovers={showPopovers}
                                    onTogglePopovers={() => setShowPopovers(!showPopovers)}
                                    isLightTable={isLightTable}
                                    onToggleLightTable={() => setIsLightTable(!isLightTable)}
                                    allComponents={localDesignData.components}
                                    showComparison={showComparison}
                                    onToggleComparison={setShowComparison}
                                />
                            </div>

                            {visibleVersions.length > 0 && !isLightTable && (
                                <div className={cn(
                                    "shrink-0 bg-background/80 backdrop-blur-xl border-t z-50 flex flex-col transition-all duration-300 ease-in-out",
                                    isTimelineCollapsed ? "h-9" : "h-32"
                                )}>
                                    <div className="flex items-center justify-between px-6 h-9 border-b border-primary/5 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Version History</span>
                                            <Badge variant="outline" className="h-4 px-1.5 text-[8px] font-mono border-primary/10">{visibleVersions.length}</Badge>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 px-2 text-[9px] font-black uppercase tracking-widest gap-1 hover:bg-primary/5"
                                            onClick={() => setIsTimelineCollapsed(!isTimelineCollapsed)}
                                        >
                                            {isTimelineCollapsed ? "Show Timeline" : "Hide"}
                                            {isTimelineCollapsed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                        </Button>
                                    </div>
                                    
                                    {!isTimelineCollapsed && (
                                        <div className="flex-1 flex items-center px-6 overflow-x-auto no-scrollbar gap-4 py-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            {visibleVersions.map((v) => {
                                                const isThisVersionLocked = !isDesigner && activeComponent.status === 'DRAFT' && v.versionNumber === currentVersionNum;
                                                return (
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
                                                        {isThisVersionLocked ? (
                                                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                                                <Lock className="h-5 w-5 text-muted-foreground/40" />
                                                            </div>
                                                        ) : (
                                                            <img src={v.imageUrl} className="w-full h-full object-cover" alt={`Version ${v.versionNumber}`} />
                                                        )}
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/opacity-100 transition-opacity">
                                                            <span className="text-[10px] font-black text-white font-mono">V{v.versionNumber}</span>
                                                        </div>
                                                        {(selectedVersionId === v.id || (!selectedVersionId && v.versionNumber === viewedVersionNum)) && (
                                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {!isZenMode && (
                            <div className="w-[360px] md:w-[400px] flex flex-col shrink-0 bg-background shadow-2xl z-[100]">
                                <FeedbackSidebar {...feedbackSidebarProps} />
                            </div>
                        )}
                    </div>

                    <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                        <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                                <DialogTitle className="font-headline font-black uppercase tracking-widest text-sm">Rename Component</DialogTitle>
                                <DialogDescription className="text-xs font-bold text-muted-foreground">
                                    Enter a new display name for "{compToRename?.name}".
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Input
                                    autoFocus
                                    placeholder="Component name..."
                                    value={newNameValue}
                                    onChange={(e) => setNewNameValue(e.target.value)}
                                    className="h-10 font-bold"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleRenameComponent(compToRename?.id || '', newNameValue);
                                            setIsRenameDialogOpen(false);
                                        }
                                    }}
                                />
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button variant="ghost" size="sm" className="font-black uppercase text-[10px] tracking-widest" onClick={() => setIsRenameDialogOpen(false)}>Cancel</Button>
                                <Button size="sm" className="font-black uppercase text-[10px] tracking-widest" onClick={() => {
                                    handleRenameComponent(compToRename?.id || '', newNameValue);
                                    setIsRenameDialogOpen(false);
                                }}>Update Name</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
