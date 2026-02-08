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

    const SectionHeader = ({ title, icon: Icon, number, subtitle }: { title: string, icon: any, number?: string, subtitle?: string }) => (
        <div className="flex items-center gap-4">
            {number && (
                <div className="h-10 w-10 shrink-0 rounded-xl bg-primary text-white flex items-center justify-center font-black text-base shadow-lg shadow-primary/20">
                    {number}
                </div>
            )}
            {!number && (
                <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                    <Icon className="h-5 w-5" />
                </div>
            )}
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    {number && <Icon className="h-4 w-4 text-primary opacity-90" />}
                    <h3 className="font-headline text-2xl font-black text-foreground tracking-tight">{title}</h3>
                </div>
                {subtitle ? (
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 mt-0.5">{subtitle}</p>
                ) : (
                    <div className="h-0.5 w-12 bg-primary/30 mt-1 rounded-full" />
                )}
            </div>
        </div>
    );

    const Field = ({ id, label, placeholder, registerKey, className }: { id: string, label: string, placeholder: string, registerKey: any, className?: string }) => (
        <div className={cn("space-y-2.5", className)}>
            <Label htmlFor={id} className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/70 pl-1">{label}</Label>
            <Textarea 
                id={id} 
                {...register(registerKey)}
                placeholder={placeholder}
                className="min-h-[140px] bg-white/90 border-primary/20 focus-visible:ring-primary/40 focus-visible:border-primary/40 placeholder:text-muted-foreground/50 transition-all duration-200 resize-none shadow-sm p-4 text-sm leading-relaxed font-medium"
            />
        </div>
    );

    return (
        <form onSubmit={handleSubmit(onSave)} className="space-y-16 pb-32">
            {/* 1. Visual Identity */}
            <Card className="border-primary/15 shadow-sm bg-card/60 backdrop-blur-md overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-primary/5 pb-5">
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
            <Card className="border-primary/15 shadow-sm bg-card/60 backdrop-blur-md overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-primary/5 pb-5">
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
            <Card className="border-primary/15 shadow-sm bg-card/60 backdrop-blur-md overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-primary/5 pb-5">
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
            <Card className="border-primary/15 shadow-sm bg-card/60 backdrop-blur-md overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-primary/5 pb-5">
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
            <div className="space-y-10">
                <div className="px-4">
                    <SectionHeader 
                        title="Product Specific Briefs" 
                        icon={Box} 
                        subtitle="Content & Instructions per Deliverable" 
                    />
                </div>
                <div className="grid gap-8">
                    {order.deliverables.map((item) => {
                        const productDef = productCatalog.find(p => p.id === item.productId);
                        
                        return (
                            <Card key={item.id} className="border-primary/15 bg-card/60 backdrop-blur-md hover:bg-card/80 transition-all duration-300 shadow-sm overflow-hidden group">
                                <CardContent className="pt-8">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-6">
                                        <div className="flex flex-col gap-3">
                                            <h4 className="font-black text-xl text-foreground font-headline tracking-tight group-hover:text-primary transition-colors">{item.productName}</h4>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Specifications</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.quantity !== undefined && item.quantity !== null && (
                                                        <CustomBadge variant="secondary">Qty: {item.quantity}</CustomBadge>
                                                    )}
                                                    {item.pages !== undefined && item.pages !== null && (
                                                        <CustomBadge variant="secondary">{item.pages} Pages</CustomBadge>
                                                    )}
                                                    {item.variant && <CustomBadge variant="secondary">{item.variant}</CustomBadge>}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2 justify-start md:justify-end max-w-sm">
                                            {/* Custom Fields */}
                                            {item.customFieldValues && Object.entries(item.customFieldValues).map(([key, val]) => {
                                                if (val === null || val === undefined) return null;
                                                const fieldDef = productDef?.customFields?.find(f => f.id === key);
                                                return (
                                                    <CustomBadge key={key} variant="outline">
                                                        {fieldDef?.name || key}: {val}
                                                    </CustomBadge>
                                                );
                                            })}

                                            {/* Addons */}
                                            {item.addons.map(a => (
                                                <CustomBadge key={a.id} variant="outline" className="border-primary/10 text-foreground/70 bg-white/40">
                                                    {a.name}{typeof a.value === 'number' ? `: ${a.value}` : ''}
                                                </CustomBadge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Textarea 
                                            placeholder={`Enter requirements & specific details for ${item.productName}`}
                                            {...register(`productBriefs.${item.id}`)}
                                            className="bg-white/90 min-h-[160px] border-primary/20 focus-visible:ring-primary/40 focus-visible:border-primary/40 transition-all duration-200 resize-none shadow-sm p-5 text-sm leading-relaxed font-medium"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-50 xl:relative xl:bottom-0 xl:left-0 xl:translate-x-0 xl:max-w-none xl:px-0">
                <Button type="submit" className="w-full h-16 text-base font-black uppercase tracking-[0.25em] shadow-2xl shadow-primary/30 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <Save className="h-5 w-5 mr-3" />
                    Save Creative Data
                </Button>
            </div>
        </form>
    );
}

function CustomBadge({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'secondary' | 'outline', className?: string }) {
    return (
        <span className={cn(
            "inline-flex items-center rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all",
            variant === 'default' && "bg-primary text-white shadow-md",
            variant === 'secondary' && "bg-primary/10 text-primary border border-primary/20",
            variant === 'outline' && "border-2 border-stone-200 text-foreground/80 bg-white/60",
            className
        )}>
            {children}
        </span>
    );
}
