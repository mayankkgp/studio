'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import type { DesignPin, DesignPinStatus, DesignWorkflowStatus, DesignReply } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Upload, Image as ImageIcon, X, Maximize2, MessageSquare, AlertCircle, CornerDownRight, CheckCircle2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
    status: DesignWorkflowStatus;
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
    status
}: DesignCanvasProps) {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [draftText, setDraftText] = useState('');
    const [replyingPinId, setReplyingPinId] = useState<string | null>(null);
    const [isMistakeDraft, setIsMistakeDraft] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
    const handleReset = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!imageUrl || e.button !== 0 || zoom === 1) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
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
        if (!imageUrl || isDragging || (e.target as HTMLElement).closest('.pin-bubble')) return;
        
        const canAddPin = (isDesigner && status === 'DRAFT') || (!isDesigner && (status === 'INTERNAL_REVIEW' || status === 'CUSTOMER_REVIEW'));
        if (!canAddPin) return;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        onAddPin(x, y);
    };

    const handleSaveComment = (pinId: string) => {
        if (!draftText.trim()) return;

        const updatedPins = pins.map(p => {
            if (p.id === pinId) {
                return {
                    ...p,
                    text: draftText,
                    status: isMistakeDraft ? 'mistake' : 'open'
                } as DesignPin;
            }
            return p;
        });
        onUpdatePins(updatedPins);
        setDraftText('');
        setIsMistakeDraft(false);
    };

    const handleAddReply = (pinId: string) => {
        if (!draftText.trim()) return;

        const newReply: DesignReply = {
            author: isDesigner ? 'Designer' : 'Manager',
            text: draftText,
            timestamp: new Date().toISOString()
        };

        const updatedPins = pins.map(p => 
            p.id === pinId ? { ...p, replies: [...p.replies, newReply] } : p
        );
        onUpdatePins(updatedPins);
        setReplyingPinId(null);
        setDraftText('');
    };

    const handleStatusChange = (pinId: string, newStatus: DesignPinStatus) => {
        onUpdatePins(pins.map(p => p.id === pinId ? { ...p, status: newStatus } : p));
    };

    const canInteractWithFeedback = (isDesigner && status === 'DRAFT') || (!isDesigner && (status === 'INTERNAL_REVIEW' || status === 'CUSTOMER_REVIEW'));

    useEffect(() => {
        if (highlightedPinId && zoom > 1) {
            const pin = pins.find(p => p.id === highlightedPinId);
            if (pin && containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setPosition({
                    x: -(pin.x / 100 * width * zoom) + (width / 2),
                    y: -(pin.y / 100 * height * zoom) + (height / 2)
                });
            }
        }
    }, [highlightedPinId, pins, zoom]);

    if (!imageUrl) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 border-dashed border-2 rounded-xl m-4">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && onUpload) onUpload(file);
                        e.target.value = '';
                    }} 
                    accept="image/*" 
                    className="hidden" 
                />
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
    }

    const canAddPin = (isDesigner && status === 'DRAFT') || (!isDesigner && (status === 'INTERNAL_REVIEW' || status === 'CUSTOMER_REVIEW'));

    return (
        <div className="h-full flex flex-col relative group/canvas">
            <div className="absolute top-24 right-4 z-50 flex flex-col gap-2 opacity-0 group-hover/canvas:opacity-100 transition-opacity">
                <div className="bg-background/90 backdrop-blur-md border border-primary/20 rounded-lg p-1 shadow-2xl flex flex-col gap-1">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={handleZoomIn}>
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">Zoom In</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={handleZoomOut}>
                                    <ZoomOut className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">Zoom Out</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={handleReset}>
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">Reset View</TooltipContent>
                        </Tooltip>
                        {onToggleFullscreen && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={onToggleFullscreen}>
                                        <Maximize2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left">Full Screen</TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            </div>

            {canAddPin && (
                <div className="absolute bottom-4 left-4 z-50 bg-background/80 backdrop-blur-md border px-2 py-1 rounded text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground shadow-sm pointer-events-none">
                    Click design to drop a feedback pin
                </div>
            )}

            <div 
                ref={containerRef}
                className={cn(
                    "flex-1 overflow-hidden relative select-none bg-stone-100",
                    canAddPin ? "cursor-crosshair" : "cursor-default",
                    zoom > 1 && isDragging && "cursor-grabbing",
                    zoom > 1 && !isDragging && "cursor-grab"
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
                    
                    {pins.map((pin, index) => {
                        if (pin.version > version) return null;

                        return (
                            <Popover 
                                key={pin.id} 
                                open={highlightedPinId === pin.id} 
                                onOpenChange={(open) => onPinClick(open ? pin.id : null)}
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
                                <PopoverContent className="w-80 p-0 overflow-hidden shadow-2xl border-primary/20" side="top" sideOffset={10} align="center">
                                    <div className="bg-background">
                                        <div className="p-3 border-b bg-muted/20 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("h-5 w-5 rounded flex items-center justify-center text-[10px] font-black text-white", PIN_COLORS[pin.status])}>
                                                    {index + 1}
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest">{pin.author}</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">{format(new Date(pin.timestamp), 'h:mm a')} • V{pin.version}</span>
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
                                                            <Button size="sm" className="h-7 text-[10px] font-black uppercase px-3" onClick={() => handleSaveComment(pin.id)}>
                                                                Save Feedback
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="relative">
                                                        {pin.status === 'mistake' && <AlertCircle className="absolute -left-1 -top-1 h-3 w-3 text-destructive animate-pulse" />}
                                                        <p className="text-xs font-semibold leading-relaxed text-foreground/90 pl-3">{pin.text}</p>
                                                    </div>

                                                    {pin.replies.length > 0 && (
                                                        <div className="space-y-2 pt-2 border-t border-primary/5">
                                                            {pin.replies.map((reply, i) => (
                                                                <div key={i} className="pl-3 border-l-2 border-primary/10 space-y-0.5">
                                                                    <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-muted-foreground">
                                                                        <CornerDownRight className="h-3 w-3" /> {reply.author}
                                                                    </div>
                                                                    <p className="text-[10px] font-medium leading-relaxed bg-muted/40 p-1.5 rounded-md">{reply.text}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {replyingPinId === pin.id && (
                                                        <div className="mt-2 space-y-2 p-2 bg-muted/30 rounded-lg animate-in slide-in-from-bottom-2">
                                                            <Input 
                                                                autoFocus 
                                                                placeholder="Type a reply..." 
                                                                className="h-8 text-[10px] font-semibold" 
                                                                value={draftText} 
                                                                onChange={(e) => setDraftText(e.target.value)} 
                                                                onKeyDown={(e) => e.key === 'Enter' && handleAddReply(pin.id)} 
                                                            />
                                                            <div className="flex justify-end gap-1">
                                                                <Button variant="ghost" size="sm" className="h-6 text-[8px] font-black" onClick={() => setReplyingPinId(null)}>Cancel</Button>
                                                                <Button size="sm" className="h-6 text-[8px] font-black" onClick={() => handleAddReply(pin.id)}>Send</Button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between pt-2 border-t border-primary/5">
                                                        <div className="flex gap-1.5">
                                                            {canInteractWithFeedback && !replyingPinId && (pin.status !== 'resolved') && (
                                                                <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase px-2" onClick={() => { setReplyingPinId(pin.id); setDraftText(''); }}>
                                                                    Reply
                                                                </Button>
                                                            )}
                                                            
                                                            {isDesigner && status === 'DRAFT' && (pin.status === 'open' || pin.status === 'mistake') && (
                                                                <Button variant="secondary" size="sm" className="h-7 text-[9px] font-black uppercase px-2 bg-amber-100 text-amber-800 hover:bg-amber-200" onClick={() => handleStatusChange(pin.id, 'fixed')}>
                                                                    Mark Fixed
                                                                </Button>
                                                            )}

                                                            {!isDesigner && (status === 'INTERNAL_REVIEW' || status === 'CUSTOMER_REVIEW') && (
                                                                <>
                                                                    {(pin.status !== 'resolved') && (
                                                                        <Button size="sm" className="h-7 text-[9px] font-black uppercase px-2 bg-green-600 text-white hover:bg-green-700" onClick={() => handleStatusChange(pin.id, 'resolved')}>
                                                                            Resolve
                                                                        </Button>
                                                                    )}
                                                                    {pin.status === 'fixed' && (
                                                                        <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase px-2 text-destructive hover:bg-destructive/5" onClick={() => handleStatusChange(pin.id, 'open')}>
                                                                            Reject Fix
                                                                        </Button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                        {pin.status === 'resolved' && (
                                                            <div className="flex items-center gap-1 text-[9px] font-black text-green-600">
                                                                <CheckCircle2 className="h-3.5 w-3.5" /> RESOLVED
                                                            </div>
                                                        )}
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
        </div>
    );
}
