'use client';

import * as React from 'react';
import { useForm, UseFormRegister } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Palette, BookOpen, Globe, Sparkles, Box, MessageSquare } from 'lucide-react';
import type { Order, CustomerData, ConfiguredProduct } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Auto-growing Textarea Component with Dynamic Height Logic
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
    const timer = setTimeout(adjustHeight, 0);
    return () => clearTimeout(timer);
  }, [props.value, className]);

  return (
    <textarea
      {...props}
      ref={(e) => {
        textAreaRef.current = e;
        if (typeof ref === 'function') ref(e);
        else if (ref) ref(e);
      }}
      rows={1}
      onInput={(e) => {
        adjustHeight();
        if (onInput) onInput(e);
      }}
      className={cn(
        "flex w-full bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all duration-200 overflow-hidden border-2",
        "placeholder:italic placeholder:text-[11px] placeholder:opacity-40 placeholder:font-normal",
        className
      )}
    />
  );
});
AutoGrowingTextarea.displayName = "AutoGrowingTextarea";

/**
 * Section Header Component
 */
const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <div className="flex items-center gap-3 mb-8 group">
    <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center border-2 border-primary/30 shadow-sm">
      <Icon className="h-4 w-4" />
    </div>
    <h3 className="font-headline text-lg font-black text-foreground tracking-tight uppercase border-b-2 border-primary/40 pb-1">
      {title}
    </h3>
  </div>
);

/**
 * Editable Field Component
 */
const EditableField = ({ 
  id, 
  label, 
  placeholder, 
  register,
  registerKey,
  value,
  isFocused,
  onFocus,
  onBlur
}: { 
  id: string, 
  label: string, 
  placeholder: string, 
  register: UseFormRegister<CustomerData>,
  registerKey: any,
  value: string,
  isFocused: boolean,
  onFocus: () => void,
  onBlur: () => void
}) => {
  const hasValue = value && value.trim().length > 0;

  if (!hasValue && !isFocused) {
    return (
      <div 
        className="group cursor-pointer py-2 border-l-2 border-primary/25 hover:border-primary/50 pl-4 transition-all duration-200"
        onClick={onFocus}
      >
        <div className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-1">{label}</div>
        <div className="text-xs italic text-muted-foreground/80 font-medium">Click to add {label.toLowerCase()}...</div>
      </div>
    );
  }

  return (
    <div className={cn(
      "space-y-1 group transition-all duration-200 border-l-2 pl-4",
      isFocused ? "border-primary" : "border-primary/40"
    )}>
      <Label 
        htmlFor={id} 
        className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-1 block"
      >
        {label}
      </Label>
      <div className="relative">
        <AutoGrowingTextarea 
          id={id} 
          {...register(registerKey)}
          placeholder={placeholder}
          onFocus={onFocus}
          onBlur={onBlur}
          autoFocus={isFocused}
          className={cn(
            "font-semibold leading-relaxed text-foreground border-2 p-3 transition-all",
            isFocused 
              ? "bg-primary/5 border-primary/50 shadow-sm rounded-lg" 
              : "border-transparent bg-transparent shadow-none cursor-text -ml-3" 
          )}
        />
      </div>
    </div>
  );
};

/**
 * Product Brief Item Component
 */
