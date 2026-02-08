'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Save, Palette, BookOpen, Globe, Sparkles, Box } from 'lucide-react';
import type { Order, CustomerData } from '@/lib/types';
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
        <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {number}
            </div>
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="font-headline text-xl font-bold text-foreground">{title}</h3>
        </div>
    );

    const Field = ({ id, label, helper, registerKey }: { id: string, label: string, helper: string, registerKey: any }) => (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
            <Textarea 
                id={id} 
                {...register(registerKey)}
                className="min-h-[100px] border-primary/20 focus-visible:ring-primary"
            />
            <p className="text-[10px] font-medium text-primary/70">{helper}</p>
        </div>
    );

    return (
        <form onSubmit={handleSubmit(onSave)} className="space-y-12 pb-20">
            {/* 1. Visual Identity */}
            <Card className="border-primary/10 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                    <SectionHeader title="Visual Identity" icon={Palette} number="1" />
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <Field 
                        id="mood"
                        label="Mood & Style Reference"
                        helper="Pinterest/Drive link and style keywords e.g., 'Boho, Minimalist, Royal'"
                        registerKey="visualIdentity.moodStyle"
                    />
                    <Field 
                        id="colors"
                        label="Color Palette & Typography"
                        helper="Hex codes/color names e.g., 'Dusty Rose, Gold' and font preferences"
                        registerKey="visualIdentity.colorTypography"
                    />
                    <Field 
                        id="dislikes"
                        label="Design Dislikes"
                        helper="Specific symbols, motifs, styles, or objects to strictly exclude"
                        registerKey="visualIdentity.designDislikes"
                    />
                </CardContent>
            </Card>

            {/* 2. The Narrative */}
            <Card className="border-primary/10 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                    <SectionHeader title="The Narrative" icon={BookOpen} number="2" />
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <Field 
                        id="timeline"
                        label="The Relationship Timeline"
                        helper="Chronological highlights: Meeting spot, key trips, moving in, and proposal details"
                        registerKey="narrative.timeline"
                    />
                    <Field 
                        id="couple"
                        label="The Couple's World"
                        helper="Shared hobbies, favorite travel destinations, pets, or specific interests"
                        registerKey="narrative.coupleWorld"
                    />
                    <Field 
                        id="eggs"
                        label="Easter Eggs"
                        helper="Inside jokes, specific dates, or objects to subtly hide in the artwork"
                        registerKey="narrative.easterEggs"
                    />
                </CardContent>
            </Card>

            {/* 3. Culture & Symbols */}
            <Card className="border-primary/10 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                    <SectionHeader title="Culture & Symbols" icon={Globe} number="3" />
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <Field 
                        id="icons"
                        label="Mandatory Icons & Motifs"
                        helper="Religious icons e.g., Om, Cross, specific animals e.g., Peacocks, or ancestral patterns"
                        registerKey="cultureSymbols.mandatoryIcons"
                    />
                    <Field 
                        id="nuances"
                        label="Linguistic & Regional Nuances"
                        helper="Native phrases, Shlokas, or regional elements e.g., 'Varanasi skyline', 'Punjabi boli'"
                        registerKey="cultureSymbols.regionalNuances"
                    />
                </CardContent>
            </Card>

            {/* 4. Atmosphere & Extras */}
            <Card className="border-primary/10 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                    <SectionHeader title="Atmosphere & Extras" icon={Sparkles} number="4" />
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <Field 
                        id="personality"
                        label="Venue & Function Personality"
                        helper="Setting and mood description for each function e.g., 'Haldi: Yellow garden party'"
                        registerKey="atmosphereExtras.venuePersonality"
                    />
                    <Field 
                        id="other"
                        label="Other Details"
                        helper="Any miscellaneous requirements, logistical constraints, or context"
                        registerKey="atmosphereExtras.otherDetails"
                    />
                </CardContent>
            </Card>

            {/* Product Specific Briefs */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Box className="h-5 w-5 text-primary" />
                    <h3 className="font-headline text-2xl font-bold text-foreground">Product Specific Briefs</h3>
                </div>
                <div className="grid gap-4">
                    {order.deliverables.map((item) => (
                        <Card key={item.id} className="border-primary/20 bg-card/50">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold text-lg text-foreground">{item.productName}</h4>
                                    <div className="flex gap-2">
                                        {item.variant && <Badge variant="secondary">{item.variant}</Badge>}
                                        {item.addons.map(a => (
                                            <Badge key={a.id} variant="outline" className="text-[10px]">
                                                {a.name}{typeof a.value === 'number' ? `: ${a.value}` : ''}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Requirements & Design Instructions</Label>
                                    <Textarea 
                                        placeholder={`Enter requirements & specific details for ${item.productName}`}
                                        {...register(`productBriefs.${item.id}`)}
                                        className="bg-background/80"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <Button type="submit" className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20">
                <Save className="h-5 w-5 mr-2" />
                Save Data
            </Button>
        </form>
    );
}

function Badge({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'secondary' | 'outline', className?: string }) {
    return (
        <span className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
            variant === 'default' && "bg-primary text-white",
            variant === 'secondary' && "bg-primary/10 text-primary",
            variant === 'outline' && "border border-primary/20 text-muted-foreground",
            className
        )}>
            {children}
        </span>
    );
}
