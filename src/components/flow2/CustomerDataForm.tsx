'use client';

import * as React from 'react';
import { useForm, UseFormRegister } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Palette, BookOpen, Globe, Sparkles, Box, CheckCircle2, Eye, EyeOff, Save, Loader2 } from 'lucide-react';
import type { Order, CustomerData, ConfiguredProduct } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
 * Expert Field Component
 */
const EditableField = ({ 
  id, 
  label, 
  register,
  registerKey,
  value,
  showIfEmpty
}: { 
  id: string, 
  label: string, 
  register: UseFormRegister<CustomerData>,
  registerKey: any,
  value: string,
  showIfEmpty: boolean
}) => {
  const isEmpty = !value || value.trim().length === 0;
  
  if (!showIfEmpty && isEmpty) return null;

  return (
    <div className="mb-8 group transition-all duration-200 border-l-2 pl-4 border-primary/20 focus-within:border-primary break-inside-avoid">
      <Label 
        htmlFor={id} 
        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 mb-2 block"
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
          "focus:bg-background focus:border-primary/40 focus:shadow-sm focus:px-3",
          "placeholder:italic placeholder:font-normal placeholder:text-muted-foreground/90 placeholder:text-[11px]"
        )}
      />
    </div>
  );
};

export function CustomerDataForm({ order, onSave, isSaving }: { order: Order; onSave: (data: CustomerData) => void; isSaving?: boolean }) {
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(
    order.deliverables.length > 0 ? order.deliverables[0].id : null
  );

  const [showEmptyFields, setShowEmptyFields] = React.useState(true);

  // Persistence logic for view preference
  React.useEffect(() => {
    const saved = localStorage.getItem('srishbish_brief_view_pref');
    if (saved !== null) {
      setShowEmptyFields(saved === 'true');
    }
  }, []);

  const toggleViewMode = () => {
    const next = !showEmptyFields;
    setShowEmptyFields(next);
    localStorage.setItem('srishbish_brief_view_pref', String(next));
  };

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

  // Section visibility checks for "Hide Empty" mode
  const isSectionEmpty = (section: any) => {
    if (!section) return true;
    return Object.values(section).every(val => !val || (typeof val === 'string' && val.trim().length === 0));
  };

  const isVisualEmpty = isSectionEmpty(watchedValues.visualIdentity);
  const isNarrativeEmpty = isSectionEmpty(watchedValues.narrative);
  const isCultureEmpty = isSectionEmpty(watchedValues.cultureSymbols);
  const isAtmosphereEmpty = isSectionEmpty(watchedValues.atmosphereExtras);

  const isGenericDataEmpty = isVisualEmpty && isNarrativeEmpty && isCultureEmpty && isAtmosphereEmpty;

  const getProductSpecsSummary = (item: ConfiguredProduct) => {
    const product = productCatalog.find(p => p.id === item.productId);
    const parts: React.ReactNode[] = [];
    
    if (item.variant) {
      parts.push(<span key="variant">{item.variant}</span>);
    }

    if (product?.configType === 'A' && typeof item.quantity === 'number' && item.quantity > 0) {
      parts.push(<span key="qty">Qty: {item.quantity}</span>);
    } else if (product?.configType === 'B' && typeof item.pages === 'number' && item.pages > 0) {
      parts.push(<span key="pages">{item.pages} Pgs</span>);
    }

    if (product?.customFields && item.customFieldValues) {
      product.customFields.forEach(field => {
        const val = (item.customFieldValues as any)?.[field.id];
        if (val && typeof val === 'number' && val > 0) {
          parts.push(<span key={field.id}>{field.name}: {val}</span>);
        }
      });
    }

    const activeAddons = (item.addons || []).filter((a: any) => a.value !== undefined && a.value !== false && a.value !== null);
    activeAddons.forEach((a: any) => {
      const displayVal = typeof a.value === 'number' ? `: ${a.value}` : '';
      parts.push(<span key={`addon-${a.id}`}>{a.name}{displayVal}</span>);
    });

    if (item.specialRequest) {
      parts.push(<span key="special" className="italic font-medium">Note: {item.specialRequest}</span>);
    }

    return parts.length > 0 
      ? parts.reduce((prev, curr, i) => [prev, <span key={`sep-${i}`} className="mx-1 text-muted-foreground/40 font-black">•</span>, curr])
      : null;
  };

  // Filter deliverables based on data presence if "Hide Empty" is on
  const visibleDeliverables = React.useMemo(() => {
    if (showEmptyFields) return order.deliverables;
    return order.deliverables.filter(item => {
      const brief = (watchedValues.productBriefs as any)?.[item.id];
      return brief && brief.trim().length > 0;
    });
  }, [order.deliverables, showEmptyFields, watchedValues.productBriefs]);

  // Ensure selection stays valid when switching visible list
  React.useEffect(() => {
    if (visibleDeliverables.length > 0) {
      const stillVisible = visibleDeliverables.some(d => d.id === selectedProductId);
      if (!stillVisible) {
        setSelectedProductId(visibleDeliverables[0].id);
      }
    } else {
      setSelectedProductId(null);
    }
  }, [visibleDeliverables, selectedProductId]);

  const selectedItem = order.deliverables.find(d => d.id === selectedProductId);

  return (
    <div className="space-y-12 pb-24 max-w-6xl mx-auto relative">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm pt-4 -mt-4 mb-8 border-b border-primary/10 pb-4 flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-headline font-black text-foreground uppercase tracking-tight">Creative Briefing</h2>
          <p className="text-xs text-muted-foreground font-medium">Capture visual and narrative context for design production.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleViewMode}
            className="h-8 font-bold gap-2 text-[10px] uppercase tracking-widest border-primary/20"
          >
            {showEmptyFields ? (
              <><EyeOff className="h-3 w-3" /> Hide Empty Fields</>
            ) : (
              <><Eye className="h-3 w-3" /> Show All Fields</>
            )}
          </Button>
          <Button 
            size="sm" 
            type="submit"
            form="creative-brief-form"
            disabled={isSaving}
            className="h-8 font-bold gap-2 bg-primary shadow-lg shadow-primary/20 shrink-0"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Creative Brief
          </Button>
        </div>
      </div>

      {/* Masonry Layout for General Sections */}
      {(!isGenericDataEmpty || showEmptyFields) && (
        <section className="columns-1 md:columns-2 gap-8 space-y-8">
          {(!isVisualEmpty || showEmptyFields) && (
            <div className="break-inside-avoid">
              <SectionHeader title="Visual Identity" icon={Palette} />
              <EditableField 
                id="mood"
                label="Mood & Style Reference"
                register={register}
                registerKey="visualIdentity.moodStyle"
                value={watchedValues.visualIdentity?.moodStyle || ''}
                showIfEmpty={showEmptyFields}
              />
              <EditableField 
                id="colors"
                label="Color Palette & Typography"
                register={register}
                registerKey="visualIdentity.colorTypography"
                value={watchedValues.visualIdentity?.colorTypography || ''}
                showIfEmpty={showEmptyFields}
              />
              <EditableField 
                id="dislikes"
                label="Design Dislikes"
                register={register}
                registerKey="visualIdentity.designDislikes"
                value={watchedValues.visualIdentity?.designDislikes || ''}
                showIfEmpty={showEmptyFields}
              />
            </div>
          )}

          {(!isCultureEmpty || showEmptyFields) && (
            <div className="break-inside-avoid">
              <SectionHeader title="Culture & Symbols" icon={Globe} />
              <EditableField 
                id="icons"
                label="Mandatory Icons & Motifs"
                register={register}
                registerKey="cultureSymbols.mandatoryIcons"
                value={watchedValues.cultureSymbols?.mandatoryIcons || ''}
                showIfEmpty={showEmptyFields}
              />
              <EditableField 
                id="nuances"
                label="Regional Nuances"
                register={register}
                registerKey="cultureSymbols.regionalNuances"
                value={watchedValues.cultureSymbols?.regionalNuances || ''}
                showIfEmpty={showEmptyFields}
              />
            </div>
          )}

          {(!isNarrativeEmpty || showEmptyFields) && (
            <div className="break-inside-avoid">
              <SectionHeader title="The Narrative" icon={BookOpen} />
              <EditableField 
                id="timeline"
                label="Relationship Timeline"
                register={register}
                registerKey="narrative.timeline"
                value={watchedValues.narrative?.timeline || ''}
                showIfEmpty={showEmptyFields}
              />
              <EditableField 
                id="couple"
                label="The Couple's World"
                register={register}
                registerKey="narrative.coupleWorld"
                value={watchedValues.narrative?.coupleWorld || ''}
                showIfEmpty={showEmptyFields}
              />
              <EditableField 
                id="eggs"
                label="Easter Eggs"
                register={register}
                registerKey="narrative.easterEggs"
                value={watchedValues.narrative?.easterEggs || ''}
                showIfEmpty={showEmptyFields}
              />
            </div>
          )}

          {(!isAtmosphereEmpty || showEmptyFields) && (
            <div className="break-inside-avoid">
              <SectionHeader title="Atmosphere & Extras" icon={Sparkles} />
              <EditableField 
                id="personality"
                label="Venue Personality"
                register={register}
                registerKey="atmosphereExtras.venuePersonality"
                value={watchedValues.atmosphereExtras?.venuePersonality || ''}
                showIfEmpty={showEmptyFields}
              />
              <EditableField 
                id="other"
                label="Other Details"
                register={register}
                registerKey="atmosphereExtras.otherDetails"
                value={watchedValues.atmosphereExtras?.otherDetails || ''}
                showIfEmpty={showEmptyFields}
              />
            </div>
          )}
        </section>
      )}

      {/* Master-Detail View for Product Briefs */}
      <section className="pt-12 border-t border-primary/10">
        <SectionHeader title="Product Specific Briefs" icon={Box} />
        
        {visibleDeliverables.length === 0 ? (
          <div className="py-20 text-center italic text-muted-foreground text-sm bg-card/10 rounded-xl border border-dashed flex flex-col items-center justify-center">
            <Box className="h-8 w-8 opacity-20 mb-4" />
            {showEmptyFields ? "No products in scope." : "No data recorded."}
            {!showEmptyFields && order.deliverables.length > 0 && (
              <Button variant="link" size="sm" onClick={toggleViewMode} className="mt-2 font-bold">
                Show empty products
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col md:flex-row h-[600px] border border-primary/10 rounded-xl overflow-hidden bg-card/5 shadow-sm">
            {/* Master List (Left) */}
            <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-primary/10 overflow-y-auto custom-scrollbar bg-card/20 shrink-0">
              <div className="p-2 space-y-1">
                {visibleDeliverables.map((item) => {
                  const hasData = (watchedValues.productBriefs as any)?.[item.id]?.trim().length > 0;
                  const isActive = selectedProductId === item.id;
                  
                  return (
                    <button
                      key={item.id}
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
                        <div className={cn(
                          "text-[9px] font-bold uppercase truncate mt-0.5",
                          isActive ? "text-white/80" : "text-muted-foreground"
                        )}>
                          {item.variant || 'Standard'}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {hasData ? (
                          <CheckCircle2 className={cn("h-4 w-4", isActive ? "text-white" : "text-primary")} />
                        ) : (
                          <div className={cn("h-2 w-2 rounded-full", isActive ? "bg-white/40" : "bg-primary/20")} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Detail View (Right) */}
            <main className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-background/50">
              {selectedItem ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="font-headline font-black text-lg text-foreground uppercase tracking-tight">
                      {selectedItem.productName}
                    </h4>
                    <div className="flex flex-wrap items-center text-[10px] font-bold text-muted-foreground/80 uppercase tracking-tight leading-normal">
                      {getProductSpecsSummary(selectedItem)}
                    </div>
                  </div>

                  <div className="relative group focus-within:z-10 bg-background rounded-xl shadow-sm border border-primary/10">
                    <AutoGrowingTextarea 
                      placeholder="Add product requirements..."
                      {...register(`productBriefs.${selectedItem.id}` as any)}
                      minRows={2}
                      className={cn(
                        "font-semibold bg-transparent text-foreground min-h-[350px] p-6 transition-all",
                        "focus:bg-background focus:ring-2 focus:ring-primary/20",
                        "placeholder:italic placeholder:font-normal placeholder:text-muted-foreground/90 placeholder:text-[11px]"
                      )}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm italic">
                  Select a product to view and edit its creative brief.
                </div>
              )}
            </main>
          </div>
        )}
      </section>

      <form id="creative-brief-form" onSubmit={handleSubmit(onSave)} className="hidden" />
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 10px; }
      `}</style>
    </div>
  );
}
