'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import type { DesignPin, DesignPinStatus, DesignWorkflowStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Upload, Image as ImageIcon, X, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DesignCanvasProps {
    imageUrl: string | null;
    pins: DesignPin[];
    highlightedPinId: string | null;
    onAddPin: (x: number, y: number) => void;
    onPinClick: (id: string) => void;
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onUpload) {
            onUpload(file);
            e.target.value = '';
        }
    };

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

    const showUploadArea = isDesigner && (status === 'DRAFT' || status === 'PENDING') && !imageUrl;

    if (!imageUrl) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 border-dashed border-2 rounded-xl m-4">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                />
                {showUploadArea ? (
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
                        <p className="text-sm font-medium text-balance">
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
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
            />
            
            <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 opacity-0 group-hover/canvas:opacity-100 transition-opacity">
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
                    
                    {pins.map((pin, index) => (
                        <button
                            key={pin.id}
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
                    ))}
                </div>
            </div>
        </div>
    );
}
