'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import type { DesignPin, DesignPinStatus, DesignWorkflowStatus, DesignVersion, CustomerData, DesignReply } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { 
    MessageSquare, 
    AlertCircle, 
    RotateCcw, 
    BookOpen, 
    Palette, 
    Globe, 
    Sparkles,
    Play,
    Upload,
    Send,
    Trash2,
    Lock,
    CornerDownRight,
    CheckCircle2
} from 'lucide-react';

const PIN_COLORS: Record<DesignPinStatus, string> = {
    open: 'bg-blue-600',
    mistake: 'bg-destructive',
    fixed: 'bg-amber-500',
    resolved: 'bg-green-600'
};

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
    customerData?: CustomerData;
    activeProductId?: string;
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
    viewedVersion,
    customerData,
    activeProductId
}: FeedbackSidebarProps) {
    const [filter, setFilter] = useState<'all' | 'open' | 'mistakes'>('open');
    const [activeTab, setActiveTab] = useState('feedback');
    const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (highlightedPinId) {
            setActiveTab('feedback');
            const el = document.getElementById(`comment-${highlightedPinId}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUpload(file);
            e.target.value = '';
        }
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
        setActiveReplyId(null);
    };

    const handleDeletePin = (pinId: string) => {
        if (confirm("Delete this feedback?")) {
            onUpdatePins(pins.filter(p => p.id !== pinId));
        }
    };

    const renderActions = () => {
        if (isDesigner) {
            switch (status) {
                case 'PENDING':
                    return <Button className="w-full h-10 font-black uppercase tracking-widest gap-2" onClick={() => onStatusChange('DRAFT')}><Play className="h-4 w-4" /> Start Design</Button>;
                case 'DRAFT':
                    if (!hasNewDraft) return (
                        <div className="flex flex-col gap-2">
                            <Button className="w-full h-10 font-black uppercase tracking-widest gap-2" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /> Upload Design</Button>
                            <Button variant="ghost" className="w-full h-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground" onClick={() => onStatusChange('PENDING')}>Stop Work</Button>
                        </div>
                    );
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
            switch (status) {
                case 'PENDING': case 'DRAFT': return <div className="p-3 border-2 border-dashed rounded-lg text-center text-muted-foreground text-[10px] font-black uppercase tracking-widest">Waiting for designer...</div>;
                case 'INTERNAL_REVIEW': return (
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="destructive" className="h-10 text-[10px] font-black uppercase tracking-widest" onClick={() => onStatusChange('PENDING')}>Changes</Button>
                        <Button className="h-10 text-[10px] font-black uppercase tracking-widest bg-green-600 hover:bg-green-700" disabled={hasOpenItems} onClick={() => onStatusChange('CUSTOMER_REVIEW')}>Approve</Button>
                    </div>
                );
                case 'CUSTOMER_REVIEW': return (
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="h-10 text-[10px] font-black uppercase tracking-widest border-destructive text-destructive" onClick={() => onStatusChange('PENDING')}>Rejected</Button>
                        <Button className="h-10 text-[10px] font-black uppercase tracking-widest" onClick={() => onStatusChange('APPROVED')}>Mark Final</Button>
                    </div>
                );
                case 'APPROVED': return <Button variant="outline" className="w-full h-10 text-[10px] font-black uppercase tracking-widest border-primary text-primary" onClick={() => onStatusChange('INTERNAL_REVIEW')}><RotateCcw className="h-3.5 w-3.5 mr-2" /> Re-open</Button>;
            }
        }
    };

    const BriefSection = ({ title, icon: Icon, content }: { title: string, icon: any, content?: string }) => {
        if (!content) return null;
        return (
            <div className="space-y-2 mb-6 last:mb-0">
                <div className="flex items-center gap-2 text-primary">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
                </div>
                <p className="text-[11px] font-medium leading-relaxed bg-muted/20 p-3 rounded-lg border border-primary/5">{content}</p>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-background border-l border-primary/10 overflow-hidden">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />

            <div className="p-4 border-b bg-muted/30 shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</span>
                    <Badge className={cn(
                        "font-black text-[10px]",
                        status === 'APPROVED' ? "bg-green-600" :
                        status === 'INTERNAL_REVIEW' ? "bg-amber-500" :
                        status === 'CUSTOMER_REVIEW' ? "bg-blue-600" : "bg-muted text-muted-foreground"
                    )}>
                        {status.replace('_', ' ')}
                    </Badge>
                </div>
                {renderActions()}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-2 rounded-none bg-muted/20 border-b h-12">
                    <TabsTrigger value="feedback" className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary font-black uppercase text-[10px] tracking-widest">
                        <MessageSquare className="h-3.5 w-3.5 mr-2" /> Feedback
                    </TabsTrigger>
                    <TabsTrigger value="brief" className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary font-black uppercase text-[10px] tracking-widest">
                        <BookOpen className="h-3.5 w-3.5 mr-2" /> The Brief
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="feedback" className="flex-1 overflow-hidden m-0 p-0 flex flex-col">
                    <div className="p-3 border-b flex gap-1 bg-muted/5 shrink-0">
                        {(['all', 'open', 'mistakes'] as const).map((f) => (
                            <button key={f} onClick={() => setFilter(f)} className={cn("flex-1 text-[9px] font-black uppercase tracking-widest h-7 rounded transition-all", filter === f ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>{f}</button>
                        ))}
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-4 pb-20">
                            {filteredPins.length === 0 ? (
                                <div className="py-12 text-center opacity-30">
                                    <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No Feedback</p>
                                </div>
                            ) : (
                                filteredPins.map((pin) => {
                                    const pinNumber = pins.findIndex(p => p.id === pin.id) + 1;
                                    const isHighlighted = highlightedPinId === pin.id;
                                    const isReplying = activeReplyId === pin.id;
                                    const canDelete = !isDesigner || (status === 'DRAFT' && pin.version === currentVersion);

                                    return (
                                        <div 
                                            key={pin.id} id={`comment-${pin.id}`} onClick={() => onPinSelect(pin.id)}
                                            className={cn(
                                                "p-3 rounded-xl border-2 transition-all relative cursor-pointer", 
                                                isHighlighted ? "border-primary bg-primary/5 shadow-lg" : "border-primary/5 bg-background hover:border-primary/20", 
                                                pin.status === 'mistake' && "border-destructive/20 bg-destructive/5",
                                                pin.status === 'resolved' && "opacity-60 grayscale-[0.5]"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("h-5 w-5 rounded flex items-center justify-center text-[10px] font-black text-white", PIN_COLORS[pin.status])}>{pinNumber}</div>
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">{pin.author}</span>
                                                    <Badge variant="outline" className={cn(
                                                        "text-[8px] h-4 font-black uppercase px-1 border-primary/20",
                                                        pin.status === 'mistake' ? "text-destructive border-destructive/20 bg-destructive/5" : "text-primary bg-primary/5"
                                                    )}>
                                                        {pin.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">V{pin.version}</span>
                                                    {canDelete && (
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeletePin(pin.id); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <p className="text-[11px] font-semibold leading-relaxed text-foreground/90">{pin.text || <span className="italic opacity-50">No description provided</span>}</p>
                                            
                                            {pin.replies && pin.replies.map((reply, i) => (
                                                <div key={i} className="pl-3 border-l-2 border-primary/10 mt-3 space-y-0.5">
                                                    <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-muted-foreground"><CornerDownRight className="h-3 w-3" /> {reply.author}</div>
                                                    <p className="text-[10px] font-medium leading-relaxed">{reply.text}</p>
                                                </div>
                                            ))}

                                            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-primary/5 pt-3">
                                                {!isReplying ? (
                                                    <>
                                                        <Button variant="ghost" size="sm" className="h-6 text-[9px] font-black uppercase px-2" onClick={(e) => { e.stopPropagation(); setActiveReplyId(pin.id); setReplyText(''); }}>Reply</Button>
                                                        {!isDesigner && (
                                                            <>
                                                                {pin.status !== 'resolved' ? (
                                                                    <>
                                                                        <Button variant="outline" size="sm" className="h-6 text-[9px] font-black uppercase px-2 border-green-600 text-green-600 hover:bg-green-50" onClick={(e) => { e.stopPropagation(); handleStatusUpdate(pin.id, 'resolved'); }}><CheckCircle2 className="h-3 w-3 mr-1" /> Resolve</Button>
                                                                        <Button 
                                                                            variant="outline" 
                                                                            size="sm" 
                                                                            className={cn("h-6 text-[9px] font-black uppercase px-2", pin.status === 'mistake' ? "border-primary text-primary" : "border-destructive text-destructive")} 
                                                                            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(pin.id, pin.status === 'mistake' ? 'open' : 'mistake'); }}
                                                                        >
                                                                            <AlertCircle className="h-3 w-3 mr-1" /> {pin.status === 'mistake' ? 'Unmark Mistake' : 'Mark Mistake'}
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <Button variant="outline" size="sm" className="h-6 text-[9px] font-black uppercase px-2 border-primary text-primary hover:bg-primary/5" onClick={(e) => { e.stopPropagation(); handleStatusUpdate(pin.id, 'open'); }}><RotateCcw className="h-3 w-3 mr-1" /> Re-open</Button>
                                                                )}
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="w-full space-y-2">
                                                        <Textarea 
                                                            autoFocus
                                                            placeholder="Write a reply..." 
                                                            className="min-h-[60px] text-[10px] font-semibold"
                                                            value={replyText}
                                                            onChange={(e) => setReplyText(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="sm" className="h-6 text-[9px] font-black uppercase" onClick={(e) => { e.stopPropagation(); setActiveReplyId(null); }}>Cancel</Button>
                                                            <Button size="sm" className="h-6 text-[9px] font-black uppercase" onClick={(e) => { e.stopPropagation(); handleAddReply(pin.id); }}>Send</Button>
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
                </TabsContent>

                <TabsContent value="brief" className="flex-1 overflow-hidden m-0 p-0">
                    <ScrollArea className="h-full">
                        <div className="p-6 space-y-8">
                            <div>
                                <h3 className="font-headline font-black text-sm uppercase tracking-widest text-foreground border-b-2 border-primary/10 pb-2 mb-6">Visual Identity</h3>
                                <BriefSection title="Mood & Style" icon={Palette} content={customerData?.visualIdentity?.moodStyle} />
                                <BriefSection title="Palette & Type" icon={Palette} content={customerData?.visualIdentity?.colorTypography} />
                                <BriefSection title="Dislikes" icon={AlertCircle} content={customerData?.visualIdentity?.designDislikes} />
                            </div>

                            <div>
                                <h3 className="font-headline font-black text-sm uppercase tracking-widest text-foreground border-b-2 border-primary/10 pb-2 mb-6">Narrative</h3>
                                <BriefSection title="Timeline" icon={BookOpen} content={customerData?.narrative?.timeline} />
                                <BriefSection title="Couple's World" icon={Globe} content={customerData?.narrative?.coupleWorld} />
                                <BriefSection title="Easter Eggs" icon={Sparkles} content={customerData?.narrative?.easterEggs} />
                            </div>

                            {activeProductId && customerData?.productBriefs?.[activeProductId] && (
                                <div>
                                    <h3 className="font-headline font-black text-sm uppercase tracking-widest text-foreground border-b-2 border-primary/10 pb-2 mb-6">Product Specific</h3>
                                    <BriefSection title="Product Brief" icon={Sparkles} content={customerData.productBriefs[activeProductId]} />
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
}
