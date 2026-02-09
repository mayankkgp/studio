'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import type { DesignPin, DesignPinStatus, DesignReply } from '@/lib/types';
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
    Filter, 
    CornerDownRight, 
    Send,
    Loader2,
    Check,
    X,
    MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';

interface FeedbackSidebarProps {
    pins: DesignPin[];
    highlightedPinId: string | null;
    onUpdatePins: (pins: DesignPin[]) => void;
    onPinSelect: (id: string) => void;
    currentVersion: number;
}

export function FeedbackSidebar({ pins, highlightedPinId, onUpdatePins, onPinSelect, currentVersion }: FeedbackSidebarProps) {
    const [filter, setFilter] = useState<'all' | 'open' | 'mistakes'>('all');
    const [editingPinId, setEditingPinId] = useState<string | null>(null);
    const [replyingPinId, setReplyingPinId] = useState<string | null>(null);
    
    // Draft states
    const [draftText, setDraftText] = useState('');
    const [isMistakeDraft, setIsMistakeDraft] = useState(false);
    const [shakeId, setShakeId] = useState<string | null>(null);
    
    const scrollAreaRef = useRef<HTMLDivElement>(null);

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
            author: 'Designer Team',
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
        <div className="flex flex-col h-full bg-card/20 backdrop-blur-md">
            {/* Header / Filters */}
            <div className="p-4 border-b space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-[0.15em] text-foreground flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        Feedback Loop
                    </h3>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                        {pins.length} ITEMS
                    </Badge>
                </div>

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

            {/* Content Area */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {filteredPins.length === 0 ? (
                        <div className="py-20 text-center space-y-3 opacity-40">
                            <History className="h-10 w-10 mx-auto text-muted-foreground" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                No feedback recorded yet
                            </p>
                        </div>
                    ) : (
                        filteredPins.map((pin) => {
                            const isHighlighted = highlightedPinId === pin.id;
                            const pinNumber = pins.findIndex(p => p.id === pin.id) + 1;
                            const isManager = true; // Mock context

                            return (
                                <div 
                                    key={pin.id} 
                                    id={`comment-${pin.id}`}
                                    onClick={() => onPinSelect(pin.id)}
                                    className={cn(
                                        "group/card p-4 rounded-xl border-2 transition-all duration-300 relative overflow-hidden",
                                        isHighlighted 
                                            ? "border-primary bg-background shadow-xl scale-[1.02] z-10" 
                                            : "border-primary/5 bg-background/50 hover:border-primary/20",
                                        shakeId === pin.id && "animate-shake"
                                    )}
                                >
                                    {/* Pin Marker */}
                                    <div className={cn(
                                        "absolute top-0 right-0 h-10 w-10 flex items-center justify-center text-[10px] font-black text-white rounded-bl-2xl shadow-sm",
                                        pin.status === 'open' && "bg-blue-600",
                                        pin.status === 'mistake' && "bg-destructive",
                                        pin.status === 'fixed' && "bg-amber-500",
                                        pin.status === 'resolved' && "bg-green-600"
                                    )}>
                                        #{pinNumber}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-foreground">{pin.author}</span>
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">
                                                {format(new Date(pin.timestamp), 'h:mm a')}
                                            </span>
                                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 font-mono uppercase border-primary/20">
                                                v{pin.version}
                                            </Badge>
                                        </div>

                                        {editingPinId === pin.id ? (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                <Textarea 
                                                    autoFocus
                                                    placeholder="Describe the change required..."
                                                    className="min-h-[80px] text-xs font-semibold leading-relaxed border-primary/20"
                                                    value={draftText}
                                                    onChange={(e) => setDraftText(e.target.value)}
                                                />
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox 
                                                            id={`mistake-${pin.id}`} 
                                                            checked={isMistakeDraft}
                                                            onCheckedChange={(val) => setIsMistakeDraft(!!val)}
                                                        />
                                                        <label htmlFor={`mistake-${pin.id}`} className="text-[10px] font-black uppercase tracking-wider text-destructive cursor-pointer">
                                                            Mark as Mistake
                                                        </label>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase px-2" onClick={() => setEditingPinId(null)}>
                                                            Cancel
                                                        </Button>
                                                        <Button size="sm" className="h-7 text-[9px] font-black uppercase px-3" onClick={() => handleSaveComment(pin.id)}>
                                                            Save Feedback
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <p className="text-xs font-semibold leading-relaxed text-foreground/90">
                                                    {pin.text || <span className="italic opacity-40">Writing draft...</span>}
                                                </p>

                                                {pin.replies.length > 0 && (
                                                    <div className="pl-4 border-l-2 border-primary/10 space-y-3 mt-4">
                                                        {pin.replies.map((reply, i) => (
                                                            <div key={i} className="space-y-1">
                                                                <div className="flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground">
                                                                    <CornerDownRight className="h-3 w-3" />
                                                                    {reply.author}
                                                                </div>
                                                                <p className="text-[11px] font-medium leading-relaxed bg-muted/30 p-2 rounded-md">
                                                                    {reply.text}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-primary/5">
                                                    <div className="flex gap-1">
                                                        {pin.status === 'open' || pin.status === 'mistake' ? (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="h-6 text-[8px] font-black uppercase tracking-tighter px-2 border-primary/20 text-primary hover:bg-primary/5"
                                                                onClick={(e) => { e.stopPropagation(); setReplyingPinId(pin.id); setDraftText(''); }}
                                                            >
                                                                Reply
                                                            </Button>
                                                        ) : null}
                                                        
                                                        {/* Role specific actions */}
                                                        {(pin.status === 'open' || pin.status === 'mistake') && (
                                                            <Button 
                                                                variant="secondary" 
                                                                size="sm" 
                                                                className="h-6 text-[8px] font-black uppercase tracking-tighter px-2 bg-amber-100 text-amber-800 hover:bg-amber-200"
                                                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(pin.id, 'fixed'); }}
                                                            >
                                                                Mark Fixed
                                                            </Button>
                                                        )}

                                                        {pin.status === 'fixed' && isManager && (
                                                            <div className="flex gap-1">
                                                                <Button 
                                                                    size="sm" 
                                                                    className="h-6 text-[8px] font-black uppercase tracking-tighter px-2 bg-green-600 text-white"
                                                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(pin.id, 'resolved'); }}
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    className="h-6 text-[8px] font-black uppercase tracking-tighter px-2 text-destructive"
                                                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(pin.id, 'open'); }}
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {pin.status === 'resolved' && (
                                                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-green-600">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            Resolved
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {replyingPinId === pin.id && (
                                            <div className={cn(
                                                "mt-3 space-y-2 p-3 bg-muted/40 rounded-lg animate-in slide-in-from-bottom-2",
                                                shakeId === `reply-${pin.id}` && "animate-shake"
                                            )}>
                                                <Input 
                                                    autoFocus
                                                    placeholder="Write your reply..."
                                                    className="h-8 text-[11px] font-semibold"
                                                    value={draftText}
                                                    onChange={(e) => setDraftText(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddReply(pin.id)}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" className="h-6 text-[8px] font-black" onClick={() => setReplyingPinId(null)}>
                                                        Cancel
                                                    </Button>
                                                    <Button size="sm" className="h-6 text-[8px] font-black gap-1" onClick={() => handleAddReply(pin.id)}>
                                                        <Send className="h-2.5 w-2.5" />
                                                        Send Reply
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
