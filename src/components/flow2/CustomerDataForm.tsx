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
        else if (ref) ref.current = e;
      }}
      rows={1}
      onInput={(e) => {
        adjustHeight();
        if (onInput) onInput(e);
      }}
      className={cn(
        "flex w-full bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/65 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all duration-200 overflow-hidden",
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
    <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/15 text-primary flex items-center justify-center shadow-sm border border-primary/10">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="font-headline text-xl font-black text-foreground tracking-tight uppercase border-b-2 border-primary/20 pb-1">
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
        className="group cursor-text py-3 border-l-2 border-primary/5 hover:border-primary/20 pl-4 transition-all duration-200"
        onClick={onFocus}
      >
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">{label}</div>
        <div className="text-xs italic text-muted-foreground/80 font-medium">Click to add {label.toLowerCase()}...</div>
      </div>
    );
  }

  return (
    <div className={cn(
      "space-y-1.5 group transition-all duration-200 border-l-2 pl-4",
      isFocused ? "border-primary" : "border-primary/10"
    )}>
      <Label 
        htmlFor={id} 
        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
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
            "font-medium leading-relaxed text-foreground",
            !isFocused && "border-none shadow-none p-0 cursor-text",
            isFocused && "bg-background border-2 border-primary/20 shadow-sm rounded-lg"
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
        "group flex flex-col md:flex-row items-stretch gap-6 p-5 rounded-2xl border transition-all",
        isFocused 
          ? "border-primary bg-background shadow-md ring-2 ring-primary/5" 
          : "border-primary/10 bg-card/40 hover:bg-card/60 hover:border-primary/20"
      )}
    >
      <div className="md:w-1/3 shrink-0 space-y-3">
        <h4 className="font-headline font-black text-base text-foreground uppercase tracking-tight">
          {item.productName}
        </h4>
        
        <div className="flex flex-wrap gap-2">
          {item.quantity !== undefined && item.quantity !== null && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/20 text-primary-foreground font-black text-[9px] uppercase border border-primary/20 bg-primary/10 text-primary">
              Qty: {item.quantity}
            </span>
          )}
          {item.pages !== undefined && item.pages !== null && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/20 text-primary-foreground font-black text-[9px] uppercase border border-primary/20 bg-primary/10 text-primary">
              {item.pages} Pages
            </span>
          )}
          {item.variant && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-black text-[9px] uppercase border border-border">
              {item.variant}
            </span>
          )}
          {Object.entries(item.customFieldValues || {}).map(([key, val]) => (
            val !== null && (
              <span key={key} className="inline-flex items-center px-2 py-0.5 rounded-md border-2 border-primary/10 text-muted-foreground font-black text-[9px] uppercase">
                {key}: {val}
              </span>
            )
          ))}
          {item.specialRequest && (
            <div className="flex items-center gap-2 text-[9px] font-black text-orange-800 uppercase bg-orange-100 px-2 py-1 rounded-md border border-orange-200 w-full mt-1.5 shadow-sm">
              <MessageSquare className="h-3 w-3 shrink-0" />
              <span className="truncate">{item.specialRequest}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {(!hasValue && !isFocused) ? (
          <div 
            className="h-full flex items-center px-4 cursor-text opacity-50 group-hover:opacity-100 transition-opacity min-h-[2rem]"
            onClick={onFocus}
          >
            <span className="text-xs italic font-medium text-muted-foreground">Add brief details for {item.productName.toLowerCase()}...</span>
          </div>
        ) : (
          <AutoGrowingTextarea 
            placeholder={`Enter requirements & specific details for ${item.productName}`}
            {...register(briefKey as any)}
            onFocus={onFocus}
            onBlur={onBlur}
            autoFocus={isFocused}
            className={cn(
              "font-medium bg-transparent text-foreground",
              !isFocused && "border-none shadow-none p-0 cursor-text",
              isFocused && "p-3 border-2 border-primary/10 bg-background/50 rounded-lg"
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
    <div className="space-y-16 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-20">
        <div className="space-y-10">
          <SectionHeader title="Visual Identity" icon={Palette} />
          <div className="space-y-8">
            <EditableField 
              id="mood"
              label="Mood & Style Reference"
              placeholder="Pinterest/Drive link and style keywords e.g., 'Boho, Minimalist, Royal'"
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
              placeholder="Hex codes/color names e.g., 'Dusty Rose, Gold' and font preferences"
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
              placeholder="Specific symbols, motifs, styles, or objects to strictly exclude"
              register={register}
              registerKey="visualIdentity.designDislikes"
              value={watchedValues.visualIdentity?.designDislikes || ''}
              isFocused={focusedField === 'dislikes'}
              onFocus={() => setFocusedField('dislikes')}
              onBlur={() => setFocusedField(null)}
            />
          </div>
        </div>

        <div className="space-y-10">
          <SectionHeader title="The Narrative" icon={BookOpen} />
          <div className="space-y-8">
            <EditableField 
              id="timeline"
              label="Relationship Timeline"
              placeholder="Meeting spot, key trips, moving in, and proposal details"
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
              placeholder="Shared hobbies, favorite travel destinations, pets, or specific interests"
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
              placeholder="Inside jokes, specific dates, or objects to subtly hide"
              register={register}
              registerKey="narrative.easterEggs"
              value={watchedValues.narrative?.easterEggs || ''}
              isFocused={focusedField === 'eggs'}
              onFocus={() => setFocusedField('eggs')}
              onBlur={() => setFocusedField(null)}
            />
          </div>
        </div>

        <div className="space-y-10">
          <SectionHeader title="Culture & Symbols" icon={Globe} />
          <div className="space-y-8">
            <EditableField 
              id="icons"
              label="Mandatory Icons & Motifs"
              placeholder="Religious icons, specific animals, or ancestral patterns"
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
              placeholder="Native phrases, Shlokas, or regional elements"
              register={register}
              registerKey="cultureSymbols.regionalNuances"
              value={watchedValues.cultureSymbols?.regionalNuances || ''}
              isFocused={focusedField === 'nuances'}
              onFocus={() => setFocusedField('nuances')}
              onBlur={() => setFocusedField(null)}
            />
          </div>
        </div>

        <div className="space-y-10">
          <SectionHeader title="Atmosphere & Extras" icon={Sparkles} />
          <div className="space-y-8">
            <EditableField 
              id="personality"
              label="Venue Personality"
              placeholder="Setting and mood description for each function"
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
              placeholder="Miscellaneous requirements or constraints"
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

      <div className="pt-12 border-t-2 border-primary/10">
        <SectionHeader title="Product Specific Briefs" icon={Box} />
        
        <div className="grid gap-4">
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
