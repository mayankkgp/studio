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
    AlertTriangle,
    CornerDownRight,
    Lock as LockIcon,
    Unlock as UnlockIcon,
    Scale as ScaleIcon,
    User,
    Check,
    MoreHorizontal,
    Reply
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MAX_ZOOM = 4.0;

interface DesignCanvasProps {
    imageUrl: string | null;
    comparisonImageUrl?: string | null;
    pins: DesignPin[];
    highlightedPinId: string | null;
    selectedPinId: string | null;
    onAddPin: (x: number, y: number, componentId?: string, zoom?: number) => void;
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
    showComparison: boolean;
    onToggleComparison: (val: boolean) => void;
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
    allComponents = [],
    showComparison,
    onToggleComparison
}: DesignCanvasProps) {
    const [zoom, setZoom] = useState(1.0);
    const [minFitZoom, setMinFitZoom] = useState(0.01);
    const [showPins, setShowPins] = useState(true);
    const [activeTool, setActiveTool] = useState<ToolMode>('comment');
    const [replyExpandedPinId, setReplyExpandedPinId] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    
    const [sliderPosition, setSliderPosition] = useState(50);
    const [sliderVerticalPosition, setSliderVerticalPosition] = useState(50);
    const [isDraggingSlider, setIsDraggingSlider] = useState(false);

    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isMiddleMouseDown, setIsMiddleMouseDown] = useState(false);
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const dragStartMousePos = useRef<{ x: number; y: number } | null>(null);
    const initialPanOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    
    const lastInitializedImageUrl = useRef<string | null>(null);
    const lastInitializedMode = useRef<boolean>(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isLatest = version === currentVersion;
    
    const isFeedbackLocked = useMemo(() => {
        if (!isLatest || isSpacePressed || isMiddleMouseDown || isDraggingSlider) return true;
        if (!isLightTable && !imageUrl) return true;
        if (isDesigner) return status !== 'DRAFT' || hasNewDraft;
        return status === 'APPROVED' || status === 'INTERNAL_REVIEW' || status === 'CUSTOMER_REVIEW';
    }, [imageUrl, isLatest, isDesigner, status, hasNewDraft, isSpacePressed, isMiddleMouseDown, isDraggingSlider, isLightTable]);

    const canDropPin = !isFeedbackLocked && activeTool === 'comment';
    
    const [replyText, setReplyText] = useState('');
    
    const activePin = useMemo(() => pins.find(p => p.id === selectedPinId), [pins, selectedPinId]);
    const effectiveShowPopovers = isZenMode ? true : showPopovers;

    const getConstrainedPan = useCallback((offset: { x: number; y: number }) => {
        if (!containerRef.current) return offset;
        const rect = containerRef.current.getBoundingClientRect();
        const limitX = rect.width / 2;
        const limitY = rect.height / 2;

        if (isLightTable) {
            const spreadEl = containerRef.current.querySelector('.flex-row');
            const spreadWidth = spreadEl ? spreadEl.getBoundingClientRect().width : 0;
            const spreadLimitX = (rect.width / 2) + (spreadWidth / 2) - 100;
            return {
                x: Math.max(-spreadLimitX, Math.min(offset.x, spreadLimitX)),
                y: Math.max(-limitY, Math.min(offset.y, limitY))
            };
        }

        return {
            x: Math.max(-limitX, Math.min(offset.x, limitX)),
            y: Math.max(-limitY, Math.min(offset.y, limitY))
        };
    }, [isLightTable]);

    const calculateFitZoom = useCallback(() => {
        if (!containerRef.current) return 1.0;
        const viewportRect = containerRef.current.getBoundingClientRect();
        const contentEl = isLightTable 
            ? containerRef.current.querySelector('.flex-row') 
            : containerRef.current.querySelector('.group\\/comp-container');

        if (!contentEl) return 1.0;

        const rect = contentEl.getBoundingClientRect();
        const style = window.getComputedStyle(contentEl);
        const matrix = new DOMMatrix(style.transform);
        const currentScale = matrix.a || 1;

        const unscaledCw = rect.width / currentScale;
        const unscaledCh = rect.height / currentScale;

        if (unscaledCw === 0 || unscaledCh === 0) return 1.0;

        const scaleX = viewportRect.width / unscaledCw;
        const scaleY = viewportRect.height / unscaledCh;
        
        return Math.min(scaleX, scaleY);
    }, [isLightTable]);

    const handleReset = useCallback(() => {
        const fitScale = calculateFitZoom();
        const resetScale = fitScale * 0.95;
        setIsAnimating(true);
        setZoom(resetScale);
        setMinFitZoom(resetScale);
        setPanOffset({ x: 0, y: 0 });
        setTimeout(() => setIsAnimating(false), 500);
    }, [calculateFitZoom]);

    useEffect(() => {
        const currentId = isLightTable ? 'light-table' : imageUrl;
        if (currentId !== lastInitializedImageUrl.current || isLightTable !== lastInitializedMode.current) {
            const timer = setTimeout(handleReset, 150);
            lastInitializedImageUrl.current = currentId;
            lastInitializedMode.current = isLightTable;
            return () => clearTimeout(timer);
        }
    }, [imageUrl, isLightTable, handleReset]);

    useEffect(() => {
        const updateThreshold = () => {
            const fit = calculateFitZoom();
            const resetScale = fit * 0.95;
            setMinFitZoom(resetScale);
            setZoom(prev => Math.max(prev, resetScale));
        };
        window.addEventListener('resize', updateThreshold);
        return () => window.removeEventListener('resize', updateThreshold);
    }, [calculateFitZoom]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (!imageUrl && !isLightTable) return;
            e.preventDefault();
            setIsAnimating(false);

            if (e.ctrlKey || e.metaKey) {
                setZoom(prev => {
                    const factor = e.deltaY > 0 ? 0.9 : 1.1;
                    const next = prev * factor;
                    return Math.max(minFitZoom, Math.min(next, MAX_ZOOM));
                });
            } else {
                setPanOffset(prev => getConstrainedPan({
                    x: prev.x - e.deltaX,
                    y: prev.y - e.deltaY
                }));
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [imageUrl, isLightTable, zoom, getConstrainedPan, minFitZoom]);

    // POV Centering Logic
    useEffect(() => {
        if (!selectedPinId || isDraggingCanvas || isDraggingSlider || isLightTable) return;
        
        const pin = pins.find(p => p.id === selectedPinId);
        // Do not auto-center on newly placed draft pins to avoid jumping upon creation
        if (!pin || pin.isDraft) return;

        const contentEl = containerRef.current?.querySelector('.group\\/comp-container') as HTMLElement;
        if (!contentEl) return;

        const rect = contentEl.getBoundingClientRect();
        const style = window.getComputedStyle(contentEl);
        const matrix = new DOMMatrix(style.transform);
        const currentScale = matrix.a || 1;
        const cw = rect.width / currentScale;
        const ch = rect.height / currentScale;

        const targetZoom = pin.zoom || zoom;
        const px = (pin.x / 100) * cw;
        const py = (pin.y / 100) * ch;

        const newPanX = -(px - cw / 2) * targetZoom;
        const newPanY = -(py - ch / 2) * targetZoom;

        setIsAnimating(true);
        setZoom(targetZoom);
        setPanOffset(getConstrainedPan({ x: newPanX, y: newPanY }));
        
        const timer = setTimeout(() => setIsAnimating(false), 500);
        return () => clearTimeout(timer);
    }, [selectedPinId, pins, getConstrainedPan, isLightTable]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isTyping = (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA';
            if (e.code === 'Space' && !isSpacePressed && !isTyping) { e.preventDefault(); setIsSpacePressed(true); }
            if (e.key === 'Escape') onPinClick(null);
            if (!isTyping) {
                if (e.key.toLowerCase() === 'r') handleReset();
                if (!isFeedbackLocked) {
                    if (e.key.toLowerCase() === 'c') setActiveTool('comment');
                    if (e.key.toLowerCase() === 'v') setActiveTool('pointer');
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') { setIsSpacePressed(false); setIsDraggingCanvas(false); } };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, [isSpacePressed, onPinClick, isFeedbackLocked, handleReset]);

    const adjustTextareaHeight = (element: HTMLTextAreaElement | null) => {
        if (!element) return;
        element.style.height = 'auto';
        const newHeight = Math.min(element.scrollHeight, 120);
        element.style.height = `${newHeight}px`;
    };

    useEffect(() => {
        if (selectedPinId && activePin) {
            setReplyText('');
            setReplyExpandedPinId(null);
            if (effectiveShowPopovers) {
                setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.focus();
                        adjustTextareaHeight(textareaRef.current);
                    }
                }, 150);
            }
        }
    }, [selectedPinId, activePin, effectiveShowPopovers]);

    const handleZoomIn = () => { setIsAnimating(false); setZoom(prev => Math.min(prev + 0.25, MAX_ZOOM)); };
    const handleZoomOut = () => { setIsAnimating(false); setZoom(prev => Math.max(prev - 0.25, minFitZoom)); };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (isDraggingSlider) return;
        if (isSpacePressed || e.button === 1) {
            setIsAnimating(false);
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
            setPanOffset(getConstrainedPan({
                x: initialPanOffset.current.x + dx,
                y: initialPanOffset.current.y + dy
            }));
        }
    };

    const handleCanvasMouseUp = () => { setIsDraggingCanvas(false); setIsMiddleMouseDown(false); };

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (isSpacePressed || isMiddleMouseDown || isDraggingSlider) return;
        if ((e.target as HTMLElement).closest('.pin-bubble') || (e.target as HTMLElement).closest('.fixed-comment-box')) return;
        onPinClick(null);
    };

    const handleSaveComment = () => {
        if (!selectedPinId || !activePin) return;
        const trimmed = draftText.trim();
        if (!trimmed) { onUpdatePins(pins.filter(p => p.id !== selectedPinId)); onPinClick(null); return; }
        onUpdatePins(pins.map(p => p.id === selectedPinId ? { ...p, text: trimmed, status: 'open', isDraft: false } as DesignPin : p));
        onPinClick(null);
    };

    const handleStatusUpdate = (pinId: string, newStatus: DesignPinStatus) => { 
        onUpdatePins(pins.map(p => p.id === pinId ? { ...p, status: newStatus } : p)); 
    };

    const handleMistakeToggle = (pinId: string) => { 
        const pin = pins.find(p => p.id === pinId);
        if (pin) onUpdatePins(pins.map(p => p.id === pinId ? { ...p, isMistake: !p.isMistake } : p)); 
    };
    
    const handleAddReply = (pinId: string) => {
        if (!replyText.trim()) return;
        const newReply: DesignReply = { author: isDesigner ? 'Designer' : 'Manager', text: replyText.trim(), timestamp: new Date().toISOString() };
        onUpdatePins(pins.map(p => p.id === pinId ? { ...p, replies: [...(p.replies || []), newReply] } : p));
        setReplyText('');
        setReplyExpandedPinId(null);
    };
    
    const handleDeletePin = (e: React.MouseEvent, pinId: string) => { 
        e.stopPropagation(); 
        onUpdatePins(pins.filter(p => p.id !== pinId)); 
        onPinClick(null); 
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingSlider) {
                const compBox = document.querySelector('.group\\/comp-container');
                if (compBox) {
                    const rect = compBox.getBoundingClientRect();
                    setSliderPosition(Math.max(0, Math.min((e.clientX - rect.left) / rect.width * 100, 100)));
                    setSliderVerticalPosition(Math.max(0, Math.min((e.clientY - rect.top) / rect.height * 100, 100)));
                }
            }
        };
        const handleMouseUp = () => setIsDraggingSlider(false);
        if (isDraggingSlider) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
        return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }, [isDraggingSlider]);

    const getQuadrantStyle = (x: number, y: number) => {
        const horizontal = x < 50 ? 'left-[calc(100%+12px)]' : 'right-[calc(100%+12px)]';
        const vertical = y < 50 ? 'top-0' : 'bottom-0';
        return `${horizontal} ${vertical}`;
    };

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    const renderPin = (pin: DesignPin) => {
        const snippet = pin.text ? pin.text.split(' ').slice(0, 5).join(' ') + (pin.text.split(' ').length > 5 ? '...' : '') : 'Empty comment';
        return (
            <TooltipProvider key={pin.id}>
                <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                        <div
                            role="button"
                            tabIndex={0}
                            className={cn(
                                "pin-bubble absolute transition-all pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 group outline-none",
                                "h-8 w-8 rounded-full border-2 border-white shadow-xl bg-background/80 backdrop-blur-sm",
                                pin.status === 'resolved' ? "opacity-40 grayscale-[0.5]" : "opacity-80 hover:opacity-100",
                                selectedPinId === pin.id ? "ring-4 ring-primary scale-110 opacity-100 z-50" : "z-10",
                                pin.isMistake && "border-destructive ring-4 ring-destructive/20"
                            )}
                            style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: `translate(-50%, -50%) scale(${1/zoom})` }}
                            onClick={(e) => { e.stopPropagation(); onPinClick(pin.id); }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onPinClick(pin.id);
                                }
                            }}
                        >
                            <Avatar className="h-full w-full pointer-events-none">
                                <AvatarFallback className={cn("text-[9px] font-black", pin.author === 'Designer' ? "bg-purple-600 text-white" : "bg-blue-600 text-white")}>
                                    {getInitials(pin.author)}
                                </AvatarFallback>
                            </Avatar>
                            
                            {selectedPinId === pin.id && effectiveShowPopovers && (
                                <div className={cn(
                                    "fixed-comment-box absolute z-[100] w-64 bg-stone-900 border rounded-xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white text-left animate-in zoom-in-95 duration-200 cursor-default",
                                    pin.isMistake ? "border-destructive border-2" : "border-white/10",
                                    getQuadrantStyle(pin.x, pin.y)
                                )} style={{ transform: `scale(${1})` }} onClick={e => e.stopPropagation()}>
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Avatar className="h-5 w-5 border border-white/20 shrink-0">
                                                    <AvatarFallback className="text-[8px] font-black bg-white/10">{getInitials(pin.author)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-[10px] font-black uppercase tracking-wider opacity-70 truncate">{pin.author}</span>
                                                {pin.isMistake && <Badge variant="destructive" className="h-3.5 text-[7px] font-black px-1 uppercase shrink-0">MISTAKE</Badge>}
                                            </div>
                                            
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                {pin.isDraft && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button 
                                                                className={cn(
                                                                    "h-6 w-6 rounded-md flex items-center justify-center transition-all",
                                                                    pin.isMistake ? "text-destructive bg-destructive/10" : "text-white/40 hover:bg-white/10"
                                                                )}
                                                                onClick={(e) => { e.stopPropagation(); handleMistakeToggle(pin.id); }}
                                                            >
                                                                <AlertTriangle className={cn("h-3.5 w-3.5", pin.isMistake && "fill-destructive")} />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="bg-stone-800 text-white border-white/10 text-[10px] font-black uppercase tracking-widest">
                                                            {pin.isMistake ? "Mark as Comment" : "Mark as Mistake"}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}

                                                {!pin.isDraft && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className={cn(
                                                            "h-6 w-6 rounded-md hover:bg-white/10 text-white/40 transition-colors",
                                                            replyExpandedPinId === pin.id && "text-primary bg-primary/10 opacity-100"
                                                        )}
                                                        onClick={(e) => { e.stopPropagation(); setReplyExpandedPinId(replyExpandedPinId === pin.id ? null : pin.id); }}
                                                    >
                                                        <Reply className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}

                                                {!isDesigner && pin.status !== 'resolved' && !pin.isDraft && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 rounded-md hover:bg-green-500/20 hover:text-green-400 text-white/40 transition-colors"
                                                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(pin.id, 'resolved'); onPinClick(null); }}
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-white/10 text-white/40">
                                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-36 bg-stone-900 border-white/10 text-white p-1">
                                                        {!isDesigner && !pin.isDraft && (
                                                            <DropdownMenuItem 
                                                                onClick={() => handleMistakeToggle(pin.id)}
                                                                className="text-[10px] font-black uppercase tracking-widest focus:bg-white/10 focus:text-white"
                                                            >
                                                                <AlertTriangle className="h-3 w-3 mr-2" />
                                                                {pin.isMistake ? 'Unmark Mistake' : 'Mark Mistake'}
                                                            </DropdownMenuItem>
                                                        )}
                                                        {pin.status === 'resolved' && !isDesigner && (
                                                            <DropdownMenuItem 
                                                                onClick={() => handleStatusUpdate(pin.id, 'open')}
                                                                className="text-[10px] font-black uppercase tracking-widest focus:bg-white/10 focus:text-white"
                                                            >
                                                                <RotateCcw className="h-3 w-3 mr-2" /> Re-open
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem 
                                                            onClick={(e) => handleDeletePin(e as any, pin.id)}
                                                            className="text-[10px] font-black uppercase tracking-widest text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                        >
                                                            <Trash2 className="h-3 w-3 mr-2" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>

                                        {pin.isDraft ? (
                                            <div className="relative group/draft">
                                                <Textarea 
                                                    ref={textareaRef}
                                                    placeholder="Add feedback..."
                                                    className={cn(
                                                        "w-full bg-stone-800 border-white/10 text-xs py-2 pr-8 min-h-[32px] max-h-[120px] resize-none overflow-y-auto rounded-lg leading-tight transition-all",
                                                        pin.isMistake ? "focus:border-destructive/50 ring-destructive/20 focus:ring-4" : "focus:border-primary/50"
                                                    )}
                                                    value={draftText}
                                                    onInput={e => adjustTextareaHeight(e.currentTarget)}
                                                    onChange={e => onDraftTextChange(e.target.value)}
                                                    onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSaveComment(); }}
                                                />
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost"
                                                    disabled={!draftText.trim()}
                                                    className={cn(
                                                        "absolute right-1 bottom-1 h-6 w-6 transition-all",
                                                        draftText.trim() ? "text-primary opacity-100" : "text-white/20 opacity-0 pointer-events-none"
                                                    )}
                                                    onClick={handleSaveComment}
                                                >
                                                    <Send className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2.5">
                                                <button 
                                                    className="w-full text-left focus:outline-none group/comment-body"
                                                    onClick={() => setReplyExpandedPinId(pin.id)}
                                                >
                                                    <p className="text-[11px] font-medium leading-relaxed opacity-90 group-hover/comment-body:opacity-100 transition-opacity">
                                                        {pin.text}
                                                    </p>
                                                </button>
                                                
                                                {pin.replies && pin.replies.length > 0 && (
                                                    <div className="space-y-2 mt-1 max-h-[120px] overflow-y-auto custom-scrollbar-mini pr-1">
                                                        {pin.replies.map((r, i) => (
                                                            <div key={i} className="pl-2.5 border-l border-white/10 space-y-0.5">
                                                                <div className="flex items-center gap-1.5 text-[8px] font-black uppercase opacity-50">
                                                                    <CornerDownRight className="h-2 w-2" /> {r.author}
                                                                </div>
                                                                <p className="text-[10px] leading-tight opacity-80">{r.text}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {replyExpandedPinId === pin.id && (
                                                    <div className="relative group/reply pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        <Textarea 
                                                            placeholder="Reply..."
                                                            className="w-full bg-stone-800 border-white/5 focus:border-primary/30 text-[10px] py-1.5 pr-8 min-h-[28px] max-h-[120px] resize-none overflow-y-auto rounded-md leading-tight"
                                                            value={replyText}
                                                            onInput={e => adjustTextareaHeight(e.currentTarget)}
                                                            onChange={e => setReplyText(e.target.value)}
                                                            onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleAddReply(pin.id); }}
                                                        />
                                                        <Button 
                                                            size="icon" 
                                                            variant="ghost"
                                                            disabled={!replyText.trim()}
                                                            className={cn(
                                                                "absolute right-1 bottom-1 h-5 w-5 transition-all",
                                                                replyText.trim() ? "text-primary opacity-100" : "text-white/20 opacity-0 pointer-events-none"
                                                            )}
                                                            onClick={() => handleAddReply(pin.id)}
                                                        >
                                                            <Send className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </TooltipTrigger>
                    {!selectedPinId && (
                        <TooltipContent side="top" className="bg-black/80 text-white border-white/10 px-2 py-1">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{pin.author}</span>
                                <span className="text-[10px] font-bold">{snippet}</span>
                            </div>
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
        );
    };

    return (
        <div className="h-full flex flex-col relative group/canvas bg-stone-950 overflow-hidden">
            <input type="file" ref={fileInputRef} onChange={e => { const f = e.target.files?.[0]; if (f && onUpload) onUpload(f); e.target.value = ''; }} accept="image/*" className="hidden" />

            {!imageUrl && !isLightTable && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5 border-dashed border-2 border-white/10 rounded-xl m-4">
                    <div className="text-center space-y-4 text-white">
                        <div className="h-16 w-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto shadow-xl"><Upload className="h-8 w-8" /></div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-base">{isLatestDraftLocked ? "Draft in Progress" : "No Proof Uploaded"}</h4>
                            <p className="text-[11px] text-white/60 font-medium">{isDesigner ? "Upload your first version to start receiving feedback." : "The designer hasn't shared a version for review yet."}</p>
                        </div>
                        {isDesigner && !isLatestDraftLocked && <Button onClick={() => fileInputRef.current?.click()} size="sm" className="font-black uppercase tracking-widest h-8 text-[10px]">Select Design File</Button>}
                    </div>
                </div>
            )}

            {(imageUrl || isLightTable) && (
                <>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 z-[200] flex flex-col p-1 bg-background/90 backdrop-blur-xl border-y border-r border-primary/20 rounded-r-xl shadow-2xl overflow-hidden">
                        <TooltipProvider>
                            <div className="flex flex-col items-center gap-1 p-1">
                                {!isFeedbackLocked ? (
                                    <>
                                        <Tooltip><TooltipTrigger asChild><Button variant={activeTool === 'pointer' ? 'default' : 'ghost'} size="icon" className="h-9 w-9 rounded-md" onClick={() => setActiveTool('pointer')}><MousePointer2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right">Select Tool (V)</TooltipContent></Tooltip>
                                        <Tooltip><TooltipTrigger asChild><Button variant={activeTool === 'comment' ? 'default' : 'ghost'} size="icon" className="h-9 w-9 rounded-md" onClick={() => setActiveTool('comment')}><MessageSquarePlus className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right">Comment Tool (C)</TooltipContent></Tooltip>
                                    </>
                                ) : (
                                    <Tooltip><TooltipTrigger asChild><div className="h-9 w-9 flex items-center justify-center opacity-30"><LockIcon className="h-4 w-4" /></div></TooltipTrigger><TooltipContent side="right">Feedback Locked</TooltipContent></Tooltip>
                                )}
                            </div>
                            <div className="w-6 h-px bg-primary/10 mx-auto my-1" />
                            <div className="flex flex-col items-center gap-1 p-1">
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-md", !showPins && "text-primary")} onClick={() => setShowPins(!showPins)}>{showPins ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</Button></TooltipTrigger><TooltipContent side="right">Toggle Pins</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-md", !effectiveShowPopovers && "text-primary")} onClick={onTogglePopovers}>{effectiveShowPopovers ? <MessageSquare className="h-4 w-4" /> : <MessageSquareOff className="h-4 w-4" />}</Button></TooltipTrigger><TooltipContent side="right">Toggle Popovers</TooltipContent></Tooltip>
                                {onToggleLightTable && <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-md", isLightTable && "bg-primary/10 text-primary")} onClick={onToggleLightTable}><LayoutGrid className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right">Light Table</TooltipContent></Tooltip>}
                                {!isLightTable && comparisonImageUrl && <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-md", showComparison && "bg-primary/10 text-primary")} onClick={() => onToggleComparison(!showComparison)}><Layers className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right">Compare Versions</TooltipContent></Tooltip>}
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-md", isZenMode && "text-primary")} onClick={onToggleZen}>{isZenMode ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}</Button></TooltipTrigger><TooltipContent side="right">Zen Mode (F)</TooltipContent></Tooltip>
                            </div>
                            <div className="w-6 h-px bg-primary/10 mx-auto my-1" />
                            <div className="flex flex-col items-center gap-1 p-1">
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 rounded-md" onClick={handleReset}><RefreshCcw className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right">Fit to Screen (R)</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 rounded-md" onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right">Zoom In</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 rounded-md" onClick={handleZoomOut} disabled={zoom <= minFitZoom}><ZoomOut className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right">Zoom Out</TooltipContent></Tooltip>
                            </div>
                        </TooltipProvider>
                    </div>

                    <div 
                        ref={containerRef}
                        className={cn("flex-1 overflow-hidden relative select-none", isSpacePressed || isMiddleMouseDown ? (isDraggingCanvas ? "cursor-grabbing" : "cursor-grab") : (canDropPin ? "cursor-crosshair" : "cursor-default"))}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
                        onClick={handleCanvasClick}
                    >
                        <div 
                            className={cn(
                                "absolute inset-0 origin-center pointer-events-none transition-transform",
                                isAnimating ? "duration-500 ease-in-out" : "duration-75 ease-out"
                            )} 
                            style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})` }}
                        >
                            {isLightTable ? (
                                <div className="flex flex-row items-center gap-32 px-64 h-[80vh]">
                                    {allComponents.map(comp => {
                                        const latestV = comp.versions?.[comp.versions.length - 1];
                                        return (
                                            <div key={comp.id} className="flex flex-col items-center shrink-0">
                                                <div className="h-12 flex flex-col items-center justify-center mb-4 shrink-0">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{comp.name}</span>
                                                    <span className="text-[8px] font-bold text-white/20 uppercase mt-0.5">V{comp.versions.length}</span>
                                                </div>
                                                <div className="relative h-[80vh] w-fit pointer-events-auto group/comp-container shadow-[0_30px_100px_rgba(0,0,0,0.5)]" onClick={e => { if (!canDropPin) return; e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); onAddPin((e.clientX - rect.left) / rect.width * 100, (e.clientY - rect.top) / rect.height * 100, comp.id, zoom); }}>
                                                    {latestV?.imageUrl && <img src={latestV.imageUrl} alt={comp.name} className="h-full w-auto object-contain" draggable={false} />}
                                                    {showPins && comp.pins.map(pin => renderPin(pin))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="relative h-[80vh] w-fit pointer-events-auto group/comp-container shadow-[0_30px_100px_rgba(0,0,0,0.5)]" onClick={e => { if (!canDropPin) return; e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); onAddPin((e.clientX - rect.left) / rect.width * 100, (e.clientY - rect.top) / rect.height * 100, undefined, zoom); }}>
                                        {showComparison && comparisonImageUrl && <img src={comparisonImageUrl} alt="Old Version" className="absolute inset-0 w-full h-full object-contain" draggable={false} />}
                                        {imageUrl && <img src={imageUrl} alt="Current Proof" className="h-full w-auto object-contain" style={showComparison ? { clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` } : undefined} draggable={false} />}
                                        {showComparison && (
                                            <div className="absolute inset-0 z-[60] pointer-events-none overflow-hidden">
                                                <div className="absolute inset-y-0 w-8 -ml-4 pointer-events-auto cursor-ew-resize" style={{ left: `${sliderPosition}%` }} onMouseDown={e => { e.preventDefault(); setIsDraggingSlider(true); }} onClick={e => e.stopPropagation()}>
                                                    <div className="absolute inset-y-0 left-1/2 w-px bg-blue-600" />
                                                    <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xl border-4 border-background" style={{ top: `${sliderVerticalPosition}%` }}><RefreshCcw className="h-5 w-5" /></div>
                                                    <div className="absolute top-6 left-12 bg-black text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded whitespace-nowrap border border-white/10 shadow-xl">After</div>
                                                    <div className="absolute top-6 right-12 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border border-white/10 whitespace-nowrap shadow-xl">Before</div>
                                                </div>
                                            </div>
                                        )}
                                        {showPins && pins.map(pin => renderPin(pin))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
            <style jsx global>{`
                .custom-scrollbar-mini::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar-mini::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-mini::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar-mini::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
}