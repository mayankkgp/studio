'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, Palette, BookOpen, Globe, Sparkles, Box } from 'lucide-react';
import type { Order, CustomerData } from '@/lib/types';
import { productCatalog } from '@/lib/product-data';
import { cn } from '@/lib/utils';

interface CustomerDataFormProps {
    order: Order;
    onSave: (data: CustomerData) => void;
}

export function CustomerDataForm({ order, onSave }: CustomerDataFormProps) {
    const { register, handleSubmit } = useForm<CustomerData>({
        defaultValues: order.customerData || {
            visualIdentity: { moodStyle: '', colorTypography: '', designDislikes: '' },
            narrative: { timeline: '', coupleWorld: '', easterEggs: '' },
            cultureSymbols: { mandatoryIcons: '', regionalNuances: '' },
            atmosphereExtras: { venuePersonality: '', otherDetails: '' },
            productBriefs: {}
        }
    });

    const SectionHeader = ({ title, icon: Icon, number }: { title: string, icon: any, number: string }) => (
        <div className="flex items-center gap-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-base shadow-sm border border-primary/5">
                {number}
            </div>
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary opacity-80" />
                    <h3 className="font-headline text-xl font-black text-foreground tracking-tight">{title}</h3>
                </div>
                <div className="h-0.5 w-12 bg-primary/20 mt-1 rounded-full" />
            </div>
        </div>
    );

    const Field = ({ id, label, placeholder, registerKey, className }: { id: string, label: string, placeholder: string, registerKey: any, className?: string }) => (
        <div className={cn("space-y-2.5", className)}>
            <Label htmlFor={id} className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 pl-1">{label}</Label>
            <Textarea 
                id={id} 
                {...register(registerKey)}
                placeholder={placeholder}
                className="min-h-[140px] bg-background/60 border-primary/15 focus-visible:ring-primary focus-visible:border-primary/40 placeholder:text-muted-foreground/50 transition-all duration-200 resize-none shadow-inner p-4 text-sm leading-relaxed"
            />
        </div>
    );

    return (
        <form onSubmit={handleSubmit(onSave)} className="space-y-12 pb-32">
            {/* 1. Visual Identity */}
            <Card className="border-primary/10 shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-primary/5 pb-4">
                    <SectionHeader title="Visual Identity" icon={Palette} number="1" />
                </CardHeader>
                <CardContent className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Field 
                        id="mood"
                        label="Mood & Style Reference"
                        placeholder="Pinterest/Drive link and style keywords e.g., 'Boho, Minimalist, Royal'"
                        registerKey="visualIdentity.moodStyle"
                    />
                    <Field 
                        id="colors"
                        label="Color Palette & Typography"
                        placeholder="Hex codes/color names e.g., 'Dusty Rose, Gold' and font preferences"
                        registerKey="visualIdentity.colorTypography"
                    />
                    <Field 
                        id="dislikes"
                        label="Design Dislikes"
                        placeholder="Specific symbols, motifs, styles, or objects to strictly exclude"
                        registerKey="visualIdentity.designDislikes"
                        className="md:col-span-2"
                    />
                </CardContent>
            </Card>

            {/* 2. The Narrative */}
            <Card className="border-primary/10 shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-primary/5 pb-4">
                    <SectionHeader title="The Narrative" icon={BookOpen} number="2" />
                </CardHeader>
                <CardContent className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Field 
                        id="timeline"
                        label="The Relationship Timeline"
                        placeholder="Chronological highlights: Meeting spot, key trips, moving in, and proposal details"
                        registerKey="narrative.timeline"
                    />
                    <Field 
                        id="couple"
                        label="The Couple's World"
                        placeholder="Shared hobbies, favorite travel destinations, pets, or specific interests"
                        registerKey="narrative.coupleWorld"
                    />
                    <Field 
                        id="eggs"
                        label="Easter Eggs"
                        placeholder="Inside jokes, specific dates, or objects to subtly hide in the artwork"
                        registerKey="narrative.easterEggs"
                        className="md:col-span-2"
                    />
                </CardContent>
            </Card>

            {/* 3. Culture & Symbols */}
            <Card className="border-primary/10 shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-primary/5 pb-4">
                    <SectionHeader title="Culture & Symbols" icon={Globe} number="3" />
                </CardHeader>
                <CardContent className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Field 
                        id="icons"
                        label="Mandatory Icons & Motifs"
                        placeholder="Religious icons e.g., Om, Cross, specific animals e.g., Peacocks, or ancestral patterns"
                        registerKey="cultureSymbols.mandatoryIcons"
                    />
                    <Field 
                        id="nuances"
                        label="Linguistic & Regional Nuances"
                        placeholder="Native phrases, Shlokas, or regional elements e.g., 'Varanasi skyline', 'Punjabi boli'"
                        registerKey="cultureSymbols.regionalNuances"
                    />
                </CardContent>
            </Card>

            {/* 4. Atmosphere & Extras */}
            <Card className="border-primary/10 shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-primary/5 pb-4">
                    <SectionHeader title="Atmosphere & Extras" icon={Sparkles} number="4" />
                </CardHeader>
                <CardContent className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Field 
                        id="personality"
                        label="Venue & Function Personality"
                        placeholder="Setting and mood description for each function e.g., 'Haldi: Yellow garden party'"
                        registerKey="atmosphereExtras.venuePersonality"
                    />
                    <Field 
                        id="other"
                        label="Other Details"
                        placeholder="Any miscellaneous requirements, logistical constraints, or context"
                        registerKey="atmosphereExtras.otherDetails"
                    />
                </CardContent>
            </Card>

            {/* Product Specific Briefs */}
            <div className="space-y-8">
                <div className="flex items-center gap-4 border-b border-primary/10 pb-6">
                    <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                        <Box className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-headline text-2xl font-black text-foreground tracking-tight">Product Specific Briefs</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground/60">Content & Instructions per Deliverable</p>
                    </div>
                </div>
                <div className="grid gap-6">
                    {order.deliverables.map((item) => {
                        const productDef = productCatalog.find(p => p.id === item.productId);
                        
                        return (
                            <Card key={item.id} className="border-primary/15 bg-background/40 hover:bg-background/60 transition-colors shadow-none overflow-hidden">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-6">
                                        <div className="flex flex-col gap-2.5">
                                            <h4 className="font-black text-lg text-foreground font-headline tracking-tight leading-none">{item.productName}</h4>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] font-black uppercase text-primary/70 tracking-tighter">Technical Specs:</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {item.quantity !== undefined && item.quantity !== null && (
                                                        <Badge variant="secondary">Qty: {item.quantity}</Badge>
                                                    )}
                                                    {item.pages !== undefined && item.pages !== null && (
                                                        <Badge variant="secondary">{item.pages} Pages</Badge>
                                                    )}
                                                    {item.variant && <Badge variant="secondary">{item.variant}</Badge>}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-1.5 justify-start md:justify-end max-w-sm">
                                            {/* Custom Fields */}
                                            {item.customFieldValues && Object.entries(item.customFieldValues).map(([key, val]) => {
                                                if (val === null || val === undefined) return null;
                                                const fieldDef = productDef?.customFields?.find(f => f.id === key);
                                                return (
                                                    <Badge key={key} variant="outline">
                                                        {fieldDef?.name || key}: {val}
                                                    </Badge>
                                                );
                                            })}

                                            {/* Addons */}
                                            {item.addons.map(a => (
                                                <Badge key={a.id} variant="outline" className="border-primary/10 text-muted-foreground/70 bg-stone-50/50">
                                                    {a.name}{typeof a.value === 'number' ? `: ${a.value}` : ''}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Textarea 
                                            placeholder={`Enter requirements & specific details for ${item.productName}`}
                                            {...register(`productBriefs.${item.id}`)}
                                            className="bg-white/50 min-h-[140px] border-primary/10 focus-visible:ring-primary focus-visible:border-primary/40 resize-none shadow-sm p-4 text-sm leading-relaxed"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-50 xl:relative xl:bottom-0 xl:left-0 xl:translate-x-0 xl:max-w-none xl:px-0">
                <Button type="submit" className="w-full h-14 text-base font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 rounded-2xl">
                    <Save className="h-5 w-5 mr-3" />
                    Save Creative Data
                </Button>
            </div>
        </form>
    );
}

function Badge({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'secondary' | 'outline', className?: string }) {
    return (
        <span className={cn(
            "inline-flex items-center rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider transition-all",
            variant === 'default' && "bg-primary text-white shadow-sm",
            variant === 'secondary' && "bg-primary/10 text-primary border border-primary/10",
            variant === 'outline' && "border border-stone-300 text-muted-foreground/80 bg-stone-50/50",
            className
        )}>
            {children}
        </span>
    );
}
