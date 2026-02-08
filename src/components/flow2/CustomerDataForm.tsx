'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Palette, BookOpen, Globe, Sparkles, Box, MessageSquare, ChevronDown, Check } from 'lucide-react';
import type { Order, CustomerData } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CustomerDataFormProps {
  order: Order;
  onSave: (data: CustomerData) => void;
  isSaving?: boolean;
}

/**
 * Auto-growing Textarea Component
 */
const AutoGrowingTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, onInput, ...props }, ref) => {
  const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = () => {
    const element = textAreaRef.current;
    if (element) {
      element.style.height = 'auto';
      element.style.height = `${element.scrollHeight}px`;
    }
  };

  React.useEffect(() => {
    adjustHeight();
  }, [props.value]);

  return (
    <textarea
      {...props}
      ref={(e) => {
        textAreaRef.current = e;
        if (typeof ref === 'function') ref(e);
        else if (ref) ref.current = e;
      }}
      rows={3}
      onInput={(e) => {
        adjustHeight();
        if (onInput) onInput(e);
      }}
      className={cn(
        "flex w-full bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all duration-200",
        className
      )}
    />
  );
});
AutoGrowingTextarea.displayName = "AutoGrowingTextarea";

export function CustomerDataForm({ order, onSave, isSaving }: CustomerDataFormProps) {
  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  const defaultValues = React.useMemo(() => order.customerData || {
    visualIdentity: { moodStyle: '', colorTypography: '', designDislikes: '' },
    narrative: { timeline: '', coupleWorld: '', easterEggs: '' },
    cultureSymbols: { mandatoryIcons: '', regionalNuances: '' },
    atmosphereExtras: { venuePersonality: '', otherDetails: '' },
    productBriefs: {}
  }, [order.customerData]);

  const { register, handleSubmit, watch, reset, setValue } = useForm<CustomerData>({
    defaultValues
  });

  const watchedValues = watch();

  React.useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  // Section Header Component
  const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="flex items-center gap-2 mb-6 group">
      <div className="h-8 w-8 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="font-headline text-lg font-black text-foreground tracking-tight uppercase">{title}</h3>
    </div>
  );

  // Click-to-Edit Field Component
  const EditableField = ({ 
    id, 
    label, 
    placeholder, 
    registerKey,
    value 
  }: { 
    id: string, 
    label: string, 
    placeholder: string, 
    registerKey: any,
    value: string
  }) => {
    const isFocused = focusedField === id;
    const hasValue = value && value.trim().length > 0;

    // In review mode, if it's empty and not focused, we hide it completely
    if (!hasValue && !isFocused) {
      return (
        <div 
          className="group cursor-text py-2 opacity-40 hover:opacity-100 transition-opacity"
          onClick={() => setFocusedField(id)}
        >
          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
          <div className="text-[10px] italic">Click to add {label.toLowerCase()}...</div>
        </div>
      );
    }

    return (
      <div className={cn(
        "space-y-1 group transition-all duration-200 border-l-2 pl-4",
        isFocused ? "border-primary" : "border-transparent"
      )}>
        <Label 
          htmlFor={id} 
          className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/80"
        >
          {label}
        </Label>
        <div className="relative">
          <AutoGrowingTextarea 
            id={id} 
            {...register(registerKey)}
            placeholder={placeholder}
            onFocus={() => setFocusedField(id)}
            onBlur={() => setFocusedField(null)}
            className={cn(
              "font-medium leading-relaxed",
              !isFocused && "border-none shadow-none p-0 cursor-text",
              isFocused && "bg-white border-primary/20 shadow-sm rounded-md"
            )}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
        {/* 1. Visual Identity */}
        <div className="space-y-8">
          <SectionHeader title="Visual Identity" icon={Palette} />
          <div className="space-y-6">
            <EditableField 
              id="mood"
              label="Mood & Style Reference"
              placeholder="Pinterest/Drive link and style keywords e.g., 'Boho, Minimalist, Royal'"
              registerKey="visualIdentity.moodStyle"
              value={watchedValues.visualIdentity?.moodStyle || ''}
            />
            <EditableField 
              id="colors"
              label="Color Palette & Typography"
              placeholder="Hex codes/color names e.g., 'Dusty Rose, Gold' and font preferences"
              registerKey="visualIdentity.colorTypography"
              value={watchedValues.visualIdentity?.colorTypography || ''}
            />
            <EditableField 
              id="dislikes"
              label="Design Dislikes"
              placeholder="Specific symbols, motifs, styles, or objects to strictly exclude"
              registerKey="visualIdentity.designDislikes"
              value={watchedValues.visualIdentity?.designDislikes || ''}
            />
          </div>
        </div>

        {/* 2. The Narrative */}
        <div className="space-y-8">
          <SectionHeader title="The Narrative" icon={BookOpen} />
          <div className="space-y-6">
            <EditableField 
              id="timeline"
              label="Relationship Timeline"
              placeholder="Meeting spot, key trips, moving in, and proposal details"
              registerKey="narrative.timeline"
              value={watchedValues.narrative?.timeline || ''}
            />
            <EditableField 
              id="couple"
              label="The Couple's World"
              placeholder="Shared hobbies, favorite travel destinations, pets, or specific interests"
              registerKey="narrative.coupleWorld"
              value={watchedValues.narrative?.coupleWorld || ''}
            />
            <EditableField 
              id="eggs"
              label="Easter Eggs"
              placeholder="Inside jokes, specific dates, or objects to subtly hide"
              registerKey="narrative.easterEggs"
              value={watchedValues.narrative?.easterEggs || ''}
            />
          </div>
        </div>

        {/* 3. Culture & Symbols */}
        <div className="space-y-8">
          <SectionHeader title="Culture & Symbols" icon={Globe} />
          <div className="space-y-6">
            <EditableField 
              id="icons"
              label="Mandatory Icons & Motifs"
              placeholder="Religious icons, specific animals, or ancestral patterns"
              registerKey="cultureSymbols.mandatoryIcons"
              value={watchedValues.cultureSymbols?.mandatoryIcons || ''}
            />
            <EditableField 
              id="nuances"
              label="Regional Nuances"
              placeholder="Native phrases, Shlokas, or regional elements"
              registerKey="cultureSymbols.regionalNuances"
              value={watchedValues.cultureSymbols?.regionalNuances || ''}
            />
          </div>
        </div>

        {/* 4. Atmosphere & Extras */}
        <div className="space-y-8">
          <SectionHeader title="Atmosphere & Extras" icon={Sparkles} />
          <div className="space-y-6">
            <EditableField 
              id="personality"
              label="Venue Personality"
              placeholder="Setting and mood description for each function"
              registerKey="atmosphereExtras.venuePersonality"
              value={watchedValues.atmosphereExtras?.venuePersonality || ''}
            />
            <EditableField 
              id="other"
              label="Other Details"
              placeholder="Miscellaneous requirements or constraints"
              registerKey="atmosphereExtras.otherDetails"
              value={watchedValues.atmosphereExtras?.otherDetails || ''}
            />
          </div>
        </div>
      </div>

      {/* Product Specific Briefs - Compact List Layout */}
      <div className="pt-8 border-t border-primary/10">
        <SectionHeader title="Product Specific Briefs" icon={Box} />
        
        <div className="grid gap-2">
          {order.deliverables.map((item) => {
            const briefKey = `productBriefs.${item.id}`;
            const briefValue = (watchedValues.productBriefs as any)?.[item.id] || '';
            const isFocused = focusedField === item.id;
            const hasValue = briefValue && briefValue.trim().length > 0;

            return (
              <div 
                key={item.id}
                className={cn(
                  "group flex flex-col md:flex-row items-stretch gap-4 p-4 rounded-xl border bg-card/40 transition-all",
                  isFocused ? "border-primary bg-white shadow-sm ring-1 ring-primary/20" : "border-primary/10 hover:border-primary/20"
                )}
              >
                {/* Left: Metadata */}
                <div className="md:w-1/3 shrink-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-headline font-black text-sm text-foreground uppercase tracking-tight truncate">
                      {item.productName}
                    </h4>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {item.quantity !== undefined && item.quantity !== null && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-black uppercase">
                        Qty: {item.quantity}
                      </span>
                    )}
                    {item.pages !== undefined && item.pages !== null && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-black uppercase">
                        {item.pages} Pages
                      </span>
                    )}
                    {item.variant && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[8px] font-black uppercase">
                        {item.variant}
                      </span>
                    )}
                    {Object.entries(item.customFieldValues || {}).map(([key, val]) => (
                      val !== null && (
                        <span key={key} className="inline-flex items-center px-1.5 py-0.5 rounded border border-primary/10 text-muted-foreground text-[8px] font-black uppercase">
                          {key}: {val}
                        </span>
                      )
                    ))}
                    {item.specialRequest && (
                      <div className="flex items-center gap-1 text-[8px] font-bold text-orange-600 uppercase bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 w-full mt-1">
                        <MessageSquare className="h-2 w-2" />
                        {item.specialRequest}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Input */}
                <div className="flex-1 min-w-0">
                  {(!hasValue && !isFocused) ? (
                    <div 
                      className="h-full flex items-center px-4 cursor-text opacity-30 group-hover:opacity-100 transition-opacity"
                      onClick={() => setFocusedField(item.id)}
                    >
                      <span className="text-[10px] italic">Add requirements for {item.productName.toLowerCase()}...</span>
                    </div>
                  ) : (
                    <AutoGrowingTextarea 
                      placeholder={`Enter requirements & specific details for ${item.productName}`}
                      {...register(briefKey as any)}
                      onFocus={() => setFocusedField(item.id)}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "font-medium bg-transparent",
                        !isFocused && "border-none shadow-none p-0 cursor-text",
                        isFocused && "p-3 border-primary/10 bg-white/50 rounded-md"
                      )}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Persistence Hook (Exposed via ID for Header Button) */}
      <form id="creative-brief-form" onSubmit={handleSubmit(onSave)} className="hidden" />
    </div>
  );
}
