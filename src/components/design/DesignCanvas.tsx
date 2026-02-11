'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import type { DesignPin, DesignPinStatus, DesignWorkflowStatus, DesignReply } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { 
    ZoomIn, 
    ZoomOut, 
    RotateCcw, 
    Upload, 
    Image as ImageIcon, 
    X, 
    Maximize2, 
    MessageSquare, 
    AlertCircle, 
    CornerDownRight, 
    Trash2,
    Lock,
    CheckCircle2,
    Eye,
    EyeOff,
    MousePointer2,
    MessageSquarePlus,
    Scaling
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

interface DesignCanvasProps {
    imageUrl: string | null;
    pins: DesignPin[];
    highlightedPinId: string | null;
    onAddPin: (x: number, y: number) => void;
    onPinClick: (id: string | null) => void;
    onUpdatePins: (pins: DesignPin[]) => void;
    onUpload?: (file: File) => void;
    onToggleFullscreen?: () => void;
    isDesigner: boolean;
    version: number;
    currentVersion: number;
    status: DesignWorkflowStatus;
    hasNewDraft?: boolean;
    isWorkbench?: boolean;
}

const PIN_COLORS: Record<DesignPinStatus, string> = {
    open: 'bg-blue-600',
    mistake: 'bg-destructive',
    fixed: 'bg-amber-500',
    resolved: 'bg-green-600'
};

