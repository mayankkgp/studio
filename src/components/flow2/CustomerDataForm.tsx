'use client';

import * as React from 'react';
import { useForm, UseFormRegister } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Palette, BookOpen, Globe, Sparkles, Box, Circle, Search, X } from 'lucide-react';
import type { Order, CustomerData, ConfiguredProduct } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { productCatalog } from '@/lib/product-data';

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
        "flex w-full bg-transparent px-3 py-2 text-[14px] transition-all duration-200 overflow-hidden resize-none focus:outline-none",
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
    <h3 className="font-headline text-[15px] font-black text-foreground tracking-tight uppercase border-b-2 border-primary/10 pb-0.5">
      {title}
    </h3>
  </div>
);

/**
 * Expert Field Component
 */
const EditableField = ({ 
  id, 
  label, 
  register,
  registerKey,
  value,
  isEditMode,
  onFocusChange
}: { 
  id: string, 
  label: string, 
  register: UseFormRegister<CustomerData>,
  registerKey: any,
  value: string,
  isEditMode: boolean,
  onFocusChange?: (key: string, isFocused: boolean) => void
}) => {
  const [localFocus, setLocalFocus] = React.useState(false);
  const isEmpty = !value || value.trim().length === 0;
  
  // Only hide if NOT in edit mode AND it's empty AND it's not focused
  if (!isEditMode && isEmpty && !localFocus) return null;

  const { onBlur: regOnBlur, onFocus: regOnFocus, ...regRest } = register(registerKey);

  return (
    <div className="mb-8 group transition-all duration-200 border-l-2 pl-4 border-primary/20 focus-within:border-primary break-inside-avoid">
      <Label 
        htmlFor={id} 
        className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2 block"
      >
        {label}
      </Label>
      <AutoGrowingTextarea 
        id={id} 
        {...regRest}
        readOnly={!isEditMode}
        onFocus={(e) => {
          setLocalFocus(true);
          onFocusChange?.(String(registerKey), true);
          if (regOnFocus) regOnFocus(e);
        }}
        onBlur={(e) => {
          setLocalFocus(false);
          onFocusChange?.(String(registerKey), false);
          if (regOnBlur) regOnBlur(e);
        }}
        placeholder={isEditMode ? "Enter creative brief details..." : "No data recorded"}
        minRows={1}
        className={cn(
          "font-semibold leading-relaxed text-foreground border-2 rounded-md -ml-3",
          "bg-transparent border-transparent",
          isEditMode && "hover:bg-primary/5 focus:bg-background focus:border-primary/40 focus:ring-4 focus:ring-primary/5 focus:shadow-sm focus:px-3",
          !isEditMode && "cursor-default",
          "placeholder:italic placeholder:font-normal placeholder:text-muted-foreground placeholder:text-[13px] placeholder:opacity-100"
        )}
      />
    </div>
  );
};