const ProductBriefItem = ({
  item,
  register,
  value,
  isFocused,
  onFocus,
  onBlur
}: {
  item: ConfiguredProduct,
  register: UseFormRegister<CustomerData>,
  value: string,
  isFocused: boolean,
  onFocus: () => void,
  onBlur: () => void
}) => {
  const briefKey = `productBriefs.${item.id}`;
  const hasValue = value && value.trim().length > 0;

  return (
    <div 
      className={cn(
        "group flex flex-col md:flex-row items-stretch gap-4 p-4 rounded-xl border-2 transition-all",
        isFocused 
          ? "border-primary/50 bg-primary/5 shadow-md" 
          : "border-primary/20 bg-card/40 hover:bg-card/60"
      )}
    >
      <div className="md:w-1/3 shrink-0 space-y-2.5">
        <h4 className="font-headline font-black text-sm text-foreground uppercase tracking-tight">
          {item.productName}
        </h4>
        
        <div className="flex flex-wrap gap-1.5">
          {item.quantity !== undefined && item.quantity !== null && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/15 text-primary font-black text-[9px] uppercase border-2 border-primary/30">
              QTY: {item.quantity}
            </span>
          )}
          {item.pages !== undefined && item.pages !== null && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/15 text-primary font-black text-[9px] uppercase border-2 border-primary/30">
              {item.pages} PGS
            </span>
          )}
          {item.variant && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-black text-[9px] uppercase border-2 border-border/60">
              {item.variant}
            </span>
          )}
          {item.specialRequest && (
            <div className="flex items-center gap-1.5 text-[9px] font-black text-orange-950 uppercase bg-orange-200 px-1.5 py-0.5 rounded border-2 border-orange-300 w-full">
              <MessageSquare className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{item.specialRequest}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {(!hasValue && !isFocused) ? (
          <div 
            className="h-full flex items-center px-3 cursor-pointer opacity-80 group-hover:opacity-100 transition-opacity min-h-[2.5rem]"
            onClick={onFocus}
          >
            <span className="text-xs italic font-medium text-muted-foreground">Add brief details for {item.productName.toLowerCase()}...</span>
          </div>
        ) : (
          <AutoGrowingTextarea 
            placeholder={`Enter requirements for ${item.productName}`}
            {...register(briefKey as any)}
            onFocus={onFocus}
            onBlur={onBlur}
            autoFocus={isFocused}
            className={cn(
              "font-semibold bg-transparent text-foreground border-2 p-3",
              isFocused 
                ? "border-primary/30 bg-background/50 rounded-lg shadow-sm" 
                : "border-transparent shadow-none -ml-3 cursor-text"
            )}
          />
        )}
      </div>
    </div>
  );
};

