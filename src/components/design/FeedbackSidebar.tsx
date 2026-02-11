'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import type { DesignPin, DesignPinStatus, DesignReply, DesignWorkflowStatus, DesignVersion } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
    MessageSquare, 
    AlertCircle, 
    CheckCircle2, 
    History, 
    CornerDownRight, 
    Send,
    Trash2,
    Play,
    Lock,
    Upload,
    RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';

interface FeedbackSidebarProps {
    pins: DesignPin[];
    versions: DesignVersion[];
    highlightedPinId: string | null;
    selectedVersionId: string | null;
    status: DesignWorkflowStatus;
    onUpdatePins: (pins: DesignPin[]) => void;
    onPinSelect: (id: string | null) => void;
    onVersionSelect: (id: string) => void;
    onStatusChange: (status: DesignWorkflowStatus) => void;
    onUpdateVersions: (versions: DesignVersion[]) => void;
    onDeleteDraft?: () => void;
    hasNewDraft?: boolean;
    onUpload: (file: File) => void;
    isDesigner: boolean;
    currentVersion: number;
    viewedVersion: number;
}

export function FeedbackSidebar({ 
    pins, 
    versions,
    highlightedPinId, 
    selectedVersionId,
    status = 'PENDING',
    onUpdatePins, 
    onPinSelect, 
    onVersionSelect,
    onStatusChange,
    onUpdateVersions,
    onDeleteDraft,
    hasNewDraft = false,
    onUpload,
    isDesigner,
    currentVersion,
    viewedVersion
}: FeedbackSidebarProps) {
    const [filter, setFilter] = useState<'all' | 'open' | 'mistakes'>('open');
    const [editingPinId, setEditingPinId] = useState<string | null>(null);
    const [replyingPinId, setReplyingPinId] = useState<string | null>(null);
    const [draftText, setDraftText] = useState('');
    const [isMistakeDraft, setIsMistakeDraft] = useState(false);
    const [shakeId, setShakeId] = useState<string | null>(null);
    const isSavingRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isLatest = viewedVersion === currentVersion;

    useEffect(() => {
        if (highlightedPinId) {
            const el = document.getElementById(`comment-${highlightedPinId}`);
            if (el) {
                el.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest',
                    inline: 'nearest' 
                });
            }
        } else {
            setEditingPinId(null);
            setReplyingPinId(null);
            setDraftText('');
        }
    }, [highlightedPinId]);

    const filteredPins = useMemo(() => {
        return pins.filter(pin => {
            if (pin.version > viewedVersion) return false;
            if (filter === 'open') return pin.status === 'open' || pin.status === 'mistake' || pin.status === 'fixed';
            if (filter === 'mistakes') return pin.status === 'mistake';
            return true;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [pins, filter, viewedVersion]);

    const hasOpenItems = pins.some(p => p.status === 'open' || p.status === 'mistake' || p.status === 'fixed');

    const handleSaveComment = (pinId: string) => {
        if (!draftText.trim()) {
            setShakeId(pinId);
            setTimeout(() => setShakeId(null), 500);
            return;
        }

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
        setEditingPinId(null);
        setDraftText('');
        setTimeout(() => { isSavingRef.current = false; }, 100);
    };

    const handleDeletePin = (pinId: string) => {
        onUpdatePins(pins.filter(p => p.id !== pinId));
        if (highlightedPinId === pinId) onPinSelect(null);
    };

    const handleAddReply = (pinId: string) => {
        if (!draftText.trim()) {
            setShakeId(`reply-${pinId}`);
            setTimeout(() => setShakeId(null), 500);
            return;
        }

        isSavingRef.current = true;
        const newReply: DesignReply = {
            author: isDesigner ? 'Designer' : 'Manager',
            text: draftText.trim(),
            timestamp: new Date().toISOString()
        };

        const updatedPins = pins.map(p => 
            p.id === pinId ? { ...p, replies: [...p.replies, newReply] } : p
        );
        onUpdatePins(updatedPins);
        setReplyingPinId(null);
        setDraftText('');
        setTimeout(() => { isSavingRef.current = false; }, 100);
    };

    const handleDiscardIfEmpty = (pinId: string) => {
        setTimeout(() => {
            if (isSavingRef.current) return;
            if (!draftText.trim()) {
                setEditingPinId(null);
                setReplyingPinId(null);
            }
        }, 150);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUpload(file);
            e.target.value = '';
        }
    };

    const renderActions = () => {
        if (isDesigner) {
            switch (status) {
                case 'PENDING':
                    return <Button className="w-full h-10 font-black uppercase tracking-widest gap-2" onClick={() => onStatusChange('DRAFT')}><Play className="h-4 w-4" /> Start Design</Button>;
                case 'DRAFT':
                    if (!hasNewDraft) {
                        return (
                            <div className="flex flex-col gap-2">
                                <Button className="w-full h-10 font-black uppercase tracking-widest gap-2" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /> Upload Design</Button>
                                <Button variant="ghost" className="w-full h-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground" onClick={() => onStatusChange('PENDING')}>Stop Work</Button>
                            </div>
                        );
                    }
                    return (
                        <div className="flex flex-col gap-2">
                            <Button className="w-full h-10 font-black uppercase tracking-widest gap-2 bg-green-600 hover:bg-green-700" onClick={() => onStatusChange('INTERNAL_REVIEW')}><Send className="h-4 w-4" /> Submit for Review</Button>
                            <Button variant="ghost" className="w-full h-8 text-[10px] font-black uppercase tracking-widest text-destructive" onClick={() => onDeleteDraft?.()}><Trash2 className="h-3 w-3 mr-1.5" /> Delete Draft</Button>
                        </div>
                    );
                default:
                    return <div className="flex items-center justify-center p-3 bg-muted/20 rounded-lg text-muted-foreground gap-2 font-black uppercase text-[10px] tracking-widest"><Lock className="h-3 w-3" /> Design Locked</div>;
            }
        } else {
            if (!isLatest) {
                return (
                    <div className="flex items-center justify-center p-3 bg-muted/20 rounded-lg text-muted-foreground gap-2 font-black uppercase text-[10px] tracking-widest">
                        <Lock className="h-3 w-3" /> Viewing History — Read Only
                    </div>
                );
            }

            switch (status) {
                case 'PENDING':
                case 'DRAFT':
                    return <div className="p-3 border-2 border-dashed rounded-lg text-center text-muted-foreground text-[10px] font-black uppercase tracking-widest">Waiting for designer...</div>;
                case 'INTERNAL_REVIEW':
                    return (
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="destructive" className="h-10 text-[10px] font-black uppercase tracking-widest" onClick={() => onStatusChange('PENDING')}>Request Changes</Button>
                            <Button className="h-10 text-[10px] font-black uppercase tracking-widest bg-green-600 hover:bg-green-700" disabled={hasOpenItems} onClick={() => onStatusChange('CUSTOMER_REVIEW')}>Approve for Client</Button>
                        </div>
                    );
                case 'CUSTOMER_REVIEW':
                    return (
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="h-10 text-[10px] font-black uppercase tracking-widest border-destructive text-destructive" onClick={() => onStatusChange('PENDING')}>Customer Changes</Button>
                            <Button className="h-10 text-[10px] font-black uppercase tracking-widest" onClick={() => onStatusChange('APPROVED')}>Mark Final</Button>
                        </div>
                    );
                case 'APPROVED':
                    return <Button variant="outline" className="w-full h-10 text-[10px] font-black uppercase tracking-widest border-primary text-primary" onClick={() => onStatusChange('INTERNAL_REVIEW')}><RotateCcw className="h-3.5 w-3.5 mr-2" /> Re-open Design</Button>;
            }
        }
    };

    const canAddFeedback = isLatest && ((isDesigner && status === 'DRAFT') || (!isDesigner && (status === 'INTERNAL_REVIEW' || status === 'CUSTOMER_REVIEW')));

    return (
        <div className="flex flex-col h-full bg-card/10 backdrop-blur-md overflow-hidden">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />

            <div className="p-4 border-b bg-background/50 space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Workflow State</span>
                    <Badge className={cn(
                        "font-black text-[10px] tracking-wider",
                        status === 'APPROVED' ? "bg-green-600" :
                        status === 'INTERNAL_REVIEW' ? "bg-amber-500" :
                        status === 'CUSTOMER_REVIEW' ? "bg-blue-600" : "bg-muted text-muted-foreground"
                    )}>
                        {status.replace('_', ' ')}
                    </Badge>
                </div>
                {renderActions()}
            </div>

            <div className="p-4 border-b bg-muted/30 shrink-0 max-h-[180px] overflow-y-auto custom-scrollbar">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3"><History className="h-3.5 w-3.5" /> Version History</h4>
                <div className="space-y-2">
                    {versions.map((v) => (
                        <button 
                            key={v.id} onClick={() => onVersionSelect(v.id)}
                            className={cn(
                                "w-full flex items-center justify-between p-2 rounded-lg border transition-all text-[11px]",
                                selectedVersionId === v.id ? "bg-primary/10 border-primary text-primary shadow-sm" : "bg-background border-primary/5 text-foreground hover:border-primary/20"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <Badge variant={selectedVersionId === v.id ? "default" : "secondary"} className="h-5 px-1.5 font-mono">V{v.versionNumber}</Badge>
                                <span className="font-bold">{v.author}</span>
                            </div>
                            <span className="text-muted-foreground text-[10px] font-medium">{format(new Date(v.timestamp), 'MMM dd, HH:mm')}</span>
                        </button>
                    ))}
                    {versions.length === 0 && <div className="text-center py-4 border border-dashed rounded-lg opacity-40 italic text-[10px]">No versions uploaded</div>}
                </div>
            </div>

            <div className="p-4 border-b flex gap-1 bg-muted/10 shrink-0">
                {(['all', 'open', 'mistakes'] as const).map((f) => (
                    <button key={f} onClick={() => setFilter(f)} className={cn("flex-1 text-[9px] font-black uppercase tracking-widest h-7 rounded-md transition-all", filter === f ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>{f}</button>
                ))}
            </div>

            <ScrollArea className="flex-1 w-full overflow-hidden">
                <div className="p-4 space-y-4 pb-32">
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
                                    key={pin.id} id={`comment-${pin.id}`} onClick={() => onPinSelect(pin.id)}
                                    className={cn(
                                        "p-3 rounded-xl border-2 transition-all duration-300 relative cursor-pointer group", 
                                        isHighlighted ? "border-primary bg-background shadow-xl scale-[1.02] z-10" : "border-primary/5 bg-background/50 hover:border-primary/20", 
                                        pin.status === 'mistake' && !isHighlighted && "border-destructive/20 bg-destructive/5", 
                                        pin.status === 'resolved' && "opacity-60", 
                                        shakeId === pin.id && "animate-shake"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("h-5 w-5 rounded flex items-center justify-center text-[10px] font-black text-white", pin.status === 'open' ? "bg-blue-600" : pin.status === 'mistake' ? "bg-destructive" : pin.status === 'fixed' ? "bg-amber-500" : "bg-green-600")}>{pinNumber}</div>
                                            <span className="text-[10px] font-black uppercase">{pin.author}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">{format(new Date(pin.timestamp), 'h:mm a')} • V{pin.version}</span>
                                            {canAddFeedback && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                                                    onClick={(e) => { e.stopPropagation(); handleDeletePin(pin.id); }}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {editingPinId === pin.id ? (
                                        <div className="space-y-2">
                                            <Textarea 
                                                autoFocus placeholder="Enter feedback..." className="min-h-[60px] text-xs font-semibold" 
                                                value={draftText} onChange={(e) => setDraftText(e.target.value)}
                                                onBlur={() => handleDiscardIfEmpty(pin.id)}
                                            />
                                            <div className="flex items-center justify-between">
                                                {!isDesigner && <div className="flex items-center space-x-2"><Checkbox id={`mistake-${pin.id}`} checked={isMistakeDraft} onCheckedChange={(val) => setIsMistakeDraft(!!val)} /><label htmlFor={`mistake-${pin.id}`} className="text-[9px] font-black uppercase tracking-wider text-destructive cursor-pointer">Mistake</label></div>}
                                                <div className="flex gap-1 ml-auto"><Button variant="ghost" size="sm" className="h-6 text-[8px] font-black" onClick={(e) => { e.stopPropagation(); setEditingPinId(null); }}>Cancel</Button><Button size="sm" className="h-6 text-[8px] font-black" onClick={(e) => { e.stopPropagation(); handleSaveComment(pin.id); }}>Save</Button></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="relative">
                                                {isMistake && <AlertCircle className="absolute -left-1 -top-1 h-3 w-3 text-destructive animate-pulse" />}
                                                <p className="text-[11px] font-semibold leading-relaxed text-foreground/90 pl-3">{pin.text || "Drafting feedback..."}</p>
                                            </div>
                                            {pin.replies.map((reply, i) => (
                                                <div key={i} className="pl-3 border-l-2 border-primary/10 space-y-0.5">
                                                    <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-muted-foreground"><CornerDownRight className="h-3 w-3" /> {reply.author}</div>
                                                    <p className="text-[10px] font-medium leading-relaxed bg-muted/40 p-1.5 rounded-md">{reply.text}</p>
                                                </div>
                                            ))}
                                            <div className="flex items-center justify-between pt-2 border-t border-primary/5">
                                                <div className="flex gap-1">
                                                    {canAddFeedback && (pin.status !== 'resolved') && <Button variant="ghost" size="sm" className="h-6 text-[8px] font-black uppercase px-2" onClick={(e) => { e.stopPropagation(); setReplyingPinId(pin.id); setDraftText(''); }}>Reply</Button>}
                                                    {isDesigner && status === 'DRAFT' && isLatest && (pin.status === 'open' || pin.status === 'mistake') && <Button variant="secondary" size="sm" className="h-6 text-[8px] font-black uppercase px-2 bg-amber-100 text-amber-800" onClick={(e) => { e.stopPropagation(); onUpdatePins(pins.map(p => p.id === pin.id ? { ...p, status: 'fixed' } : p)); }}>Mark Fixed</Button>}
                                                    {!isDesigner && isLatest && (status === 'INTERNAL_REVIEW' || status === 'CUSTOMER_REVIEW') && (
                                                        <>
                                                            {(pin.status !== 'resolved') && <Button size="sm" className="h-6 text-[8px] font-black uppercase px-2 bg-green-600 text-white" onClick={(e) => { e.stopPropagation(); onUpdatePins(pins.map(p => p.id === pin.id ? { ...p, status: 'resolved' } : p)); }}>Resolve</Button>}
                                                            {pin.status === 'fixed' && <Button variant="ghost" size="sm" className="h-6 text-[8px] font-black uppercase px-2 text-destructive" onClick={(e) => { e.stopPropagation(); onUpdatePins(pins.map(p => p.id === pin.id ? { ...p, status: 'open' } : p)); }}>Reject Fix</Button>}
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {pin.status === 'resolved' && <div className="flex items-center gap-1 text-[8px] font-black text-green-600"><CheckCircle2 className="h-3 w-3" /> RESOLVED</div>}
                                                    {canAddFeedback && pin.status !== 'resolved' && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                                                            onClick={(e) => { e.stopPropagation(); handleDeletePin(pin.id); }}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {replyingPinId === pin.id && (
                                        <div className="mt-2 space-y-2 p-2 bg-muted/30 rounded-lg animate-in slide-in-from-bottom-2">
                                            <Input 
                                                autoFocus placeholder="Reply..." className="h-7 text-[10px] font-semibold" 
                                                value={draftText} onChange={(e) => setDraftText(e.target.value)} 
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddReply(pin.id); }}
                                                onBlur={() => {
                                                    setTimeout(() => { if (!isSavingRef.current && !draftText.trim()) setReplyingPinId(null); }, 150);
                                                }}
                                            />
                                            <div className="flex justify-end gap-1"><Button variant="ghost" size="sm" className="h-5 text-[8px] font-black" onClick={(e) => { e.stopPropagation(); setReplyingPinId(null); }}>X</Button><Button size="sm" className="h-5 text-[8px] font-black" onClick={(e) => { e.stopPropagation(); handleAddReply(pin.id); }}>Send</Button></div>
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