export function CustomerDataForm({ 
    order, 
    onSave, 
    isSaving,
    isEditMode = false,
    onEnterEditMode
}: { 
    order: Order; 
    onSave: (data: CustomerData) => void; 
    isSaving?: boolean;
    isEditMode?: boolean;
    onEnterEditMode?: () => void;
}) {
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(
    order.deliverables.length > 0 ? order.deliverables[0].id : null
  );

  const [productSearchQuery, setProductSearchQuery] = React.useState('');
  const [focusedFields, setFocusedFields] = React.useState<Record<string, boolean>>({});

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

  const handleFocusChange = (key: string, isFocused: boolean) => {
    setFocusedFields(prev => ({ ...prev, [key]: isFocused }));
  };

  // Section visibility checks for View Mode
  const isSectionActive = (section: any, prefix: string) => {
    if (!section) return false;
    const hasData = Object.values(section).some(val => val && (typeof val === 'string' && val.trim().length > 0));
    const hasFocus = Object.keys(section).some(key => focusedFields[`${prefix}.${key}`]);
    return hasData || hasFocus;
  };

  const isVisualVisible = isEditMode || isSectionActive(watchedValues.visualIdentity, 'visualIdentity');
  const isNarrativeVisible = isEditMode || isSectionActive(watchedValues.narrative, 'narrative');
  const isCultureVisible = isEditMode || isSectionActive(watchedValues.cultureSymbols, 'cultureSymbols');
  const isAtmosphereVisible = isEditMode || isSectionActive(watchedValues.atmosphereExtras, 'atmosphereExtras');

  const isGenericDataVisible = isVisualVisible || isNarrativeVisible || isCultureVisible || isAtmosphereVisible;

  // Filter deliverables based on data presence and focus
  const visibleDeliverables = React.useMemo(() => {
    let list = order.deliverables;
    
    if (!isEditMode) {
      list = list.filter(item => {
        const brief = (watchedValues.productBriefs as any)?.[item.id];
        const isFocused = focusedFields[`productBriefs.${item.id}`];
        const isSelected = selectedProductId === item.id;
        return (brief && brief.trim().length > 0) || isFocused || isSelected;
      });
    }

    if (productSearchQuery.trim()) {
      const q = productSearchQuery.toLowerCase();
      list = list.filter(item => item.productName.toLowerCase().includes(q));
    }

    return list;
  }, [order.deliverables, isEditMode, productSearchQuery, watchedValues.productBriefs, focusedFields, selectedProductId]);

  // Logic to hide the entire Product Briefs section in View Mode if no data exists
  const isProductBriefsSectionVisible = React.useMemo(() => {
    if (isEditMode) return true;
    // Section visible if any visible deliverable has content or is focused
    return visibleDeliverables.some(item => {
        const brief = (watchedValues.productBriefs as any)?.[item.id];
        const isFocused = focusedFields[`productBriefs.${item.id}`];
        return (brief && brief.trim().length > 0) || isFocused;
    });
  }, [isEditMode, visibleDeliverables, watchedValues.productBriefs, focusedFields]);

  // Ensure selection stays valid
  React.useEffect(() => {
    if (visibleDeliverables.length > 0) {
      const stillVisible = visibleDeliverables.some(d => d.id === selectedProductId);
      if (!stillVisible) {
        setSelectedProductId(visibleDeliverables[0].id);
      }
    } else if (!isEditMode) {
      setSelectedProductId(null);
    }
  }, [visibleDeliverables, selectedProductId, isEditMode]);

  const getProductSpecsSummary = (item: ConfiguredProduct) => {
    const product = productCatalog.find(p => p.id === item.productId);
    const parts: React.ReactNode[] = [];
    
    if (item.variant) {
      parts.push(<span key="variant" className="font-black text-foreground">{item.variant}</span>);
    }

    if (product?.configType === 'A' && typeof item.quantity === 'number' && item.quantity > 0) {
      parts.push(<span key="qty" className="font-bold">Qty: {item.quantity}</span>);
    } else if (product?.configType === 'B' && typeof item.pages === 'number' && item.pages > 0) {
      parts.push(<span key="pages" className="font-bold">{item.pages} Pgs</span>);
    }

    if (product?.customFields && item.customFieldValues) {
      product.customFields.forEach(field => {
        const val = (item.customFieldValues as any)?.[field.id];
        if (val && typeof val === 'number' && val > 0) {
          parts.push(<span key={field.id} className="font-bold">{field.name}: {val}</span>);
        }
      });
    }

    const activeAddons = (item.addons || []).filter((a: any) => a.value !== undefined && a.value !== false && a.value !== null);
    if (activeAddons.length > 0) {
      const addonsDisplay = activeAddons.map(a => {
        const valDisplay = typeof a.value === 'number' ? `: ${a.value}` : '';
        return `${a.name}${valDisplay}`;
      }).join(', ');
      parts.push(<span key="addons-label" className="font-black text-primary">Add-on: {addonsDisplay}</span>);
    }

    if (item.specialRequest) {
      parts.push(<span key="special" className="italic font-bold text-destructive">Note: {item.specialRequest}</span>);
    }

    return parts.length > 0 
      ? parts.reduce((prev, curr, i) => [prev, <span key={`sep-${i}`} className="mx-2 text-muted-foreground/30 font-black tracking-tighter">•</span>, curr])
      : null;
  };

  // Overall empty state for View Mode
  if (!isEditMode && !isGenericDataVisible && !isProductBriefsSectionVisible) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground animate-in fade-in zoom-in-95 duration-500">
        <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mb-6 border-2 border-dashed border-muted/50">
          <Sparkles className="h-10 w-10 opacity-30" />
        </div>
        <h3 className="text-xl font-headline font-black uppercase tracking-[0.2em] mb-3 text-muted-foreground">No Data Recorded</h3>
        <p className="text-sm font-semibold text-center max-w-sm leading-relaxed px-4">
          The creative brief is currently empty. Switch to <button type="button" onClick={onEnterEditMode} className="text-primary font-black uppercase tracking-wider hover:underline focus:outline-none">EDIT MODE</button> to begin building the narrative.
        </p>
      </div>
    );
  }

  const selectedItem = order.deliverables.find(d => d.id === selectedProductId);

  return (
    <div className="pb-24 max-w-6xl mx-auto relative animate-in fade-in duration-500">
      {/* Masonry Layout for General Sections */}
      {isGenericDataVisible && (
        <section className={cn(
          "columns-1 md:columns-2 gap-8 space-y-8",
          isEditMode ? "mt-12" : "mt-4"
        )}>
          {isVisualVisible && (
            <div className="break-inside-avoid">
              <SectionHeader title="Visual Identity" icon={Palette} />
              <EditableField 
                id="mood"
                label="Mood & Style Reference"
                register={register}
                registerKey="visualIdentity.moodStyle"
                value={watchedValues.visualIdentity?.moodStyle || ''}
                isEditMode={isEditMode}
                onFocusChange={handleFocusChange}
              />
              <EditableField 
                id="colors"
                label="Color Palette & Typography"
                register={register}
                registerKey="visualIdentity.colorTypography"
                value={watchedValues.visualIdentity?.colorTypography || ''}
                isEditMode={isEditMode}
                onFocusChange={handleFocusChange}
              />
              <EditableField 
                id="dislikes"
                label="Design Dislikes"
                register={register}
                registerKey="visualIdentity.designDislikes"
                value={watchedValues.visualIdentity?.designDislikes || ''}
                isEditMode={isEditMode}
                onFocusChange={handleFocusChange}
              />
            </div>
          )}

          {isCultureVisible && (
            <div className="break-inside-avoid">
              <SectionHeader title="Culture & Symbols" icon={Globe} />
              <EditableField 
                id="icons"
                label="Mandatory Icons & Motifs"
                register={register}
                registerKey="cultureSymbols.mandatoryIcons"
                value={watchedValues.cultureSymbols?.mandatoryIcons || ''}
                isEditMode={isEditMode}
                onFocusChange={handleFocusChange}
              />
              <EditableField 
                id="nuances"
                label="Regional Nuances"
                register={register}
                registerKey="cultureSymbols.regionalNuances"
                value={watchedValues.cultureSymbols?.regionalNuances || ''}
                isEditMode={isEditMode}
                onFocusChange={handleFocusChange}
              />
            </div>
          )}

          {isNarrativeVisible && (
            <div className="break-inside-avoid">
              <SectionHeader title="The Narrative" icon={BookOpen} />
              <EditableField 
                id="timeline"
                label="Relationship Timeline"
                register={register}
                registerKey="narrative.timeline"
                value={watchedValues.narrative?.timeline || ''}
                isEditMode={isEditMode}
                onFocusChange={handleFocusChange}
              />
              <EditableField 
                id="couple"
                label="The Couple's World"
                register={register}
                registerKey="narrative.coupleWorld"
                value={watchedValues.narrative?.coupleWorld || ''}
                isEditMode={isEditMode}
                onFocusChange={handleFocusChange}
              />
              <EditableField 
                id="eggs"
                label="Easter Eggs"
                register={register}
                registerKey="narrative.easterEggs"
                value={watchedValues.narrative?.easterEggs || ''}
                isEditMode={isEditMode}
                onFocusChange={handleFocusChange}
              />
            </div>
          )}

          {isAtmosphereVisible && (
            <div className="break-inside-avoid">
              <SectionHeader title="Atmosphere & Extras" icon={Sparkles} />
              <EditableField 
                id="personality"
                label="Venue Personality"
                register={register}
                registerKey="atmosphereExtras.venuePersonality"
                value={watchedValues.atmosphereExtras?.venuePersonality || ''}
                isEditMode={isEditMode}
                onFocusChange={handleFocusChange}
              />
              <EditableField 
                id="other"
                label="Other Details"
                register={register}
                registerKey="atmosphereExtras.otherDetails"
                value={watchedValues.atmosphereExtras?.otherDetails || ''}
                isEditMode={isEditMode}
                onFocusChange={handleFocusChange}
              />
            </div>
          )}
        </section>
      )}

      {/* Master-Detail View for Product Briefs */}
      {isProductBriefsSectionVisible && (
        <section className={cn(
          isGenericDataVisible ? "mt-16 pt-16 border-t border-primary/10" : "mt-8"
        )}>
          <SectionHeader title="Product Specific Briefs" icon={Box} />
          
          <div className="flex flex-col md:flex-row h-[600px] border border-primary/10 rounded-xl overflow-hidden bg-card/5 shadow-sm">
            {/* Master List (Left) */}
            <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-primary/10 overflow-hidden bg-card/20 shrink-0 flex flex-col">
              <div className="p-3 border-b border-primary/10 bg-background/50">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Filter products..." 
                    className="h-9 pl-9 text-[11px] bg-background border-primary/20 focus-visible:ring-primary/20 font-bold uppercase tracking-widest"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                  />
                  {productSearchQuery && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setProductSearchQuery('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {visibleDeliverables.length === 0 ? (
                  <div className="py-12 text-center text-[11px] text-muted-foreground font-black uppercase tracking-[0.15em] opacity-40 italic">
                    No matching results
                  </div>
                ) : (
                  visibleDeliverables.map((item) => {
                    const brief = (watchedValues.productBriefs as any)?.[item.id];
                    const isFocused = focusedFields[`productBriefs.${item.id}`];
                    const hasData = (brief && brief.trim().length > 0) || isFocused;
                    const isActive = selectedProductId === item.id;
                    const hasAddons = (item.addons || []).some((a: any) => a.value !== undefined && a.value !== false && a.value !== null);
                    const hasSpecial = item.specialRequest && item.specialRequest.trim().length > 0;
                    
                    const tags = [];
                    if (item.variant) tags.push(item.variant);
                    if (hasAddons) tags.push("Add-on");
                    if (hasSpecial) tags.push("Special Request");
                    const tagsDisplay = tags.join(" • ");

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedProductId(item.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between group",
                          isActive 
                            ? "bg-primary text-white shadow-md shadow-primary/20" 
                            : "hover:bg-primary/5 text-foreground"
                        )}
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <div className={cn(
                            "font-headline font-black text-xs uppercase tracking-tight truncate",
                            isActive ? "text-white" : "text-foreground"
                          )}>
                            {item.productName}
                          </div>
                          {tagsDisplay && (
                            <div className={cn(
                              "text-[10px] font-black uppercase truncate mt-0.5 tracking-[0.05em]",
                              isActive ? "text-white/80" : "text-muted-foreground"
                            )}>
                              {tagsDisplay}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0">
                          {hasData ? (
                            <div className={cn(
                              "h-3.5 w-3.5 rounded-full bg-green-600 transition-colors ring-offset-background",
                              isActive && "ring-2 ring-white shadow-sm ring-offset-0"
                            )} />
                          ) : (
                            <Circle className={cn(
                              "h-3.5 w-3.5 transition-colors opacity-30", 
                              isActive ? "text-white/50" : "text-muted-foreground"
                            )} />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Detail View (Right) */}
            <main className="flex-1 pt-4 px-8 pb-8 overflow-y-auto custom-scrollbar bg-background/50">
              {selectedItem ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center text-[11px] font-black text-muted-foreground uppercase tracking-[0.1em]">
                    {getProductSpecsSummary(selectedItem)}
                  </div>

                  <div className={cn(
                    "relative group focus-within:z-10 bg-background rounded-xl shadow-sm border border-primary/10 transition-all",
                    isEditMode && "focus-within:border-primary/40 focus-within:ring-8 focus-within:ring-primary/5"
                  )}>
                    <AutoGrowingTextarea 
                      placeholder={isEditMode ? "Add detailed creative requirements for this product..." : "No brief provided"}
                      {...register(`productBriefs.${selectedItem.id}` as any)}
                      readOnly={!isEditMode}
                      minRows={4}
                      onFocus={() => handleFocusChange(`productBriefs.${selectedItem.id}`, true)}
                      onBlur={() => handleFocusChange(`productBriefs.${selectedItem.id}`, false)}
                      className={cn(
                        "font-semibold bg-transparent text-foreground min-h-[350px] p-6 text-[14px] leading-relaxed",
                        !isEditMode && "cursor-default",
                        "placeholder:italic placeholder:font-normal placeholder:text-muted-foreground placeholder:text-[13px] placeholder:opacity-100"
                      )}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-[11px] font-black uppercase tracking-[0.2em] italic">
                  Select a product to view brief
                </div>
              )}
            </main>
          </div>
        </section>
      )}

      <form id="creative-brief-form" onSubmit={handleSubmit(onSave)} className="hidden" />
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.3); }
      `}</style>
    </div>
  );
}