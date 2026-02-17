'use client';

import * as React from 'react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { DesignPin, DesignPinStatus, DesignWorkflowStatus, DesignReply, DesignComponent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { 
    ZoomIn, 
    ZoomOut, 
    X, 
    Trash2,
    Eye,
    EyeOff,
    RotateCcw,
    GripHorizontal,
    Layers,
    MousePointer2,
    MessageSquarePlus,
    MessageSquare,
    MessageSquareOff,
    Maximize,
    Minimize,
    LayoutGrid,
    Upload,
    RefreshCcw,
    Send,
    CheckCircle2,
    AlertCircle,
    CornerDownRight,
    Lock,
    Unlock,
    Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const PIN_COLORS: Record<DesignPinStatus, string> = {
    open: 'bg-blue-600',
    resolved: 'bg-green-600'
};

const ABSOLUTE_MIN_ZOOM = 0.01; 
const MAX_ZOOM = 4.0;

interface DesignCanvasProps {
    imageUrl: string | null;
    comparisonImageUrl?: string | null;
    pins: DesignPin[];
    highlightedPinId: string | null;
    selectedPinId: string | null;
    onAddPin: (x: number, y: number, componentId?: string) => void;
    onPinClick: (id: string | null) => void;
    onUpdatePins: (pins: DesignPin[]) => void;
    onUpload?: (file: File) => void;
    isDesigner: boolean;
    version: number;
    currentVersion: number;
    status: DesignWorkflowStatus;
    hasNewDraft?: boolean;
    isWorkbench?: boolean;
    isLatestDraftLocked?: boolean;
    draftText: string;
    onDraftTextChange: (text: string) => void;
    isZenMode?: boolean;
    onToggleZen?: () => void;
    showPopovers: boolean;
    onTogglePopovers: () => void;
    isLightTable?: boolean;
    onToggleLightTable?: () => void;
    allComponents?: DesignComponent[];
}

type ToolMode = 'pointer' | 'comment';