export function DesignCanvas({ 
    imageUrl, 
    pins, 
    highlightedPinId, 
    onAddPin, 
    onPinClick, 
    onUpdatePins,
    onUpload,
    onToggleFullscreen,
    isDesigner,
    version,
    currentVersion,
    status,
    hasNewDraft = false,
    isWorkbench = false
}: DesignCanvasProps) {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showPins, setShowPins] = useState(true);
    const [interactionMode, setInteractionMode] = useState<'NAVIGATE' | 'COMMENT'>('NAVIGATE');
    
    // Feedback Drafting State
    const [draftText, setDraftText] = useState('');
    const [replyingPinId, setReplyingPinId] = useState<string | null>(null);
    const [isMistakeDraft, setIsMistakeDraft] = useState(false);
    const isSavingRef = useRef(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isLatest = version === currentVersion;
    const canInteractWithFeedback = isLatest && ((isDesigner && status === 'DRAFT') || (!isDesigner && (status === 'INTERNAL_REVIEW' || status === 'CUSTOMER_REVIEW')));
    const canAddPin = isLatest && interactionMode === 'COMMENT' && ((isDesigner && status === 'DRAFT') || (!isDesigner && (status === 'INTERNAL_REVIEW' || status === 'CUSTOMER_REVIEW')));

    // Auto-switch to comment mode if we highlight a pin
    useEffect(() => {
        if (highlightedPinId) setInteractionMode('COMMENT');
    }, [highlightedPinId]);

    // Sync draft state when a pin is selected/opened
    useEffect(() => {
        if (highlightedPinId) {
            const activePin = pins.find(p => p.id === highlightedPinId);
            if (activePin) {
                setDraftText(''); 
                setIsMistakeDraft(activePin.status === 'mistake');
            }
        } else {
            setDraftText('');
            setIsMistakeDraft(false);
            setReplyingPinId(null);
        }
    }, [highlightedPinId, pins]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
    const handleReset = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!imageUrl || e.button !== 0) return;
        
        // Always allow dragging if zoomed in or in NAVIGATE mode
        if (zoom > 1 || interactionMode === 'NAVIGATE') {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (!imageUrl || isDragging) return;
        
        // If a pin is already highlighted, first click elsewhere should just deselect it
        if (highlightedPinId) {
            onPinClick(null);
            return;
        }

        const target = e.target as HTMLElement;
        if (target.closest('.pin-bubble') || target.closest('[role="dialog"]') || target.closest('button')) return;
        
        if (!canAddPin) return;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        onAddPin(x, y);
    };

    const handleSaveComment = (pinId: string) => {
        if (!draftText.trim()) return;

        isSavingRef.current = true;
        const updatedPins = pins.map(p => {
            if (p.id === pinId) {
                return {
                    ...p,
                    text: draftText.trim(),
                    status: isMistakeDraft ? 'mistake' : 'open'
                } as DesignPin;
            }
            return p;
        });
        onUpdatePins(updatedPins);
        onPinClick(null);
        setTimeout(() => { isSavingRef.current = false; }, 100);
    };

    const handleDeletePin = (e: React.MouseEvent, pinId: string) => {
        e.stopPropagation();
        onUpdatePins(pins.filter(p => p.id !== pinId));
        onPinClick(null);
    };

    const handleStatusChange = (pinId: string, newStatus: DesignPinStatus) => {
        onUpdatePins(pins.map(p => p.id === pinId ? { ...p, status: newStatus } : p));
    };

    const handleClosePopover = (e: React.MouseEvent, pinId: string) => {
        e.stopPropagation();
        const pin = pins.find(p => p.id === pinId);
        if (pin && !pin.text && !draftText.trim() && !isSavingRef.current) {
            onUpdatePins(pins.filter(p => p.id !== pinId));
        }
        onPinClick(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onUpload) {
            onUpload(file);
        }
        e.target.value = '';
    };

    const renderEmptyState = () => (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 border-dashed border-2 rounded-xl m-4">
            {(isDesigner && (status === 'DRAFT' || status === 'PENDING')) ? (
                <div className="text-center space-y-4">
                    <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                        <Upload className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-bold">Ready to Start</h4>
                        <p className="text-xs text-muted-foreground">Upload the first draft to begin.</p>
                    </div>
                    <Button onClick={() => fileInputRef.current?.click()} size="sm">
                        Select Design File
                    </Button>
                </div>
            ) : (
                <div className="text-center space-y-2 opacity-50 px-8">
                    <ImageIcon className="h-12 w-12 mx-auto" />
                    <p className="text-sm font-medium">
                        {status === 'PENDING' ? 'Waiting for designer to start work' : 'Design proof not yet submitted'}
                    </p>
                </div>
            )}
        </div>
    );

    return (
        <div className="h-full flex flex-col relative group/canvas bg-stone-100 overflow-hidden">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

            {!imageUrl && renderEmptyState()}

            {imageUrl && (
                <>
                    {/* Floating Tool Palette */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1.5 bg-background/90 backdrop-blur-xl border border-primary/20 rounded-full shadow-2xl scale-110">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant={interactionMode === 'NAVIGATE' ? "default" : "ghost"} 
                                        size="icon" 
                                        className="h-9 w-9 rounded-full"
                                        onClick={() => setInteractionMode('NAVIGATE')}
                                    >
                                        <MousePointer2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Navigate (Pan/Zoom)</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant={interactionMode === 'COMMENT' ? "default" : "ghost"} 
                                        size="icon" 
                                        className={cn("h-9 w-9 rounded-full", interactionMode === 'COMMENT' && "bg-blue-600")}
                                        onClick={() => setInteractionMode('COMMENT')}
                                    >
                                        <MessageSquarePlus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Feedback (Drop Pin)</TooltipContent>
                            </Tooltip>
                            <div className="w-px h-4 bg-muted-foreground/20 mx-1" />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-9 w-9 rounded-full" 
                                        onClick={handleReset}
                                    >
                                        <Scaling className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Fit to Screen</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className={cn("h-9 w-9 rounded-full", !showPins && "text-primary")} 
                                        onClick={() => setShowPins(!showPins)}
                                    >
                                        {showPins ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{showPins ? "Hide Pins" : "Show Pins"}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <div className="absolute top-6 right-6 z-50 flex flex-col gap-2">
                        <div className="bg-background/90 backdrop-blur-md border border-primary/20 rounded-lg p-1 shadow-xl flex flex-col gap-1">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
                                            <ZoomIn className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">Zoom In</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
                                            <ZoomOut className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">Zoom Out</TooltipContent>
                                </Tooltip>
                                {!isWorkbench && onToggleFullscreen && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleFullscreen}>
                                                <Maximize2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left">Full Screen</TooltipContent>
                                    </Tooltip>
                                )}
                            </TooltipProvider>
                        </div>
                    </div>

                    {isDesigner && status === 'DRAFT' && !hasNewDraft && (
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50">
                            <Button 
                                size="sm" 
                                className="h-10 px-6 font-black uppercase tracking-widest gap-2 bg-primary shadow-2xl border-2 border-white rounded-full"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-4 w-4" />
                                Upload New Version
                            </Button>
                        </div>
                    )}

                    <div 
                        ref={containerRef}
                        className={cn(
                            "flex-1 overflow-hidden relative select-none",
                            canAddPin ? "cursor-crosshair" : "cursor-default",
                            (zoom > 1 || interactionMode === 'NAVIGATE') && isDragging && "cursor-grabbing",
                            (zoom > 1 || interactionMode === 'NAVIGATE') && !isDragging && "cursor-grab"
                        )}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onClick={handleCanvasClick}
                    >
                        <div 
                            className="absolute inset-0 transition-transform duration-75 ease-out origin-center"
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`
                            }}
                        >
                            <img 
                                ref={imageRef}
                                src={imageUrl} 
                                alt="Design View" 
                                className="w-full h-full object-contain pointer-events-none"
                                draggable={false}
                            />
                            
                            {showPins && pins.map((pin, index) => {
                                if (pin.version > version) return null;

                                return (
                                    <Popover 
                                        key={pin.id} 
                                        open={highlightedPinId === pin.id} 
                                        onOpenChange={(open) => {
                                            if (!open && highlightedPinId === pin.id) onPinClick(null);
                                            else if (open) onPinClick(pin.id);
                                        }}
                                    >
                                        <PopoverTrigger asChild>
                                            <button
                                                className={cn(
                                                    "pin-bubble absolute h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-xl border-2 border-white transition-all transform -translate-x-1/2 -translate-y-1/2",
                                                    PIN_COLORS[pin.status],
                                                    highlightedPinId === pin.id ? "scale-125 ring-4 ring-primary ring-offset-2 z-50" : "scale-100 z-10 hover:scale-110",
                                                    pin.status === 'resolved' && "opacity-60 grayscale-[0.5]"
                                                )}
                                                style={{ 
                                                    left: `${pin.x}%`, 
                                                    top: `${pin.y}%`,
                                                    transform: `translate(-50%, -50%) scale(${1/zoom})` 
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onPinClick(pin.id);
                                                }}
                                            >
                                                {index + 1}
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent 
                                            className="w-80 p-0 overflow-hidden shadow-2xl border-primary/20" 
                                            side="top" 
                                            sideOffset={10} 
                                            align="center"
                                            onOpenAutoFocus={(e) => e.preventDefault()}
                                        >
                                            <div className="bg-background">
                                                <div className="p-3 border-b bg-muted/20 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("h-5 w-5 rounded flex items-center justify-center text-[10px] font-black text-white", PIN_COLORS[pin.status])}>
                                                            {index + 1}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{pin.author}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">V{pin.version}</span>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-6 w-6 text-muted-foreground" 
                                                            onClick={(e) => handleClosePopover(e, pin.id)}
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="p-4 space-y-4">
                                                    {!pin.text ? (
                                                        <div className="space-y-3">
                                                            <Textarea 
                                                                autoFocus
                                                                placeholder="Enter feedback details..." 
                                                                className="min-h-[80px] text-xs font-semibold" 
                                                                value={draftText} 
                                                                onChange={(e) => setDraftText(e.target.value)}
                                                            />
                                                            <div className="flex items-center justify-between">
                                                                {!isDesigner && (
                                                                    <div className="flex items-center space-x-2">
                                                                        <Checkbox id={`pop-mistake-${pin.id}`} checked={isMistakeDraft} onCheckedChange={(val) => setIsMistakeDraft(!!val)} />
                                                                        <Label htmlFor={`pop-mistake-${pin.id}`} className="text-[9px] font-black uppercase tracking-wider text-destructive cursor-pointer">Mistake</Label>
                                                                    </div>
                                                                )}
                                                                <div className="flex gap-2 ml-auto">
                                                                    <Button size="sm" className="h-7 text-[10px] font-black uppercase px-3" onClick={() => handleSaveComment(pin.id)}>Save Feedback</Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <p className="text-xs font-semibold leading-relaxed text-foreground/90">{pin.text}</p>
                                                            {pin.replies.length > 0 && (
                                                                <div className="space-y-2 pt-2 border-t border-primary/5 max-h-[120px] overflow-y-auto custom-scrollbar">
                                                                    {pin.replies.map((reply, i) => (
                                                                        <div key={i} className="pl-3 border-l-2 border-primary/10 space-y-0.5">
                                                                            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-muted-foreground"><CornerDownRight className="h-3 w-3" /> {reply.author}</div>
                                                                            <p className="text-[10px] font-medium leading-relaxed bg-muted/40 p-1.5 rounded-md">{reply.text}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div className="flex items-center justify-between pt-2 border-t border-primary/5">
                                                                <div className="flex gap-1.5">
                                                                    {canInteractWithFeedback && (pin.status !== 'resolved') && (
                                                                        <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase px-2" onClick={(e) => { e.stopPropagation(); setReplyingPinId(pin.id); setDraftText(''); }}>Reply</Button>
                                                                    )}
                                                                </div>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => handleDeletePin(e, pin.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
