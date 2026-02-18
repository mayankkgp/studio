'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import type { DesignPin, DesignPinStatus, DesignWorkflowStatus, DesignVersion, CustomerData, DesignReply } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
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
    CheckCircle2,
    X,
    History,
    ChevronRight,
    Calendar,
    UserCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
    onClose: () => void;
    isLightTable?: boolean;
    isComparing: boolean;
    onSetComparisonReference: (id: string) => void;
    comparisonRefId: string | null;
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
    activeProductId,
    onClose,
    isLightTable = false,
    isComparing,
    onSetComparisonReference,
    comparisonRefId
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
            if (filter === 'open') return pin.status !== 'resolved';
            if (filter === 'mistakes') return !!pin.isMistake;
            return true;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [pins, filter, viewedVersion]);

    const hasOpenItems = pins.some(p => p.status !== 'resolved');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUpload(file);
            e.target.value = '';
        }
    };

    const handleStatusUpdate = (pinId: string, newStatus: DesignPinStatus) => {
        onUpdatePins(pins.map(p => p.id === pinId ? { ...p, status: newStatus } : p));
    };

    const handleMistakeToggle = (pinId: string) => {
        onUpdatePins(pins.map(p => p.id === pinId ? { ...p, isMistake: !p.isMistake } : p));
    };

    const handleAddReply = (pinId: string) => {
        if (!replyText.trim()) return;
        const newReply: DesignReply = {
            author: isDesigner ? 'Designer' : 'Manager',
            text: replyText.trim(),
            timestamp: new Date().toISOString()
        };
        onUpdatePins(pins.map(p => p.id === pinId ? { ...p, replies: [...(p.replies || []), newReply] } : p));
        setReplyText('');
        setActiveReplyId(null);
    };

    const handleDeletePin = (pinId: string) => {
        if (confirm("Delete this feedback?")) {
            onUpdatePins(pins.filter(p => p.id !== pinId));
        }
    };

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    const BriefSection = ({ title, icon: Icon, content }: { title: string, icon: any, content?: string }) => {
        if (!content || content.trim().length === 0) return null;
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

    const isSectionActive = (fields: (string | undefined)[]) => fields.some(f => f && f.trim().length > 0);

    const hasVisual = isSectionActive([customerData?.visualIdentity?.moodStyle, customerData?.visualIdentity?.colorTypography, customerData?.visualIdentity?.designDislikes]);
    const hasNarrative = isSectionActive([customerData?.narrative?.timeline, customerData?.narrative?.coupleWorld, customerData?.narrative?.easterEggs]);
    const hasProductBrief = activeProductId && customerData?.productBriefs?.[activeProductId] && customerData.productBriefs[activeProductId].trim().length > 0;

    if (isComparing) {
        return (
            <div className="flex flex-col h-full bg-background border-l border-primary/10 overflow-hidden animate-in slide-in-from-right duration-300">
                <div className="p-4 border-b bg-muted/30 shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-600/20"><History className="h-4 w-4" /></div>
                        <div className="flex flex-col -space-y-0.5">
                            <h3 className="font-headline font-black text-[13px] uppercase tracking-widest">Version History</h3>
                            <span className="text-[9px] font-black uppercase text-muted-foreground">Select Reference</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}><X className="h-4 w-4" /></Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-3 pb-20">
                        {versions.slice().reverse().map((v) => {
                            const isSelected = comparisonRefId === v.id || (!comparisonRefId && v.versionNumber === viewedVersion - 1);
                            const isCurrent = v.versionNumber === viewedVersion;
                            return (
                                <button key={v.id} onClick={() => !isCurrent && onSetComparisonReference(v.id)} className={cn("w-full text-left p-3 rounded-xl border-2 transition-all flex items-start gap-4", isSelected ? "border-blue-600 bg-blue-600/5" : isCurrent ? "opacity-60 cursor-default" : "border-primary/5 hover:border-blue-600/40")}>
                                    <div className="h-16 w-20 shrink-0 rounded-lg overflow-hidden border border-primary/10 relative">
                                        <img src={v.imageUrl} className="h-full w-full object-cover" alt={`V${v.versionNumber}`} />
                                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-black px-1.5 py-0.5 rounded">V{v.versionNumber}</div>
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1 pt-0.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase">{v.author}</span>
                                            {isCurrent && <Badge variant="outline" className="h-4 text-[7px] uppercase">Active</Badge>}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground"><Calendar className="h-3 w-3 opacity-50" /> {format(new Date(v.timestamp), 'dd MMM, HH:mm')}</div>
                                        {isSelected && <div className="text-[9px] font-black text-blue-600 mt-2 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Selected</div>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background border-l border-primary/10 overflow-hidden">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
            <div className="p-4 border-b bg-muted/30 shrink-0 flex items-center justify-between">
                <Badge className={cn("font-black text-[10px] px-3 h-7 tracking-widest shadow-sm", status === 'APPROVED' ? "bg-green-600 text-white" : status === 'INTERNAL_REVIEW' ? "bg-amber-500 text-white" : status === 'CUSTOMER_REVIEW' ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground")}>
                    {isLightTable ? 'MULTI-VIEW' : status.replace('_', ' ')}
                </Badge>
                <div className="flex items-center gap-2">
                    {isDesigner && status === 'DRAFT' && hasNewDraft && (
                        <Button size="sm" className="h-7 text-[9px] font-black uppercase bg-green-600 hover:bg-green-700" onClick={() => onStatusChange('INTERNAL_REVIEW')}><Send className="h-3 w-3 mr-1.5" /> Submit</Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}><X className="h-4 w-4" /></Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-2 rounded-none bg-muted/20 border-b h-12 shrink-0">
                    <TabsTrigger value="feedback" className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary font-black uppercase text-[10px] tracking-widest"><MessageSquare className="h-3.5 w-3.5 mr-2" /> Feedback</TabsTrigger>
                    <TabsTrigger value="brief" className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary font-black uppercase text-[10px] tracking-widest"><BookOpen className="h-3.5 w-3.5 mr-2" /> The Brief</TabsTrigger>
                </TabsList>

                <TabsContent value="feedback" className="flex-1 overflow-hidden m-0 p-0 flex flex-col !mt-0 data-[state=active]:flex outline-none">
                    <div className="p-3 border-b flex gap-1 bg-muted/5 shrink-0">
                        {(['all', 'open', 'mistakes'] as const).map((f) => (
                            <button key={f} onClick={() => setFilter(f)} className={cn("flex-1 text-[9px] font-black uppercase tracking-widest h-7 rounded transition-all", filter === f ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>{f}</button>
                        ))}
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-4 pb-20">
                            {filteredPins.length === 0 ? (
                                <div className="py-12 text-center opacity-30"><MessageSquare className="h-8 w-8 mx-auto mb-2" /><p className="text-[10px] font-black uppercase tracking-widest">No Feedback</p></div>
                            ) : (
                                filteredPins.map((pin) => (
                                    <div key={pin.id} id={`comment-${pin.id}`} onClick={() => onPinSelect(pin.id)} className={cn("p-3 rounded-xl border-2 transition-all relative cursor-pointer", highlightedPinId === pin.id ? "border-primary bg-primary/5" : "border-primary/5 bg-background", pin.status === 'resolved' && "opacity-60 grayscale-[0.5]")}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-5 w-5 border border-white/10 shadow-sm">
                                                    <AvatarFallback className={cn("text-[8px] font-black", pin.author === 'Designer' ? "bg-purple-600 text-white" : "bg-blue-600 text-white")}>{getInitials(pin.author)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-[10px] font-black uppercase tracking-tighter">{pin.author}</span>
                                                <Badge variant="outline" className="text-[7px] h-3.5 px-1 uppercase">{pin.status}</Badge>
                                            </div>
                                            <span className="text-[9px] font-bold opacity-40">V{pin.version}</span>
                                        </div>
                                        <p className="text-[11px] font-medium leading-relaxed opacity-90">{pin.text || <span className="italic opacity-50">Empty comment</span>}</p>
                                        {pin.replies?.map((r, i) => (
                                            <div key={i} className="pl-3 border-l border-primary/10 mt-2 space-y-0.5">
                                                <div className="text-[8px] font-black uppercase opacity-50">{r.author}</div>
                                                <p className="text-[10px] opacity-80">{r.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="brief" className="flex-1 overflow-hidden m-0 p-4 flex flex-col !mt-0 data-[state=active]:flex outline-none">
                    <ScrollArea className="flex-1">
                        <div className="space-y-8 pb-20">
                            {!hasVisual && !hasNarrative && !hasProductBrief ? (
                                <div className="py-20 text-center opacity-40 italic"><Sparkles className="h-10 w-10 mx-auto mb-3" /><p className="text-[11px] font-black uppercase tracking-widest px-8">Creative brief is empty.</p></div>
                            ) : (
                                <>
                                    {hasVisual && (<div><h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-primary/10 pb-1 mb-4">Visual Identity</h3><BriefSection title="Mood & Style" icon={Palette} content={customerData?.visualIdentity?.moodStyle} /><BriefSection title="Palette & Type" icon={Palette} content={customerData?.visualIdentity?.colorTypography} /><BriefSection title="Dislikes" icon={AlertCircle} content={customerData?.visualIdentity?.designDislikes} /></div>)}
                                    {hasNarrative && (<div><h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-primary/10 pb-1 mb-4">Narrative</h3><BriefSection title="Timeline" icon={BookOpen} content={customerData?.narrative?.timeline} /><BriefSection title="Couple's World" icon={Globe} content={customerData?.narrative?.coupleWorld} /><BriefSection title="Easter Eggs" icon={Sparkles} content={customerData?.narrative?.easterEggs} /></div>)}
                                    {hasProductBrief && (<div><h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-primary/10 pb-1 mb-4">Product Brief</h3><BriefSection title="Product Specific" icon={Sparkles} content={customerData?.productBriefs?.[activeProductId!]} /></div>)}
                                </>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
}