export function DesignCanvas({ 
    imageUrl, 
    comparisonImageUrl,
    pins, 
    highlightedPinId, 
    selectedPinId,
    onAddPin, 
    onPinClick, 
    onUpdatePins, 
    onUpload,
    isDesigner,
    version,
    currentVersion,
    status,
    hasNewDraft = false,
    isLatestDraftLocked = false,
    draftText,
    onDraftTextChange,
    isZenMode = false,
    onToggleZen,
    showPopovers,
    onTogglePopovers,
    isLightTable = false,
    onToggleLightTable,
    allComponents = []
}: DesignCanvasProps) {
    const [zoom, setZoom] = useState(1.0);
    const [minFitZoom, setMinFitZoom] = useState(ABSOLUTE_MIN_ZOOM);
    const [showPins, setShowPins] = useState(true);
    const [showComparison, setShowComparison] = useState(false);
    const [activeTool, setActiveTool] = useState<ToolMode>('comment');
    
    const [sliderPosition, setSliderPosition] = useState(50);
    const [sliderVerticalPosition, setSliderVerticalPosition] = useState(50);
    const [isDraggingSlider, setIsDraggingSlider] = useState(false);

    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isMiddleMouseDown, setIsMiddleMouseDown] = useState(false);
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const dragStartMousePos = useRef<{ x: number; y: number } | null>(null);
    const initialPanOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
    const [isDraggingPopover, setIsDraggingPopover] = useState(false);
    const dragStartRef = useRef<{ mouseX: number; mouseY: number; popoverX: number; popoverY: number } | null>(null);
    
    const [repositionKey, setRepositionKey] = useState(0);
    const lastSelectionId = useRef<string | null>(null);
    const lastRepositionKey = useRef<number>(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isLatest = version === currentVersion;
    
    const isFeedbackUnlocked = useMemo(() => {
        if (!isLatest || isSpacePressed || isMiddleMouseDown || isDraggingSlider) return false;
        if (!isLightTable && !imageUrl) return false;
        if (isDesigner) return status === 'DRAFT' && hasNewDraft;
        return status !== 'PENDING' && status !== 'DRAFT';
    }, [imageUrl, isLatest, isDesigner, status, hasNewDraft, isSpacePressed, isMiddleMouseDown, isDraggingSlider, isLightTable]);

    const canDropPin = isFeedbackUnlocked && activeTool === 'comment';
    
    const [replyText, setReplyText] = useState('');
    const [isReplyMode, setIsReplyMode] = useState(false);
    const [isMistakeDraft, setIsMistakeDraft] = useState(false);
    
    const activePin = useMemo(() => pins.find(p => p.id === selectedPinId), [pins, selectedPinId]);
    const activePinNumber = useMemo(() => pins.findIndex(p => p.id === selectedPinId) + 1, [pins, selectedPinId]);
    const effectiveShowPopovers = isZenMode ? true : showPopovers;

    const getConstrainedPan = useCallback((offset: { x: number; y: number }) => {
        if (!containerRef.current) return offset;
        const rect = containerRef.current.getBoundingClientRect();
        const Vw = rect.width;
        const Vh = rect.height;

        if (isLightTable) {
            const spreadEl = containerRef.current.querySelector('.flex-row');
            const spreadWidth = spreadEl ? spreadEl.getBoundingClientRect().width : 0;
            const limitX = (Vw / 2) + (spreadWidth / 2) - 100;
            const limitY = Vh / 2;
            return {
                x: Math.max(-limitX, Math.min(offset.x, limitX)),
                y: Math.max(-limitY, Math.min(offset.y, limitY))
            };
        } else {
            const limitX = Vw / 2;
            const limitY = Vh / 2;
            return {
                x: Math.max(-limitX, Math.min(offset.x, limitX)),
                y: Math.max(-limitY, Math.min(offset.y, limitY))
            };
        }
    }, [isLightTable]);

    const calculateFitZoom = useCallback(() => {
        if (!containerRef.current) return 1.0;
        const viewportRect = containerRef.current.getBoundingClientRect();
        const Vw = viewportRect.width;
        const Vh = viewportRect.height;

        const contentEl = isLightTable 
            ? containerRef.current.querySelector('.flex-row') 
            : containerRef.current.querySelector('.group\\/comp-container');

        if (!contentEl) return 1.0;

        const contentRect = contentEl.getBoundingClientRect();
        const unscaledCw = contentRect.width / zoom;
        const unscaledCh = contentRect.height / zoom;

        if (unscaledCw === 0 || unscaledCh === 0) return 1.0;

        const scaleX = Vw / unscaledCw;
        const scaleY = Vh / unscaledCh;
        return Math.min(scaleX, scaleY) * 0.95;
    }, [isLightTable, zoom]);

    const handleReset = useCallback(() => {
        const fitScale = calculateFitZoom();
        const finalZoom = Math.max(ABSOLUTE_MIN_ZOOM, Math.min(fitScale, MAX_ZOOM));
        setZoom(finalZoom);
        setMinFitZoom(finalZoom);
        setPanOffset({ x: 0, y: 0 });
    }, [calculateFitZoom]);

    useEffect(() => {
        const timer = setTimeout(handleReset, 100);
        return () => clearTimeout(timer);
    }, [imageUrl, isLightTable, handleReset]);

    useEffect(() => {
        const updateThreshold = () => {
            const fit = calculateFitZoom();
            const newMin = Math.max(ABSOLUTE_MIN_ZOOM, fit);
            setMinFitZoom(newMin);
            setZoom(prev => Math.max(prev, newMin));
        };
        window.addEventListener('resize', updateThreshold);
        return () => window.removeEventListener('resize', updateThreshold);
    }, [calculateFitZoom]);

    useEffect(() => {
        setPanOffset(prev => getConstrainedPan(prev));
    }, [zoom, isLightTable, getConstrainedPan]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (!imageUrl && !isLightTable) return;
            e.preventDefault();

            if (e.ctrlKey || e.metaKey) {
                const delta = e.deltaY;
                setZoom(prev => {
                    const factor = delta > 0 ? 0.9 : 1.1;
                    const next = prev * factor;
                    return Math.max(minFitZoom, Math.min(next, MAX_ZOOM));
                });
            } else {
                setPanOffset(prev => {
                    const next = {
                        x: prev.x - e.deltaX,
                        y: prev.y - e.deltaY
                    };
                    return getConstrainedPan(next);
                });
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [imageUrl, isLightTable, zoom, getConstrainedPan, minFitZoom]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

            if (e.code === 'Space' && !isSpacePressed) {
                if (isTyping) return;
                e.preventDefault();
                setIsSpacePressed(true);
            }

            if (e.key === 'Escape') {
                if (selectedPinId || highlightedPinId) onPinClick(null);
            }

            if (!isTyping) {
                if (e.key.toLowerCase() === 'r') handleReset();
                if (isFeedbackUnlocked) {
                    if (e.key.toLowerCase() === 'c') setActiveTool('comment');
                    if (e.key.toLowerCase() === 'v') setActiveTool('pointer');
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsSpacePressed(false);
                setIsDraggingCanvas(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isSpacePressed, selectedPinId, highlightedPinId, onPinClick, isFeedbackUnlocked, handleReset]);

    useEffect(() => {
        if (!comparisonImageUrl && !isLightTable) setShowComparison(false);
    }, [comparisonImageUrl, isLightTable]);

    useEffect(() => {
        const isFreshSelection = selectedPinId !== lastSelectionId.current || repositionKey !== lastRepositionKey.current;

        if (selectedPinId && isFreshSelection && activePin) {
            setReplyText('');
            setIsReplyMode(false);
            setIsMistakeDraft(!!activePin.isMistake);
            
            if (containerRef.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const x = containerRect.width / 2 - 160;
                const y = containerRect.height / 2 - 125;
                setPopoverPos({ x, y });
                lastSelectionId.current = selectedPinId;
                lastRepositionKey.current = repositionKey;
            }
            
            if (effectiveShowPopovers) {
                setTimeout(() => textareaRef.current?.focus(), 150);
            }
        } else if (!selectedPinId) {
            lastSelectionId.current = null;
            lastRepositionKey.current = -1;
            setPopoverPos(null);
        }
    }, [selectedPinId, activePin, repositionKey, effectiveShowPopovers]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, MAX_ZOOM));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, minFitZoom));

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (isDraggingSlider) return;
        if (isSpacePressed || e.button === 1) {
            if (e.button === 1) setIsMiddleMouseDown(true);
            setIsDraggingCanvas(true);
            dragStartMousePos.current = { x: e.clientX, y: e.clientY };
            initialPanOffset.current = panOffset;
            e.preventDefault();
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (isDraggingCanvas && dragStartMousePos.current) {
            const dx = e.clientX - dragStartMousePos.current.x;
            const dy = e.clientY - dragStartMousePos.current.y;
            const targetOffset = {
                x: initialPanOffset.current.x + dx,
                y: initialPanOffset.current.y + dy
            };
            setPanOffset(getConstrainedPan(targetOffset));
        }
    };

    const handleCanvasMouseUp = () => {
        setIsDraggingCanvas(false);
        setIsMiddleMouseDown(false);
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (isSpacePressed || isMiddleMouseDown || isDraggingSlider) return;
        const target = e.target as HTMLElement;
        if (target.closest('.pin-bubble') || target.closest('button') || target.closest('.fixed-comment-box') || target.closest('.slider-hit-zone')) return;
        if (highlightedPinId || selectedPinId) {
            onPinClick(null);
        }
    };

    const handleSaveComment = () => {
        if (!selectedPinId) return;
        const trimmed = draftText.trim();
        if (!trimmed) {
            onUpdatePins(pins.filter(p => p.id !== selectedPinId));
            onPinClick(null);
            return;
        }
        const updatedPins = pins.map(p => {
            if (p.id === selectedPinId) {
                return { ...p, text: trimmed, status: 'open', isMistake: isMistakeDraft, isDraft: false } as DesignPin;
            }
            return p;
        });
        onUpdatePins(updatedPins);
        onPinClick(null);
    };

    const handleStatusUpdate = (pinId: string, newStatus: DesignPinStatus) => {
        onUpdatePins(pins.map(p => p.id === pinId ? { ...p, status: newStatus } : p));
    };

    const handleMistakeToggle = (pinId: string) => {
        onUpdatePins(pins.map(p => p.id === pinId ? { ...p, isMistake: !p.isMistake } : p));
    };

    const handleAddReply = (pinId: string) => {
        if (!replyText.trim()) return;
        const newReply: DesignReply = {
            author: isDesigner ? 'Designer' : 'Manager',
            text: replyText.trim(),
            timestamp: new Date().toISOString()
        };
        onUpdatePins(pins.map(p => p.id === pinId ? { ...p, replies: [...(p.replies || []), newReply] } : p));
        setReplyText('');
        setIsReplyMode(false);
    };

    const handleDeletePin = (e: React.MouseEvent, pinId: string) => {
        e.stopPropagation();
        onUpdatePins(pins.filter(p => p.id !== pinId));
        onPinClick(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onUpload) onUpload(file);
        e.target.value = '';
    };

    const handlePopoverMouseDown = (e: React.MouseEvent) => {
        const header = e.currentTarget as HTMLElement;
        const popover = header.closest('.fixed-comment-box') as HTMLElement;
        if (!popover || !containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const popoverRect = popover.getBoundingClientRect();
        setIsDraggingPopover(true);
        dragStartRef.current = {
            mouseX: e.clientX, mouseY: e.clientY,
            popoverX: popoverRect.left - containerRect.left,
            popoverY: popoverRect.top - containerRect.top
        };
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingPopover && dragStartRef.current && containerRef.current) {
                const deltaX = e.clientX - dragStartRef.current.mouseX;
                const deltaY = e.clientY - dragStartRef.current.mouseY;
                let newX = dragStartRef.current.popoverX + deltaX;
                let newY = dragStartRef.current.popoverY + deltaY;
                const containerRect = containerRef.current.getBoundingClientRect();
                newX = Math.max(0, Math.min(newX, containerRect.width - 320));
                newY = Math.max(0, Math.min(newY, containerRect.height - 150));
                setPopoverPos({ x: newX, y: newY });
            }
            if (isDraggingSlider && containerRef.current) {
                const compBox = document.querySelector('.group\\/comp-container');
                if (compBox) {
                    const rect = compBox.getBoundingClientRect();
                    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
                    setSliderPosition((x / rect.width) * 100);
                    setSliderVerticalPosition((y / rect.height) * 100);
                }
            }
        };
        const handleMouseUp = () => { setIsDraggingPopover(false); setIsDraggingSlider(false); };
        if (isDraggingPopover || isDraggingSlider) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingPopover, isDraggingSlider]);

    const isPanModeActive = isSpacePressed || isMiddleMouseDown;

    const renderPin = (pin: DesignPin) => {
        const pinIndex = pins.findIndex(p => p.id === pin.id) + 1;
        return (
            <button
                key={pin.id}
                className={cn(
                    "pin-bubble absolute h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-xl border-2 border-white transition-all transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto",
                    PIN_COLORS[pin.status || 'open'],
                    pin.isMistake && "ring-4 ring-destructive ring-offset-0 scale-110",
                    highlightedPinId === pin.id ? "ring-4 ring-primary ring-offset-2 z-50 scale-125" : "scale-100 z-10 hover:scale-110",
                    pin.status === 'resolved' && "opacity-60 grayscale-[0.5]"
                )}
                style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: `translate(-50%, -50%) scale(${1/zoom})` }}
                onClick={(e) => { 
                    if (isPanModeActive || isDraggingSlider) return;
                    e.stopPropagation(); 
                    setRepositionKey(prev => prev + 1); 
                    onPinClick(pin.id); 
                }}
            >
                {pinIndex}
            </button>
        );
    };

    return (
        <div className="h-full flex flex-col relative group/canvas bg-stone-950 overflow-hidden">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

            {!imageUrl && !isLightTable && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5 border-dashed border-2 border-white/10 rounded-xl m-4">
                    {isLatestDraftLocked ? (
                        <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                            <div className="h-16 w-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-sm"><Lock className="h-8 w-8" /></div>
                            <div className="space-y-1 text-white">
                                <h4 className="font-bold text-base">Work in Progress</h4>
                                <p className="text-[11px] text-white/60 font-medium leading-relaxed">The designer is currently drafting V{version}. <br/>This version will be visible once submitted for review.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4 text-white">
                            <div className="h-16 w-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto"><Upload className="h-8 w-8" /></div>
                            <div className="space-y-1">
                                <h4 className="font-bold">{status === 'DRAFT' || status === 'PENDING' ? "Design not uploaded" : "No Proof Uploaded"}</h4>
                                <p className="text-xs text-white/60">{isDesigner ? "Upload the design proof to begin feedback." : "Waiting for designer to upload proof."}</p>
                            </div>
                            {isDesigner && <Button onClick={() => fileInputRef.current?.click()} size="sm">Select Design File</Button>}
                        </div>
                    )}
                </div>
            )}

            {(imageUrl || isLightTable) && (
                <>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1 p-1 bg-background/90 backdrop-blur-xl border border-primary/20 rounded-r-xl shadow-2xl overflow-hidden">
                        <TooltipProvider>
                            <div className="flex flex-col items-center gap-1 p-1">
                                {isFeedbackUnlocked ? (
                                    <>
                                        <Tooltip><TooltipTrigger asChild><Button variant={activeTool === 'pointer' ? 'default' : 'ghost'} size="icon" className="h-9 w-9 rounded-md" onClick={() => setActiveTool('pointer')}><MousePointer2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right">Select Tool (V)</TooltipContent></Tooltip>
                                        <Tooltip><TooltipTrigger asChild><Button variant={activeTool === 'comment' ? 'default' : 'ghost'} size="icon" className="h-9 w-9 rounded-md" onClick={() => setActiveTool('comment')}><MessageSquarePlus className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right">Comment Tool (C)</TooltipContent></Tooltip>
                                    </>
                                ) : (
                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 opacity-50 cursor-not-allowed"><Lock className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right">Feedback Locked</TooltipContent></Tooltip>
                                )}
                            </div>

                            <div className="w-6 h-px bg-primary/10 mx-auto my-1" />

                            <div className="flex flex-col items-center gap-1 p-1">
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-md", !showPins && "text-primary")} onClick={() => setShowPins(!showPins)}>{showPins ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</Button></TooltipTrigger><TooltipContent side="right">Toggle Pins</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-md", !effectiveShowPopovers && "text-primary")} onClick={onTogglePopovers}>{effectiveShowPopovers ? <MessageSquare className="h-4 w-4" /> : <MessageSquareOff className="h-4 w-4" />}</Button></TooltipTrigger><TooltipContent side="right">Toggle Comments</TooltipContent></Tooltip>
                                {onToggleLightTable && (
                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-md", isLightTable && "bg-primary/10 text-primary")} onClick={onToggleLightTable}><LayoutGrid className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right">Light Table</TooltipContent></Tooltip>
                                )}
                                {!isLightTable && (
                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-md", showComparison && "bg-primary/10 text-primary")} onClick={() => setShowComparison(!showComparison)}><Layers className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right">Comparison Mode</TooltipContent></Tooltip>
                                )}
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-md", isZenMode && "text-primary")} onClick={onToggleZen}>{isZenMode ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}</Button></TooltipTrigger><TooltipContent side="right">Zen Mode (F)</TooltipContent></Tooltip>
                            </div>

                            <div className="w-6 h-px bg-primary/10 mx-auto my-1" />

                            <div className="flex flex-col items-center gap-1 p-1">
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 rounded-md" onClick={handleReset}><RefreshCcw className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right">Reset View (R)</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 rounded-md" onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right">Zoom In</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 rounded-md" onClick={handleZoomOut} disabled={zoom <= minFitZoom}><ZoomOut className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right">Zoom Out</TooltipContent></Tooltip>
                            </div>
                        </TooltipProvider>
                    </div>

                    <div 
                        ref={containerRef}
                        className={cn("flex-1 overflow-hidden relative select-none", isPanModeActive ? (isDraggingCanvas ? "cursor-grabbing" : "cursor-grab") : (canDropPin ? "cursor-crosshair" : "cursor-default"))}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
                        onClick={handleCanvasClick}
                    >
                        <div className="absolute inset-0 origin-center pointer-events-none transition-transform duration-75 ease-out" style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})` }}>
                            {isLightTable ? (
                                <div className="flex flex-row items-center gap-32 px-64 h-[80vh]">
                                    {allComponents.map(comp => {
                                        const latestV = comp.versions?.length > 0 ? comp.versions[comp.versions.length - 1] : null;
                                        return (
                                            <div key={comp.id} className="flex flex-col items-center shrink-0">
                                                <div className="h-12 flex flex-col items-center justify-center mb-4 shrink-0">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{comp.name}</span>
                                                    <span className="text-[8px] font-bold text-white/20 uppercase mt-0.5">V{comp.versions.length}</span>
                                                </div>
                                                <div 
                                                    className="relative h-[80vh] w-fit pointer-events-auto group/comp-container shadow-[0_30px_100px_rgba(0,0,0,0.5)]"
                                                    onClick={(e) => { if (!canDropPin) return; e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); onAddPin((e.clientX - rect.left) / rect.width * 100, (e.clientY - rect.top) / rect.height * 100, comp.id); }}
                                                >
                                                    {latestV?.imageUrl && <img src={latestV.imageUrl} alt={comp.name} className="h-full w-auto object-contain" draggable={false} />}
                                                    {showPins && comp.pins.map(pin => renderPin(pin))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div 
                                        className="relative h-[80vh] w-fit pointer-events-auto group/comp-container shadow-[0_30px_100px_rgba(0,0,0,0.5)]"
                                        onClick={(e) => { if (!canDropPin) return; e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); onAddPin((e.clientX - rect.left) / rect.width * 100, (e.clientY - rect.top) / rect.height * 100); }}
                                    >
                                        {showComparison && comparisonImageUrl && <img src={comparisonImageUrl} alt="Comparison (Old)" className="absolute inset-0 w-full h-full object-contain" draggable={false} />}
                                        {imageUrl && <img src={imageUrl} alt="Design Proof" className="h-full w-auto object-contain" style={showComparison ? { clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` } : undefined} draggable={false} />}
                                        {showComparison && (
                                            <div className="absolute inset-0 z-[60] pointer-events-none overflow-hidden">
                                                <div className="slider-hit-zone absolute inset-y-0 w-8 -ml-4 pointer-events-auto cursor-ew-resize" style={{ left: `${sliderPosition}%` }} onMouseDown={(e) => { e.preventDefault(); setIsDraggingSlider(true); }} onClick={(e) => e.stopPropagation()}>
                                                    <div className="absolute inset-y-0 left-1/2 w-px bg-blue-600" />
                                                    <button className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xl border-4 border-background" style={{ top: `${sliderVerticalPosition}%` }}><GripHorizontal className="h-5 w-5" /></button>
                                                    <div className="absolute top-6 left-12 bg-black/80 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded whitespace-nowrap">After</div>
                                                    <div className="absolute top-6 right-12 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border border-white/10 whitespace-nowrap">Before</div>
                                                </div>
                                            </div>
                                        )}
                                        {showPins && pins.map(pin => renderPin(pin))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedPinId && activePin && effectiveShowPopovers && (
                            <div className={cn("absolute z-[100] w-80 animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto fixed-comment-box", isDraggingPopover && "scale-[1.02] shadow-2xl")} style={popoverPos ? { left: `${popoverPos.x}px`, top: `${popoverPos.y}px` } : { bottom: '24px', right: '24px' }}>
                                <div className="bg-background rounded-xl shadow-2xl border-2 border-primary/20 overflow-hidden">
                                    <div className="p-3 border-b bg-muted/20 flex items-center justify-between cursor-grab active:cursor-grabbing group/header" onMouseDown={handlePopoverMouseDown} onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col gap-0.5 opacity-30 group-hover/header:opacity-60 transition-opacity"><GripHorizontal className="h-3 w-3" /></div>
                                            <div className={cn("h-5 w-5 rounded flex items-center justify-center text-[10px] font-black text-white", PIN_COLORS[activePin.status || 'open'])}>{activePinNumber}</div>
                                            <div className="flex flex-col -space-y-0.5">
                                                <span className="text-[10px] font-black uppercase tracking-widest">{activePin.author}</span>
                                                <div className="flex items-center gap-1.5"><span className="text-[8px] font-black uppercase text-primary">{activePin.status}</span>{activePin.isMistake && <span className="text-[8px] font-black uppercase text-destructive">• MISTAKE</span>}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">V{activePin.version}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onPinClick(null)}><X className="h-3.5 w-3.5" /></Button>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                                        {activePin.isDraft ? (
                                            <div className="space-y-3">
                                                <Textarea ref={textareaRef} placeholder="Enter feedback..." className="min-h-[80px] text-xs font-semibold" value={draftText} onChange={(e) => onDraftTextChange(e.target.value)} />
                                                <div className="flex items-center justify-between">
                                                    {!isDesigner && <div className="flex items-center space-x-2"><Checkbox id="pin-mistake" checked={isMistakeDraft} onCheckedChange={(v) => setIsMistakeDraft(!!v)} /><Label htmlFor="pin-mistake" className="text-[9px] font-black uppercase text-destructive">Mistake</Label></div>}
                                                    <Button size="sm" className="h-7 text-[10px] font-black uppercase px-3 ml-auto" onClick={handleSaveComment}>Save</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <p className="text-xs font-semibold leading-relaxed">{activePin.text || <span className="italic opacity-50">No details</span>}</p>
                                                {activePin.replies?.map((r, i) => (
                                                    <div key={i} className="pl-3 border-l-2 border-primary/10 space-y-0.5">
                                                        <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-muted-foreground"><CornerDownRight className="h-3 w-3" /> {r.author}</div>
                                                        <p className="text-[10px] font-medium bg-muted/40 p-1.5 rounded-md">{r.text}</p>
                                                    </div>
                                                ))}
                                                {isReplyMode ? (
                                                    <div className="space-y-2 pt-2 border-t">
                                                        <Textarea ref={textareaRef} placeholder="Reply..." className="min-h-[60px] text-[10px] font-semibold" value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                                                        <div className="flex justify-end gap-2"><Button variant="ghost" size="sm" className="h-6 text-[9px] font-black uppercase" onClick={() => setIsReplyMode(false)}>Cancel</Button><Button size="sm" className="h-6 text-[9px] font-black uppercase" onClick={() => handleAddReply(activePin.id)}>Send</Button></div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-primary/5">
                                                        <Button variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase px-2" onClick={() => setIsReplyMode(true)}><Send className="h-3 w-3 mr-1" /> Reply</Button>
                                                        {!isDesigner && activePin.status !== 'resolved' && (
                                                            <>
                                                                <Button variant="outline" size="sm" className="h-6 text-[9px] font-black uppercase px-2 border-green-600 text-green-600" onClick={() => handleStatusUpdate(activePin.id, 'resolved')}><CheckCircle2 className="h-3 w-3 mr-1" /> Resolve</Button>
                                                                <Button variant="outline" size="sm" className={cn("h-6 text-[9px] font-black uppercase px-2", activePin.isMistake ? "border-primary text-primary" : "border-destructive text-destructive")} onClick={() => handleMistakeToggle(activePin.id)}><AlertCircle className="h-3 w-3 mr-1" /> {activePin.isMistake ? 'Unmark' : 'Mistake'}</Button>
                                                            </>
                                                        )}
                                                        {!isDesigner && activePin.status === 'resolved' && <Button variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase px-2 border-primary text-primary" onClick={() => handleStatusUpdate(activePin.id, 'open')}><RotateCcw className="h-3 w-3 mr-1" /> Re-open</Button>}
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive ml-auto" onClick={(e) => handleDeletePin(e, activePin.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
