'use client';

import * as React from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';
import type { DesignPin, DesignPinStatus, DesignWorkflowStatus, DesignReply } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { 
    ZoomIn, 
    ZoomOut, 
    Upload, 
    X, 
    Trash2,
    Eye,
    EyeOff,
    Scaling,
    CornerDownRight,
    CheckCircle2,
    AlertCircle,
    Send,
    Lock,
    RotateCcw,
    GripHorizontal,
    Layers,
    Hand,
    MousePointer2,
    MessageSquarePlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

const PIN_COLORS: Record<DesignPinStatus, string> = {
    open: 'bg-blue-600',
    resolved: 'bg-green-600'
};

interface DesignCanvasProps {
    imageUrl: string | null;
    comparisonImageUrl?: string | null;
    pins: DesignPin[];
    highlightedPinId: string | null;
    selectedPinId: string | null;
    onAddPin: (x: number, y: number) => void;
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
    isWorkbench = false,
    isLatestDraftLocked = false,
    draftText,
    onDraftTextChange
}: DesignCanvasProps) {
    const [zoom, setZoom] = useState(1);
    const [showPins, setShowPins] = useState(true);
    const [showComparison, setShowComparison] = useState(false);
    const [activeTool, setActiveTool] = useState<ToolMode>('comment');
    
    // Split Slider State
    const [sliderPosition, setSliderPosition] = useState(50);
    const [sliderVerticalPosition, setSliderVerticalPosition] = useState(50);
    const [isDraggingSlider, setIsDraggingSlider] = useState(false);

    // Pan state
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isMiddleMouseDown, setIsMiddleMouseDown] = useState(false);
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const dragStartMousePos = useRef<{ x: number; y: number } | null>(null);
    const initialPanOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    // Drag state for popover
    const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
    const [isDraggingPopover, setIsDraggingPopover] = useState(false);
    const dragStartRef = useRef<{ mouseX: number; mouseY: number; popoverX: number; popoverY: number } | null>(null);
    
    // Tracking state to force repositioning on click even if same pin
    const [repositionKey, setRepositionKey] = useState(0);
    const lastSelectionId = useRef<string | null>(null);
    const lastRepositionKey = useRef<number>(-1);

    const isLatest = version === currentVersion;
    
    const isFeedbackUnlocked = useMemo(() => {
        if (!imageUrl || !isLatest || isSpacePressed || isMiddleMouseDown || isDraggingSlider) return false;

        if (isDesigner) {
            return status === 'DRAFT' && hasNewDraft;
        } else {
            return status !== 'PENDING' && status !== 'DRAFT';
        }
    }, [imageUrl, isLatest, isDesigner, status, hasNewDraft, isSpacePressed, isMiddleMouseDown, isDraggingSlider]);

    const canDropPin = isFeedbackUnlocked && activeTool === 'comment';
    
    const [replyText, setReplyText] = useState('');
    const [isReplyMode, setIsReplyMode] = useState(false);
    const [isMistakeDraft, setIsMistakeDraft] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const activePin = useMemo(() => pins.find(p => p.id === selectedPinId), [pins, selectedPinId]);
    const activePinNumber = useMemo(() => pins.findIndex(p => p.id === selectedPinId) + 1, [pins, selectedPinId]);

    // Natural Pan & Zoom Effect
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (!imageUrl) return;
            e.preventDefault();

            // Native Pinch-to-zoom or Ctrl+Wheel
            if (e.ctrlKey || e.metaKey) {
                const delta = e.deltaY;
                setZoom(prev => {
                    const factor = delta > 0 ? 0.9 : 1.1;
                    const next = prev * factor;
                    return Math.max(0.5, Math.min(next, 4));
                });
            } else {
                // Natural Pan (Swipes/Wheels)
                setPanOffset(prev => ({
                    x: prev.x - e.deltaX,
                    y: prev.y - e.deltaY
                }));
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [imageUrl]);

    // Keyboard Shortcuts Listener
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
                if (selectedPinId || highlightedPinId) {
                    onPinClick(null);
                }
            }

            if (!isTyping && isFeedbackUnlocked) {
                if (e.key.toLowerCase() === 'c') {
                    setActiveTool('comment');
                }
                if (e.key.toLowerCase() === 'v') {
                    setActiveTool('pointer');
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
    }, [isSpacePressed, selectedPinId, highlightedPinId, onPinClick, isFeedbackUnlocked]);

    useEffect(() => {
        if (!comparisonImageUrl) setShowComparison(false);
    }, [comparisonImageUrl]);

    useEffect(() => {
        const isFreshSelection = selectedPinId !== lastSelectionId.current || repositionKey !== lastRepositionKey.current;

        if (selectedPinId && isFreshSelection && activePin) {
            setReplyText('');
            setIsReplyMode(false);
            setIsMistakeDraft(!!activePin.isMistake);
            
            if (containerRef.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                
                const px = (activePin.x / 100) * containerRect.width;
                const py = (activePin.y / 100) * containerRect.height;
                
                const popoverWidth = 320;
                const popoverHeight = 250; 
                const offset = 24;

                let x = px + offset;
                let y = py + offset;

                if (x + popoverWidth > containerRect.width - 20) {
                    x = px - popoverWidth - offset;
                }
                if (y + popoverHeight > containerRect.height - 20) {
                    y = py - popoverHeight - offset;
                }

                x = Math.max(20, Math.min(x, containerRect.width - popoverWidth - 20));
                y = Math.max(20, Math.min(y, containerRect.height - 150));

                setPopoverPos({ x, y });
                
                lastSelectionId.current = selectedPinId;
                lastRepositionKey.current = repositionKey;
            }
            
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 150);
        } else if (!selectedPinId) {
            lastSelectionId.current = null;
            lastRepositionKey.current = -1;
            setPopoverPos(null);
        }
    }, [selectedPinId, activePin, repositionKey]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
    const handleReset = () => {
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (isDraggingSlider) return;

        // Space or Middle Button triggers dragging
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
            setPanOffset({
                x: initialPanOffset.current.x + dx,
                y: initialPanOffset.current.y + dy
            });
        }
    };

    const handleCanvasMouseUp = (e: React.MouseEvent) => {
        setIsDraggingCanvas(false);
        if (e.button === 1) setIsMiddleMouseDown(false);
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (!imageUrl || isSpacePressed || isMiddleMouseDown || isDraggingSlider) return;
        
        const target = e.target as HTMLElement;
        if (target.closest('.pin-bubble') || target.closest('button') || target.closest('.fixed-comment-box') || target.closest('.slider-hit-zone')) return;
        
        if (highlightedPinId || selectedPinId) {
            onPinClick(null);
            return;
        }

        if (!canDropPin) return;

        e.stopPropagation();
        e.preventDefault();
        
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        
        const x = ((e.clientX - rect.left - panOffset.x - (rect.width/2)) / zoom + (rect.width/2)) / rect.width * 100;
        const y = ((e.clientY - rect.top - panOffset.y - (rect.height/2)) / zoom + (rect.height/2)) / rect.height * 100;
        
        onAddPin(x, y);
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
                return {
                    ...p,
                    text: trimmed,
                    status: 'open',
                    isMistake: isMistakeDraft,
                    isDraft: false
                } as DesignPin;
            }
            return p;
        });
        onUpdatePins(updatedPins);
        onPinClick(null);
    };

    const handleStatusUpdate = (pinId: string, newStatus: DesignPinStatus) => {
        const updatedPins = pins.map(p => p.id === pinId ? { ...p, status: newStatus } : p);
        onUpdatePins(updatedPins);
    };

    const handleMistakeToggle = (pinId: string) => {
        const updatedPins = pins.map(p => p.id === pinId ? { ...p, isMistake: !p.isMistake } : p);
        onUpdatePins(updatedPins);
    };

    const handleAddReply = (pinId: string) => {
        if (!replyText.trim()) return;
        const newReply: DesignReply = {
            author: isDesigner ? 'Designer' : 'Manager',
            text: replyText.trim(),
            timestamp: new Date().toISOString()
        };
        const updatedPins = pins.map(p => p.id === pinId ? { ...p, replies: [...(p.replies || []), newReply] } : p);
        onUpdatePins(updatedPins);
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

        const initialX = popoverRect.left - containerRect.left;
        const initialY = popoverRect.top - containerRect.top;

        setIsDraggingPopover(true);
        dragStartRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            popoverX: initialX,
            popoverY: initialY
        };
        e.preventDefault();
    };

    // Global Drag Logic for Popover and Slider
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
                const rect = containerRef.current.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
                setSliderPosition((x / rect.width) * 100);
                setSliderVerticalPosition((y / rect.height) * 100);
            }
        };

        const handleMouseUp = () => {
            setIsDraggingPopover(false);
            setIsDraggingSlider(false);
        };

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

    return (
        <div className="h-full flex flex-col relative group/canvas bg-stone-950 overflow-hidden">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
            />

            {!imageUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5 border-dashed border-2 border-white/10 rounded-xl m-4">
                    {isLatestDraftLocked ? (
                        <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                            <div className="h-16 w-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <Lock className="h-8 w-8" />
                            </div>
                            <div className="space-y-1 text-white">
                                <h4 className="font-bold text-base">Work in Progress</h4>
                                <p className="text-[11px] text-white/60 font-medium leading-relaxed">
                                    The designer is currently drafting V{version}. <br/>
                                    This version will be visible once submitted for review.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4 text-white">
                            <div className="h-16 w-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto">
                                <Upload className="h-8 w-8" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold">{status === 'DRAFT' || status === 'PENDING' ? "Design not uploaded" : "No Proof Uploaded"}</h4>
                                <p className="text-xs text-white/60">
                                    {isDesigner ? "Upload the design proof to begin feedback." : "Waiting for designer to upload proof."}
                                </p>
                            </div>
                            {isDesigner && <Button onClick={() => fileInputRef.current?.click()} size="sm">Select Design File</Button>}
                        </div>
                    )}
                </div>
            )}

            {imageUrl && (
                <>
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1.5 bg-background/90 backdrop-blur-xl border border-primary/20 rounded-full shadow-2xl scale-110">
                        <TooltipProvider>
                            <div className="flex items-center px-1.5 gap-1.5">
                                {isFeedbackUnlocked ? (
                                    <>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button 
                                                    variant={activeTool === 'pointer' ? 'default' : 'ghost'} 
                                                    size="icon" 
                                                    className={cn("h-9 w-9 rounded-full transition-all", activeTool === 'pointer' && "shadow-lg scale-105")}
                                                    onClick={() => setActiveTool('pointer')}
                                                >
                                                    <MousePointer2 className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Select Tool (V)</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button 
                                                    variant={activeTool === 'comment' ? 'default' : 'ghost'} 
                                                    size="icon" 
                                                    className={cn("h-9 w-9 rounded-full transition-all", activeTool === 'comment' && "shadow-lg scale-105")}
                                                    onClick={() => setActiveTool('comment')}
                                                >
                                                    <MessageSquarePlus className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Comment Tool (C)</TooltipContent>
                                        </Tooltip>
                                    </>
                                ) : isPanModeActive ? (
                                    <div className="flex items-center px-3 gap-2">
                                        <Hand className="h-3 w-3 text-primary animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Pan Mode</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center px-3 gap-2">
                                        <Lock className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            {!isDesigner && (status === 'DRAFT' || status === 'PENDING') 
                                                ? "Manager feedback locked during draft" 
                                                : isLatest ? "Locked" : "Viewing History"}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="w-px h-4 bg-muted-foreground/20 mx-1" />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={handleReset}><Scaling className="h-4 w-4" /></Button>
                                </TooltipTrigger>
                                <TooltipContent>Fit to Screen (R)</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-full", !showPins && "text-primary")} onClick={() => setShowPins(!showPins)}>
                                        {showPins ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{showPins ? "Hide Pins" : "Show Pins"}</TooltipContent>
                            </Tooltip>
                            {comparisonImageUrl && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className={cn("h-9 w-9 rounded-full", showComparison && "text-primary bg-primary/10")} 
                                            onClick={() => setShowComparison(!showComparison)}
                                        >
                                            <Layers className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Split Comparison (Before/After Wiper)</TooltipContent>
                                </Tooltip>
                            )}
                        </TooltipProvider>
                    </div>

                    <div className="absolute top-6 right-6 z-50 flex flex-col gap-2">
                        <div className="bg-background/90 backdrop-blur-md border border-primary/20 rounded-lg p-1 shadow-xl flex flex-col gap-1">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">Zoom In</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}><ZoomOut className="h-4 w-4" /></Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">Zoom Out</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>

                    <div 
                        ref={containerRef}
                        className={cn(
                            "flex-1 overflow-hidden relative select-none",
                            isPanModeActive ? (isDraggingCanvas ? "cursor-grabbing" : "cursor-grab") : (canDropPin ? "cursor-crosshair" : "cursor-default")
                        )}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={(e) => handleCanvasMouseUp(e)}
                        onClick={handleCanvasClick}
                    >
                        <div 
                            className="absolute inset-0 origin-center pointer-events-none transition-transform duration-75 ease-out"
                            style={{ 
                                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})` 
                            }}
                        >
                            {/* Base Image (Before - Previous Version) */}
                            {showComparison && comparisonImageUrl && (
                                <img 
                                    src={comparisonImageUrl} 
                                    alt="Comparison (Before)" 
                                    className="absolute inset-0 w-full h-full object-contain" 
                                    draggable={false} 
                                />
                            )}

                            {/* Current Image (After) */}
                            {imageUrl && (
                                <img 
                                    ref={imageRef} 
                                    src={imageUrl} 
                                    alt="Design View" 
                                    className="w-full h-full object-contain" 
                                    style={showComparison ? {
                                        clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
                                    } : undefined}
                                    draggable={false} 
                                />
                            )}
                            
                            {showPins && pins.map((pin, index) => {
                                if (pin.version > version) return null;
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
                                        {index + 1}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Split Slider Wiper System */}
                        {showComparison && comparisonImageUrl && (
                            <div className="absolute inset-0 z-[60] pointer-events-none overflow-hidden">
                                <div 
                                    className="slider-hit-zone absolute inset-y-0 w-8 -ml-4 pointer-events-auto cursor-ew-resize group/slider"
                                    style={{ left: `${sliderPosition}%` }}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        setIsDraggingSlider(true);
                                        // Jump position immediately on click
                                        const rect = containerRef.current?.getBoundingClientRect();
                                        if (rect) {
                                            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                                            const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
                                            setSliderPosition((x / rect.width) * 100);
                                            setSliderVerticalPosition((y / rect.height) * 100);
                                        }
                                    }}
                                >
                                    {/* 1px High-Contrast Hairline (Sharp Transition) */}
                                    <div className="absolute inset-y-0 left-1/2 w-px bg-blue-600 pointer-events-none" />
                                    
                                    {/* Draggable Obstruction-Free Handle */}
                                    <button
                                        className="slider-handle absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xl transition-transform border-4 border-background active:scale-95 pointer-events-none"
                                        style={{ top: `${sliderVerticalPosition}%` }}
                                    >
                                        <GripHorizontal className="h-5 w-5" />
                                    </button>

                                    {/* labels at top edge to clear central vision */}
                                    <div className="absolute top-6 right-12 bg-black/80 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border border-white/10 opacity-0 group-hover/slider:opacity-100 transition-opacity whitespace-nowrap">
                                        Before
                                    </div>
                                    <div className="absolute top-6 left-12 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/slider:opacity-100 transition-opacity whitespace-nowrap">
                                        After
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedPinId && activePin && (
                            <div 
                                className={cn(
                                    "absolute z-[100] w-80 animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto fixed-comment-box transition-[box-shadow]",
                                    isDraggingPopover && "shadow-[0_30px_60px_rgba(0,0,0,0.4)] scale-[1.02]"
                                )}
                                style={popoverPos ? { left: `${popoverPos.x}px`, top: `${popoverPos.y}px` } : { bottom: '24px', right: '24px' }}
                            >
                                <div className="bg-background rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 border-primary/20 overflow-hidden">
                                    <div 
                                        className="p-3 border-b bg-muted/20 flex items-center justify-between cursor-grab active:cursor-grabbing group/header"
                                        onMouseDown={handlePopoverMouseDown}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col gap-0.5 opacity-30 group-hover/header:opacity-60 transition-opacity">
                                                <GripHorizontal className="h-3 w-3" />
                                            </div>
                                            <div className={cn("h-5 w-5 rounded flex items-center justify-center text-[10px] font-black text-white", PIN_COLORS[activePin.status || 'open'])}>
                                                {activePinNumber}
                                            </div>
                                            <div className="flex flex-col -space-y-0.5">
                                                <span className="text-[10px] font-black uppercase tracking-widest">{activePin.author}</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-primary">
                                                        {activePin.status}
                                                    </span>
                                                    {activePin.isMistake && (
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-destructive">
                                                            • MISTAKE
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">V{activePin.version}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => onPinClick(null)}>
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {activePin.isDraft ? (
                                            <div className="space-y-3">
                                                <Textarea 
                                                    ref={textareaRef}
                                                    placeholder="Enter feedback details..." 
                                                    className="min-h-[80px] text-xs font-semibold leading-relaxed" 
                                                    value={draftText} 
                                                    onChange={(e) => onDraftTextChange(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleSaveComment();
                                                        }
                                                    }}
                                                />
                                                <div className="flex items-center justify-between">
                                                    {!isDesigner && (
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox id={`fixed-mistake-${activePin.id}`} checked={isMistakeDraft} onCheckedChange={(val) => setIsMistakeDraft(!!val)} />
                                                            <Label htmlFor={`fixed-mistake-${activePin.id}`} className="text-[9px] font-black uppercase tracking-wider text-destructive cursor-pointer">Mistake</Label>
                                                        </div>
                                                    )}
                                                    <Button size="sm" className="h-7 text-[10px] font-black uppercase px-3 ml-auto shadow-md" onClick={handleSaveComment}>Save Feedback</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <p className="text-xs font-semibold leading-relaxed text-foreground/90">
                                                    {activePin.text || <span className="italic opacity-50">No description provided</span>}
                                                </p>
                                                
                                                {activePin.replies && activePin.replies.length > 0 && (
                                                    <div className="space-y-2 pt-2 border-t border-primary/5">
                                                        {activePin.replies.map((reply, i) => (
                                                            <div key={i} className="pl-3 border-l-2 border-primary/10 space-y-0.5">
                                                                <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-muted-foreground"><CornerDownRight className="h-3 w-3" /> {reply.author}</div>
                                                                <p className="text-[10px] font-medium leading-relaxed bg-muted/40 p-1.5 rounded-md">{reply.text}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {isReplyMode ? (
                                                    <div className="space-y-2 pt-2 border-t">
                                                        <Textarea 
                                                            ref={textareaRef}
                                                            placeholder="Write a reply..." 
                                                            className="min-h-[60px] text-[10px] font-semibold"
                                                            value={replyText}
                                                            onChange={(e) => setReplyText(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    handleAddReply(activePin.id);
                                                                }
                                                            }}
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="sm" className="h-6 text-[9px] font-black uppercase" onClick={() => setIsReplyMode(false)}>Cancel</Button>
                                                            <Button size="sm" className="h-6 text-[9px] font-black uppercase" onClick={() => handleAddReply(activePin.id)}>Reply</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-primary/5">
                                                        <Button variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase px-2" onClick={() => setIsReplyMode(true)}><Send className="h-3 w-3 mr-1" /> Reply</Button>
                                                        {!isDesigner && (
                                                            <>
                                                                {activePin.status !== 'resolved' ? (
                                                                    <>
                                                                        <Button variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase px-2 border-green-600 text-green-600 hover:bg-green-50" onClick={() => handleStatusUpdate(activePin.id, 'resolved')}><CheckCircle2 className="h-3 w-3 mr-1" /> Resolve</Button>
                                                                        <Button 
                                                                            variant="outline" 
                                                                            size="sm" 
                                                                            className={cn("h-7 text-[9px] font-black uppercase px-2", activePin.isMistake ? "border-primary text-primary" : "border-destructive text-destructive")} 
                                                                            onClick={() => handleMistakeToggle(activePin.id)}
                                                                        >
                                                                            <AlertCircle className="h-3 w-3 mr-1" /> {activePin.isMistake ? 'Unmark Mistake' : 'Mark Mistake'}
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <Button variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase px-2 border-primary text-primary hover:bg-primary/5" onClick={() => handleStatusUpdate(activePin.id, 'open')}><RotateCcw className="h-3 w-3 mr-1" /> Re-open</Button>
                                                                )}
                                                            </>
                                                        )}
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