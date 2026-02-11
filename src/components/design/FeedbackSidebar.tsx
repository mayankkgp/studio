'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import type { DesignPin, DesignPinStatus, DesignReply, DesignWorkflowStatus, DesignVersion, CustomerData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
    RotateCcw,
    BookOpen,
    Palette,
    Globe,
    Sparkles
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
    const [editingPinId, setEditingPinId] = useState<string | null>(null);
    const [replyingPinId, setReplyingPinId] = useState<string | null>(null);
    const [draftText, setDraftText] = useState('');
    const [isMistakeDraft, setIsMistakeDraft] = useState(false);
    const [activeTab, setActiveTab] = useState('feedback');
    const isSavingRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isLatest = viewedVersion === currentVersion;

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

    const handleSaveComment = (pinId: string) => {
        if (!draftText.trim()) return;
        isSavingRef.current = true;
        const updatedPins = pins.map(p => p.id === pinId ? { ...p, text: draftText.trim(), status: isMistakeDraft ? 'mistake' : 'open' } as DesignPin : p);
        onUpdatePins(updatedPins);
        setEditingPinId(null);
        setDraftText('');
        setTimeout(() => { isSavingRef.current = false; }, 100);
    };

    const handleAddReply = (pinId: string) => {
        if (!draftText.trim()) return;
        isSavingRef.current = true;
        const newReply: DesignReply = { author: isDesigner ? 'Designer' : 'Manager', text: draftText.trim(), timestamp: new Date().toISOString() };
        onUpdatePins(pins.map(p => p.id === pinId ? { ...p, replies: [...p.replies, newReply] } : p));
        setReplyingPinId(null);
        setDraftText('');
        setTimeout(() => { isSavingRef.current = false; }, 100);
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
            if (!isLatest) return <div className="flex items-center justify-center p-3 bg-muted/20 rounded-lg text-muted-foreground gap-2 font-black uppercase text-[10px] tracking-widest"><Lock className="h-3 w-3" /> Read Only</div>;
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
                                    return (
                                        <div 
                                            key={pin.id} id={`comment-${pin.id}`} onClick={() => onPinSelect(pin.id)}
                                            className={cn(
                                                "p-3 rounded-xl border-2 transition-all relative cursor-pointer", 
                                                highlightedPinId === pin.id ? "border-primary bg-primary/5 shadow-lg scale-[1.02]" : "border-primary/5 bg-background hover:border-primary/20", 
                                                pin.status === 'mistake' && "border-destructive/20 bg-destructive/5"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("h-5 w-5 rounded flex items-center justify-center text-[10px] font-black text-white", PIN_COLORS[pin.status])}>{pinNumber}</div>
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">{pin.author}</span>
                                                </div>
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">V{pin.version}</span>
                                            </div>
                                            <p className="text-[11px] font-semibold leading-relaxed text-foreground/90">{pin.text}</p>
                                            {pin.replies.map((reply, i) => (
                                                <div key={i} className="pl-3 border-l-2 border-primary/10 mt-3 space-y-0.5">
                                                    <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-muted-foreground">{reply.author}</div>
                                                    <p className="text-[10px] font-medium leading-relaxed">{reply.text}</p>
                                                </div>
                                            ))}
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
