'use client';

import * as React from 'react';
import { useForm, UseFormRegister } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Palette, BookOpen, Globe, Sparkles, Box, MessageSquare, Eye, EyeOff } from 'lucide-react';
import type { Order, CustomerData, ConfiguredProduct } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Auto-growing Textarea Component
 * Optimized for keyboard stability and dynamic height.
 */
const AutoGrowingTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number }
>(({ className, onInput, minRows = 1, ...props }, ref) => {
  const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = () => {
    const element = textAreaRef.current;
    if (element) {
      element.style.height = 'auto';
      // Use scrollHeight to match content, fallback to a sensible minimum if needed
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
      rows={minRows}
      onInput={(e) => {
        adjustHeight();
        if (onInput) onInput(e);
      }}
      className={cn(
        "flex w-full bg-transparent px-3 py-2 text-sm transition-all duration-200 overflow-hidden resize-none focus:outline-none",
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
  <div className="flex items-center gap-3 mb-6 group">
    <div className="h-8 w-8 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
      <Icon className="h-4 w-4" />
    </div>
    <h3 className="font-headline text-sm font-black text-foreground tracking-tight uppercase border-b-2 border-primary/10 pb-0.5">
      {title}
    </h3>
  </div>
);

/**
 * Expert Field Component (Always Rendered for Keyboard Nav)
 */
const EditableField = ({ 
  id, 
  label, 
  register,
  registerKey,
  value,
  showEmpty
}: { 
  id: string, 
  label: string, 
  register: UseFormRegister<CustomerData>,
  registerKey: any,
  value: string,
  showEmpty: boolean
}) => {
  const hasValue = value && value.trim().length > 0;
  
  if (!hasValue && !showEmpty) {
    return (
      <div className="focus-within:block hidden">
        <AutoGrowingTextarea {...register(registerKey)} minRows={1} />
      </div>
    );
  }

  return (
    <div className="space-y-1 group transition-all duration-200 border-l-2 pl-4 border-primary/20 focus-within:border-primary">
      <Label 
        htmlFor={id} 
        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 mb-1 block"
      >
        {label}
      </Label>
      <AutoGrowingTextarea 
        id={id} 
        {...register(registerKey)}
        placeholder="Add details..."
        minRows={1}
        className={cn(
          "font-semibold leading-relaxed text-foreground border-2 rounded-md -ml-3",
          "bg-transparent border-transparent hover:bg-primary/5",
          "focus:bg-background focus:border-primary/40 focus:shadow-sm focus:placeholder:opacity-50",
          "placeholder:italic placeholder:font-normal placeholder:text-muted-foreground/60"
        )}
      />
    </div>
  );
};

/**
 * Product Brief Row Component
 */
const ProductBriefRow = ({
  item,
  register,
  value,
  showEmpty
}: {
  item: ConfiguredProduct,
  register: UseFormRegister<CustomerData>,
  value: string,
  showEmpty: boolean
}) => {
  const briefKey = `productBriefs.${item.id}`;
  const hasValue = value && value.trim().length > 0;

  if (!hasValue && !showEmpty) {
    return (
      <div className="focus-within:grid hidden">
        <AutoGrowingTextarea {...register(briefKey as any)} minRows={2} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 py-4 border-b border-primary/10 last:border-0 group transition-all">
      <div className="space-y-2 pt-1">
        <h4 className="font-headline font-black text-xs text-foreground uppercase tracking-tight">
          {item.productName}
        </h4>
        <div className="flex flex-wrap gap-1">
          {item.quantity !== undefined && item.quantity !== null && (
            <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold text-[9px] uppercase border">
              QTY: {item.quantity}
            </span>
          )}
          {item.pages !== undefined && item.pages !== null && (
            <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold text-[9px] uppercase border">
              {item.pages} PGS
            </span>
          )}
          {item.variant && (
            <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold text-[9px] uppercase border">
              {item.variant}
            </span>
          )}
        </div>
        {item.specialRequest && (
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-orange-800 uppercase bg-orange-50 px-1.5 py-1 rounded border border-orange-200">
            <MessageSquare className="h-2.5 w-2.5 shrink-0" />
            <span className="line-clamp-1">{item.specialRequest}</span>
          </div>
        )}
      </div>

      <div className="relative focus-within:z-10">
        <AutoGrowingTextarea 
          placeholder="Add product requirements..."
          {...register(briefKey as any)}
          minRows={2}
          className={cn(
            "font-semibold bg-transparent text-foreground border-2 rounded-md transition-all -ml-3",
            "border-transparent hover:bg-primary/5",
            "focus:bg-background focus:border-primary/40 focus:shadow-sm focus:placeholder:opacity-50",
            "placeholder:italic placeholder:font-normal placeholder:text-muted-foreground/60"
          )}
        />
      </div>
    </div>
  );
};

export function CustomerDataForm({ order, onSave, isSaving }: { order: Order; onSave: (data: CustomerData) => void; isSaving?: boolean }) {
  const [showEmptyFields, setShowEmptyFields] = React.useState(() => {
    return !order.customerData;
  });

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
    <div className="space-y-12 pb-24 max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b border-primary/10 pb-4">
        <div className="space-y-1">
          <h2 className="text-xl font-headline font-black text-foreground">Creative Briefing</h2>
          <p className="text-xs text-muted-foreground font-medium">Capture visual and narrative context for design production.</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowEmptyFields(!showEmptyFields)}
          className={cn(
            "h-8 gap-2 font-bold text-[10px] uppercase tracking-widest",
            showEmptyFields ? "text-primary bg-primary/5" : "text-muted-foreground"
          )}
        >
          {showEmptyFields ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showEmptyFields ? "Hide Empty" : "Show All Fields"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
        <div className="space-y-10">
          <section>
            <SectionHeader title="Visual Identity" icon={Palette} />
            <div className="space-y-6">
              <EditableField 
                id="mood"
                label="Mood & Style Reference"
                register={register}
                registerKey="visualIdentity.moodStyle"
                value={watchedValues.visualIdentity?.moodStyle || ''}
                showEmpty={showEmptyFields}
              />
              <EditableField 
                id="colors"
                label="Color Palette & Typography"
                register={register}
                registerKey="visualIdentity.colorTypography"
                value={watchedValues.visualIdentity?.colorTypography || ''}
                showEmpty={showEmptyFields}
              />
              <EditableField 
                id="dislikes"
                label="Design Dislikes"
                register={register}
                registerKey="visualIdentity.designDislikes"
                value={watchedValues.visualIdentity?.designDislikes || ''}
                showEmpty={showEmptyFields}
              />
            </div>
          </section>

          <section>
            <SectionHeader title="Culture & Symbols" icon={Globe} />
            <div className="space-y-6">
              <EditableField 
                id="icons"
                label="Mandatory Icons & Motifs"
                register={register}
                registerKey="cultureSymbols.mandatoryIcons"
                value={watchedValues.cultureSymbols?.mandatoryIcons || ''}
                showEmpty={showEmptyFields}
              />
              <EditableField 
                id="nuances"
                label="Regional Nuances"
                register={register}
                registerKey="cultureSymbols.regionalNuances"
                value={watchedValues.cultureSymbols?.regionalNuances || ''}
                showEmpty={showEmptyFields}
              />
            </div>
          </section>
        </div>

        <div className="space-y-10">
          <section>
            <SectionHeader title="The Narrative" icon={BookOpen} />
            <div className="space-y-6">
              <EditableField 
                id="timeline"
                label="Relationship Timeline"
                register={register}
                registerKey="narrative.timeline"
                value={watchedValues.narrative?.timeline || ''}
                showEmpty={showEmptyFields}
              />
              <EditableField 
                id="couple"
                label="The Couple's World"
                register={register}
                registerKey="narrative.coupleWorld"
                value={watchedValues.narrative?.coupleWorld || ''}
                showEmpty={showEmptyFields}
              />
              <EditableField 
                id="eggs"
                label="Easter Eggs"
                register={register}
                registerKey="narrative.easterEggs"
                value={watchedValues.narrative?.easterEggs || ''}
                showEmpty={showEmptyFields}
              />
            </div>
          </section>

          <section>
            <SectionHeader title="Atmosphere & Extras" icon={Sparkles} />
            <div className="space-y-6">
              <EditableField 
                id="personality"
                label="Venue Personality"
                register={register}
                registerKey="atmosphereExtras.venuePersonality"
                value={watchedValues.atmosphereExtras?.venuePersonality || ''}
                showEmpty={showEmptyFields}
              />
              <EditableField 
                id="other"
                label="Other Details"
                register={register}
                registerKey="atmosphereExtras.otherDetails"
                value={watchedValues.atmosphereExtras?.otherDetails || ''}
                showEmpty={showEmptyFields}
              />
            </div>
          </section>
        </div>
      </div>

      <section className="pt-8 border-t border-primary/10">
        <SectionHeader title="Product Specific Briefs" icon={Box} />
        
        <div className="bg-card/30 rounded-xl px-6 border border-primary/5">
          {order.deliverables.length === 0 ? (
            <div className="py-8 text-center italic text-muted-foreground text-sm">No products in scope. Add products in the Overview tab.</div>
          ) : (
            <div className="flex flex-col">
              {order.deliverables.map((item) => (
                <ProductBriefRow 
                  key={item.id}
                  item={item}
                  register={register}
                  value={(watchedValues.productBriefs as any)?.[item.id] || ''}
                  showEmpty={showEmptyFields}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <form id="creative-brief-form" onSubmit={handleSubmit(onSave)} className="hidden" />
    </div>
  );
}