export function CustomerDataForm({ order, onSave, isSaving }: { order: Order; onSave: (data: CustomerData) => void; isSaving?: boolean }) {
  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  const defaultValues = React.useMemo(() => order.customerData || {
    visualIdentity: { moodStyle: '', colorTypography: '', designDislikes: '' },
    narrative: { timeline: '', coupleWorld: '', easterEggs: '' },
    cultureSymbols: { mandatoryIcons: '', regionalNuances: '' },
    atmosphereExtras: { venuePersonality: '', otherDetails: '' },
    productBriefs: {}
  }, [order.customerData]);

  const { register, handleSubmit, watch, reset } = useForm<CustomerData>({
    defaultValues
  });

  const watchedValues = watch();

  React.useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <div className="space-y-12 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
        <div className="space-y-8">
          <SectionHeader title="Visual Identity" icon={Palette} />
          <div className="space-y-6">
            <EditableField 
              id="mood"
              label="Mood & Style Reference"
              placeholder="Pinterest/Drive links or keywords like 'Minimalist', 'Regal', etc."
              register={register}
              registerKey="visualIdentity.moodStyle"
              value={watchedValues.visualIdentity?.moodStyle || ''}
              isFocused={focusedField === 'mood'}
              onFocus={() => setFocusedField('mood')}
              onBlur={() => setFocusedField(null)}
            />
            <EditableField 
              id="colors"
              label="Color Palette & Typography"
              placeholder="Primary colors, accent shades, and preferred font styles"
              register={register}
              registerKey="visualIdentity.colorTypography"
              value={watchedValues.visualIdentity?.colorTypography || ''}
              isFocused={focusedField === 'colors'}
              onFocus={() => setFocusedField('colors')}
              onBlur={() => setFocusedField(null)}
            />
            <EditableField 
              id="dislikes"
              label="Design Dislikes"
              placeholder="Elements, motifs, or styles to strictly avoid"
              register={register}
              registerKey="visualIdentity.designDislikes"
              value={watchedValues.visualIdentity?.designDislikes || ''}
              isFocused={focusedField === 'dislikes'}
              onFocus={() => setFocusedField('dislikes')}
              onBlur={() => setFocusedField(null)}
            />
          </div>
        </div>

        <div className="space-y-8">
          <SectionHeader title="The Narrative" icon={BookOpen} />
          <div className="space-y-6">
            <EditableField 
              id="timeline"
              label="Relationship Timeline"
              placeholder="Meeting spot, key life moments, and proposal details"
              register={register}
              registerKey="narrative.timeline"
              value={watchedValues.narrative?.timeline || ''}
              isFocused={focusedField === 'timeline'}
              onFocus={() => setFocusedField('timeline')}
              onBlur={() => setFocusedField(null)}
            />
            <EditableField 
              id="couple"
              label="The Couple's World"
              placeholder="Shared hobbies, pets, or travel destinations"
              register={register}
              registerKey="narrative.coupleWorld"
              value={watchedValues.narrative?.coupleWorld || ''}
              isFocused={focusedField === 'couple'}
              onFocus={() => setFocusedField('couple')}
              onBlur={() => setFocusedField(null)}
            />
            <EditableField 
              id="eggs"
              label="Easter Eggs"
              placeholder="Inside jokes or subtle motifs to hide in designs"
              register={register}
              registerKey="narrative.easterEggs"
              value={watchedValues.narrative?.easterEggs || ''}
              isFocused={focusedField === 'eggs'}
              onFocus={() => setFocusedField('eggs')}
              onBlur={() => setFocusedField(null)}
            />
          </div>
        </div>

        <div className="space-y-8">
          <SectionHeader title="Culture & Symbols" icon={Globe} />
          <div className="space-y-6">
            <EditableField 
              id="icons"
              label="Mandatory Icons & Motifs"
              placeholder="Religious symbols, family crests, or ancestral patterns"
              register={register}
              registerKey="cultureSymbols.mandatoryIcons"
              value={watchedValues.cultureSymbols?.mandatoryIcons || ''}
              isFocused={focusedField === 'icons'}
              onFocus={() => setFocusedField('icons')}
              onBlur={() => setFocusedField(null)}
            />
            <EditableField 
              id="nuances"
              label="Regional Nuances"
              placeholder="Specific phrases, shlokas, or local cultural elements"
              register={register}
              registerKey="cultureSymbols.regionalNuances"
              value={watchedValues.cultureSymbols?.regionalNuances || ''}
              isFocused={focusedField === 'nuances'}
              onFocus={() => setFocusedField('nuances')}
              onBlur={() => setFocusedField(null)}
            />
          </div>
        </div>

        <div className="space-y-8">
          <SectionHeader title="Atmosphere & Extras" icon={Sparkles} />
          <div className="space-y-6">
            <EditableField 
              id="personality"
              label="Venue Personality"
              placeholder="Atmosphere and setting description for each event"
              register={register}
              registerKey="atmosphereExtras.venuePersonality"
              value={watchedValues.atmosphereExtras?.venuePersonality || ''}
              isFocused={focusedField === 'personality'}
              onFocus={() => setFocusedField('personality')}
              onBlur={() => setFocusedField(null)}
            />
            <EditableField 
              id="other"
              label="Other Details"
              placeholder="Any miscellaneous constraints or requirements"
              register={register}
              registerKey="atmosphereExtras.otherDetails"
              value={watchedValues.atmosphereExtras?.otherDetails || ''}
              isFocused={focusedField === 'other'}
              onFocus={() => setFocusedField('other')}
              onBlur={() => setFocusedField(null)}
            />
          </div>
        </div>
      </div>

      <div className="pt-8 border-t-2 border-primary/20">
        <SectionHeader title="Product Specific Briefs" icon={Box} />
        
        <div className="grid gap-3">
          {order.deliverables.map((item) => (
            <ProductBriefItem 
              key={item.id}
              item={item}
              register={register}
              value={(watchedValues.productBriefs as any)?.[item.id] || ''}
              isFocused={focusedField === item.id}
              onFocus={() => setFocusedField(item.id)}
              onBlur={() => setFocusedField(null)}
            />
          ))}
        </div>
      </div>

      <form id="creative-brief-form" onSubmit={handleSubmit(onSave)} className="hidden" />
    </div>
  );
}
