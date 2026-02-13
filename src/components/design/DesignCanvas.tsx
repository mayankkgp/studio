'use client';

import * as React from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';
import type { DesignPin, DesignPinStatus, DesignWorkflowStatus, DesignReply } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { 
    ZoomIn, 
    ZoomOut, 
    Upload, 
    Image as ImageIcon, 
    X, 
    Maximize2, 
    Trash2,
    Eye,
    EyeOff,
    Scaling,
    CornerDownRight,
    CheckCircle2,
    AlertCircle,
    Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const PIN_COLORS: Record<DesignPinStatus, string> = {
    open: 'bg-blue-600',
    mistake: 'bg-destructive',
    fixed: 'bg-amber-500',
    resolved: 'bg-green-600'
};

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
    isWorkbench = false
}: DesignCanvasProps) {
    const [zoom, setZoom] = useState(1);
    const [showPins, setShowPins] = useState(true);
    
    const canInteract = !!imageUrl;
    
    const [draftText, setDraftText] = useState('');
    const [replyText, setReplyText] = useState('');
    const [isReplyMode, setIsReplyMode] = useState(false);
    const [isMistakeDraft, setIsMistakeDraft] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const prevHighlightedId = useRef<string | null>(null);

    const activePin = useMemo(() => pins.find(p => p.id === highlightedPinId), [pins, highlightedPinId]);
    const activePinNumber = useMemo(() => pins.findIndex(p => p.id === highlightedPinId) + 1, [pins, highlightedPinId]);

    // Auto-focus the comment box when a pin is selected
    useEffect(() => {
        if (highlightedPinId) {
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 100);
        }
    }, [highlightedPinId]);

    useEffect(() => {
        if (highlightedPinId && highlightedPinId !== prevHighlightedId.current) {
            setDraftText('');
            setReplyText('');
            setIsReplyMode(false);
            if (activePin) {
                setIsMistakeDraft(activePin.status === 'mistake');
                setDraftText(activePin.text || '');
            }
            prevHighlightedId.current = highlightedPinId;
        } else if (!highlightedPinId) {
            prevHighlightedId.current = null;
        }
    }, [highlightedPinId, activePin]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
    const handleReset = () => setZoom(1);

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (!imageUrl) return;
        
        const target = e.target as HTMLElement;
        if (target.closest('.pin-bubble') || target.closest('button') || target.closest('.fixed-comment-box')) return;
        
        if (!canInteract) {
            if (highlightedPinId) onPinClick(null);
            return;
        }

        e.stopPropagation();
        e.preventDefault();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        onAddPin(x, y);
    };

    const handleSaveComment = () => {
        if (!highlightedPinId) return;
        const updatedPins = pins.map(p => {
            if (p.id === highlightedPinId) {
                return {
                    ...p,
                    text: draftText,
                    status: isMistakeDraft ? 'mistake' : (p.status === 'resolved' ? 'resolved' : 'open'),
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

    return (
        <div className="h-full flex flex-col relative group/canvas bg-stone-100 overflow-hidden">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
            />

            {!imageUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 border-dashed border-2 rounded-xl m-4">
                    <div className="text-center space-y-4">
                        <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                            <Upload className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold">Design not uploaded</h4>
                            <p className="text-xs text-muted-foreground">Upload the first draft to begin feedback.</p>
                        </div>
                        <Button onClick={() => fileInputRef.current?.click()} size="sm">Select Design File</Button>
                    </div>
                </div>
            )}

            {imageUrl && (
                <>
                    {/* Toolbar */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1.5 bg-background/90 backdrop-blur-xl border border-primary/20 rounded-full shadow-2xl scale-110">
                        <TooltipProvider>
                            <div className="flex items-center px-3 gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Feedback Mode</span>
                            </div>
                            <div className="w-px h-4 bg-muted-foreground/20 mx-1" />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={handleReset}><Scaling className="h-4 w-4" /></Button>
                                </TooltipTrigger>
                                <TooltipContent>Fit to Screen</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-full", !showPins && "text-primary")} onClick={() => setShowPins(!showPins)}>
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
                                {!isWorkbench && onToggleFullscreen && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleFullscreen}><Maximize2 className="h-4 w-4" /></Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left">Full Screen</TooltipContent>
                                    </Tooltip>
                                )}
                            </TooltipProvider>
                        </div>
                    </div>

                    {/* Canvas Main Area */}
                    <div 
                        ref={containerRef}
                        className={cn(
                            "flex-1 overflow-hidden relative select-none",
                            canInteract ? "cursor-crosshair" : "cursor-default"
                        )}
                        onClick={handleCanvasClick}
                    >
                        <div 
                            className="absolute inset-0 transition-transform duration-75 ease-out origin-center pointer-events-none"
                            style={{ transform: `scale(${zoom})` }}
                        >
                            <img 
                                ref={imageRef} 
                                src={imageUrl} 
                                alt="Design View" 
                                className="w-full h-full object-contain" 
                                draggable={false} 
                            />
                            
                            {showPins && pins.map((pin, index) => {
                                if (pin.version > version) return null;
                                return (
                                    <button
                                        key={pin.id}
                                        className={cn(
                                            "pin-bubble absolute h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-xl border-2 border-white transition-all transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto",
                                            PIN_COLORS[pin.status],
                                            highlightedPinId === pin.id ? "scale-125 ring-4 ring-primary ring-offset-2 z-50" : "scale-100 z-10 hover:scale-110",
                                            pin.status === 'resolved' && "opacity-60 grayscale-[0.5]"
                                        )}
                                        style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: `translate(-50%, -50%) scale(${1/zoom})` }}
                                        onClick={(e) => { e.stopPropagation(); onPinClick(pin.id); }}
                                    >
                                        {index + 1}
                                    </button>
                                );
                            })}
                        </div>

                        {/* FIXED POSITIONED COMMENT BOX */}
                        {highlightedPinId && activePin && (
                            <div className="absolute bottom-6 right-6 z-[100] w-80 animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto fixed-comment-box">
                                <div className="bg-background rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 border-primary/20 overflow-hidden">
                                    <div className="p-3 border-b bg-muted/20 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("h-5 w-5 rounded flex items-center justify-center text-[10px] font-black text-white", PIN_COLORS[activePin.status])}>
                                                {activePinNumber}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">{activePin.author}</span>
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
                                                    onChange={(e) => setDraftText(e.target.value)} 
                                                />
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox id={`fixed-mistake-${activePin.id}`} checked={isMistakeDraft} onCheckedChange={(val) => setIsMistakeDraft(!!val)} />
                                                        <Label htmlFor={`fixed-mistake-${activePin.id}`} className="text-[9px] font-black uppercase tracking-wider text-destructive cursor-pointer">Mistake</Label>
                                                    </div>
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
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="sm" className="h-6 text-[9px] font-black uppercase" onClick={() => setIsReplyMode(false)}>Cancel</Button>
                                                            <Button size="sm" className="h-6 text-[9px] font-black uppercase" onClick={() => handleAddReply(activePin.id)}>Reply</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-primary/5">
                                                        <Button variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase px-2" onClick={() => setIsReplyMode(true)}><Send className="h-3 w-3 mr-1" /> Reply</Button>
                                                        {(activePin.status === 'open' || activePin.status === 'mistake') && (
                                                            <Button variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase px-2 border-amber-500 text-amber-600 hover:bg-amber-50" onClick={() => handleStatusUpdate(activePin.id, 'fixed')}><CheckCircle2 className="h-3 w-3 mr-1" /> Fix</Button>
                                                        )}
                                                        {activePin.status === 'fixed' && (
                                                            <Button variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase px-2 border-green-600 text-green-600 hover:bg-green-50" onClick={() => handleStatusUpdate(activePin.id, 'resolved')}><CheckCircle2 className="h-3 w-3 mr-1" /> Resolve</Button>
                                                        )}
                                                        {activePin.status === 'open' && (
                                                            <Button variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase px-2 border-destructive text-destructive" onClick={() => handleStatusUpdate(activePin.id, 'mistake')}><AlertCircle className="h-3 w-3 mr-1" /> Mistake</Button>
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
