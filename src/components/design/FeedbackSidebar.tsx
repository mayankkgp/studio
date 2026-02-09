'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import type { DesignPin, DesignPinStatus, DesignReply, DesignWorkflowStatus, DesignVersion } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
    MessageSquare, 
    AlertCircle, 
    CheckCircle2, 
    History, 
    CornerDownRight, 
    Send,
    Check,
    X,
    Clock,
    UserCircle,
    RotateCcw,
    Zap
} from 'lucide-react';
import { format } from 'date-fns';

interface FeedbackSidebarProps {
    pins: DesignPin[];
    versions: DesignVersion[];
    highlightedPinId: string | null;
    status: DesignWorkflowStatus;
    onUpdatePins: (pins: DesignPin[]) => void;
    onPinSelect: (id: string) => void;
    onStatusChange: (status: DesignWorkflowStatus) => void;
    isDesigner: boolean;
    currentVersion: number;
}

export function FeedbackSidebar({ 
    pins, 
    versions,
    highlightedPinId, 
    status = 'DRAFT', // Default to DRAFT to prevent replace() crash
    onUpdatePins, 
    onPinSelect, 
    onStatusChange,
    isDesigner,
    currentVersion 
}: FeedbackSidebarProps) {
    const [filter, setFilter] = useState<'all' | 'open' | 'mistakes'>('all');
    const [editingPinId, setEditingPinId] = useState<string | null>(null);
    const [replyingPinId, setReplyingPinId] = useState<string | null>(null);
    
    // Draft states
    const [draftText, setDraftText] = useState('');
    const [isMistakeDraft, setIsMistakeDraft] = useState(false);
    const [shakeId, setShakeId] = useState<string | null>(null);
    
    // Auto-focus and scroll to highlighted pin
    useEffect(() => {
        if (highlightedPinId) {
            const el = document.getElementById(`comment-${highlightedPinId}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            const pin = pins.find(p => p.id === highlightedPinId);
            if (pin && !pin.text) {
                setEditingPinId(highlightedPinId);
                setDraftText('');
            }
        }
    }, [highlightedPinId, pins]);

    const filteredPins = pins.filter(pin => {
        if (filter === 'open') return pin.status === 'open' || pin.status === 'mistake';
        if (filter === 'mistakes') return pin.status === 'mistake';
        return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const handleSaveComment = (pinId: string) => {
        if (!draftText.trim()) {
            setShakeId(pinId);
            setTimeout(() => setShakeId(null), 500);
            return;
        }

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
        setEditingPinId(null);
        setDraftText('');
        setIsMistakeDraft(false);
    };

    const handleUpdateStatus = (pinId: string, newStatus: DesignPinStatus) => {
        const updatedPins = pins.map(p => p.id === pinId ? { ...p, status: newStatus } : p);
        onUpdatePins(updatedPins);
    };

    const handleAddReply = (pinId: string) => {
        if (!draftText.trim()) {
            setShakeId(`reply-${pinId}`);
            setTimeout(() => setShakeId(null), 500);
            return;
        }

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

    return (
        <div className="flex flex-col h-full bg-card/10 backdrop-blur-md">
            {/* Workflow Actions */}
            <div className="p-4 border-b bg-background/50 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</span>
                    <Badge className={cn(
                        "font-black text-[10px] tracking-wider",
                        status === 'APPROVED' ? "bg-green-600" :
                        status === 'INTERNAL_REVIEW' ? "bg-amber-500" :
                        status === 'CHANGES_REQUESTED' ? "bg-destructive" : "bg-muted text-muted-foreground"
                    )}>
                        {(status || 'DRAFT').replace('_', ' ')}
                    </Badge>
                </div>

                <div className="flex gap-2">
                    {isDesigner ? (
                        status !== 'APPROVED' && (
                            <Button 
                                className="w-full h-9 text-[10px] font-black uppercase tracking-widest gap-2" 
                                size="sm"
                                onClick={() => onStatusChange('INTERNAL_REVIEW')}
                                disabled={status === 'INTERNAL_REVIEW' || versions.length === 0}
                            >
                                <Send className="h-3 w-3" />
                                {status === 'INTERNAL_REVIEW' ? 'Waiting for Review' : 'Submit for Review'}
                            </Button>
                        )
                    ) : (
                        status === 'INTERNAL_REVIEW' && (
                            <>
                                <Button 
                                    className="flex-1 h-9 bg-green-600 hover:bg-green-700 text-[10px] font-black uppercase tracking-widest" 
                                    size="sm"
                                    onClick={() => onStatusChange('APPROVED')}
                                >
                                    Approve
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    className="flex-1 h-9 text-[10px] font-black uppercase tracking-widest" 
                                    size="sm"
                                    onClick={() => onStatusChange('CHANGES_REQUESTED')}
                                >
                                    Reject
                                </Button>
                            </>
                        )
                    )}
                </div>
            </div>

            {/* Version History */}
            <div className="p-4 border-b bg-muted/30">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                    <History className="h-3.5 w-3.5" />
                    Version History
                </h4>
                <div className="space-y-2">
                    {versions.map((v) => (
                        <div key={v.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-primary/5 text-[11px]">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="h-5 px-1.5 font-mono">V{v.versionNumber}</Badge>
                                <span className="font-bold">{v.author}</span>
                            </div>
                            <span className="text-muted-foreground text-[10px] font-medium">{format(new Date(v.timestamp), 'MMM dd, HH:mm')}</span>
                        </div>
                    ))}
                    {versions.length === 0 && (
                        <div className="text-center py-4 border border-dashed rounded-lg opacity-40 italic text-[10px]">
                            No versions uploaded
                        </div>
                    )}
                </div>
            </div>

            {/* Feedback Filter */}
            <div className="p-4 border-b">
                <div className="flex bg-muted/50 p-1 rounded-lg">
                    {(['all', 'open', 'mistakes'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "flex-1 text-[9px] font-black uppercase tracking-widest h-7 rounded-md transition-all",
                                filter === f 
                                    ? "bg-background text-primary shadow-sm" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Feedback Stream */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    {filteredPins.length === 0 ? (
                        <div className="py-12 text-center opacity-30">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No Feedback</p>
                        </div>
                    ) : (
                        filteredPins.map((pin) => {
                            const isHighlighted = highlightedPinId === pin.id;
                            const pinNumber = pins.findIndex(p => p.id === pin.id) + 1;
                            const isMistake = pin.status === 'mistake';

                            return (
                                <div 
                                    key={pin.id} 
                                    id={`comment-${pin.id}`}
                                    onClick={() => onPinSelect(pin.id)}
                                    className={cn(
                                        "group p-3 rounded-xl border-2 transition-all duration-300 relative",
                                        isHighlighted 
                                            ? "border-primary bg-background shadow-xl scale-[1.02] z-10" 
                                            : "border-primary/5 bg-background/50 hover:border-primary/20",
                                        pin.status === 'mistake' && !isHighlighted && "border-destructive/20 bg-destructive/5",
                                        pin.status === 'resolved' && "opacity-60",
                                        shakeId === pin.id && "animate-shake"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "h-5 w-5 rounded flex items-center justify-center text-[10px] font-black text-white",
                                                pin.status === 'open' && "bg-blue-600",
                                                pin.status === 'mistake' && "bg-destructive",
                                                pin.status === 'fixed' && "bg-amber-500",
                                                pin.status === 'resolved' && "bg-green-600"
                                            )}>
                                                {pinNumber}
                                            </div>
                                            <span className="text-[10px] font-black uppercase">{pin.author}</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">
                                            {format(new Date(pin.timestamp), 'h:mm a')} • V{pin.version}
                                        </span>
                                    </div>

                                    {editingPinId === pin.id ? (
                                        <div className="space-y-2">
                                            <Textarea 
                                                autoFocus
                                                placeholder="Comment..."
                                                className="min-h-[60px] text-xs font-semibold leading-relaxed"
                                                value={draftText}
                                                onChange={(e) => setDraftText(e.target.value)}
                                            />
                                            <div className="flex items-center justify-between">
                                                {!isDesigner && (
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox 
                                                            id={`mistake-${pin.id}`} 
                                                            checked={isMistakeDraft}
                                                            onCheckedChange={(val) => setIsMistakeDraft(!!val)}
                                                        />
                                                        <label htmlFor={`mistake-${pin.id}`} className="text-[9px] font-black uppercase tracking-wider text-destructive cursor-pointer">
                                                            Mistake
                                                        </label>
                                                    </div>
                                                )}
                                                <div className="flex gap-1 ml-auto">
                                                    <Button variant="ghost" size="sm" className="h-6 text-[8px] font-black" onClick={() => setEditingPinId(null)}>Cancel</Button>
                                                    <Button size="sm" className="h-6 text-[8px] font-black" onClick={() => handleSaveComment(pin.id)}>Save</Button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="relative">
                                                {isMistake && <AlertCircle className="absolute -left-1 -top-1 h-3 w-3 text-destructive animate-pulse" />}
                                                <p className="text-[11px] font-semibold leading-relaxed text-foreground/90 pl-3">
                                                    {pin.text || "Drafting feedback..."}
                                                </p>
                                            </div>

                                            {pin.replies.map((reply, i) => (
                                                <div key={i} className="pl-3 border-l-2 border-primary/10 space-y-0.5">
                                                    <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-muted-foreground">
                                                        <CornerDownRight className="h-3 w-3" />
                                                        {reply.author}
                                                    </div>
                                                    <p className="text-[10px] font-medium leading-relaxed bg-muted/40 p-1.5 rounded-md">
                                                        {reply.text}
                                                    </p>
                                                </div>
                                            ))}

                                            <div className="flex items-center justify-between pt-2 border-t border-primary/5">
                                                <div className="flex gap-1">
                                                    {(pin.status === 'open' || pin.status === 'mistake') && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-6 text-[8px] font-black uppercase px-2"
                                                            onClick={(e) => { e.stopPropagation(); setReplyingPinId(pin.id); setDraftText(''); }}
                                                        >
                                                            Reply
                                                        </Button>
                                                    )}
                                                    
                                                    {isDesigner && (pin.status === 'open' || pin.status === 'mistake') && (
                                                        <Button 
                                                            variant="secondary" 
                                                            size="sm" 
                                                            className="h-6 text-[8px] font-black uppercase px-2 bg-amber-100 text-amber-800"
                                                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(pin.id, 'fixed'); }}
                                                        >
                                                            Mark Fixed
                                                        </Button>
                                                    )}

                                                    {!isDesigner && pin.status === 'fixed' && (
                                                        <>
                                                            <Button 
                                                                size="sm" 
                                                                className="h-6 text-[8px] font-black uppercase px-2 bg-green-600 text-white"
                                                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(pin.id, 'resolved'); }}
                                                            >
                                                                Resolve
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="h-6 text-[8px] font-black uppercase px-2 text-destructive"
                                                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(pin.id, 'open'); }}
                                                            >
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                                
                                                {pin.status === 'resolved' && (
                                                    <div className="flex items-center gap-1 text-[8px] font-black text-green-600">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        RESOLVED
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {replyingPinId === pin.id && (
                                        <div className="mt-2 space-y-2 p-2 bg-muted/30 rounded-lg animate-in slide-in-from-bottom-2">
                                            <Input 
                                                autoFocus
                                                placeholder="Reply..."
                                                className="h-7 text-[10px] font-semibold"
                                                value={draftText}
                                                onChange={(e) => setDraftText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddReply(pin.id)}
                                            />
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" className="h-5 text-[8px] font-black" onClick={() => setReplyingPinId(null)}>X</Button>
                                                <Button size="sm" className="h-5 text-[8px] font-black" onClick={() => handleAddReply(pin.id)}>Send</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}