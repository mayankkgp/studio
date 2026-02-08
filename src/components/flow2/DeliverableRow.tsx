'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    AlertCircle,
    Trash2, 
    ShoppingBag,
    Clapperboard,
    FileText,
    MailOpen,
    Package,
    Check,
    Pencil,
    MessageSquarePlus,
    Plus,
    X,
    TrendingUp,
    Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { productCatalog } from '@/lib/product-data';
import type { Product, ConfiguredProduct, SoftConstraint, BillableComponent } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    AccordionItem,
    AccordionContent,
} from "@/components/ui/accordion";
import { calculateItemBreakdown } from '@/lib/pricing';

const getValidationSchema = (product: Product | null) => {
    if (!product) return z.object({});
    
    let schemaObject: any = {
        variant: product.variants && product.variants.length > 0 ? z.string().min(1, "REQUIRED") : z.string().optional(),
        specialRequest: z.string().optional(),
        rateOverrides: z.record(z.number()).optional(),
    };

    if (product.configType === 'A') {
        schemaObject.quantity = z.number({ required_error: "REQUIRED", invalid_type_error: "REQUIRED" });
    }
    
    if (product.configType === 'B') {
        schemaObject.pages = z.number({ required_error: "REQUIRED", invalid_type_error: "REQUIRED" });
    }

    if (product.customFields) {
        if (product.id === 5) {
            schemaObject.customFieldValues = z.object(
                product.customFields.reduce((acc, field) => ({
                    ...acc,
                    [field.id]: z.preprocess(
                        (val) => (val === "" || val === null || (typeof val === 'number' && isNaN(val)) ? undefined : val),
                        z.number().optional()
                    )
                }), {})
            ).refine((vals: any) => {
                return Object.values(vals).some(v => typeof v === 'number' && v > 0);
            }, { message: "REQUIRED" });
        } else {
            schemaObject.customFieldValues = z.object(
                product.customFields.reduce((acc, field) => ({
                    ...acc,
                    [field.id]: z.number({ required_error: "REQUIRED", invalid_type_error: "REQUIRED" })
                }), {})
            );
        }
    }
    
    if (product.addons) {
        schemaObject.addons = z.array(z.object({
            id: z.string(), 
            name: z.string(),
            value: z.any()
        })).superRefine((addons, ctx) => {
            addons.forEach((addon, idx) => {
                const addonDef = product.addons?.find(a => a.id === addon.id);
                const isSelected = addon.value !== undefined && addon.value !== false;
                
                if (isSelected && addonDef && (addonDef.type === 'numeric' || addonDef.type === 'physical_quantity')) {
                    if (addon.value === null || addon.value === '' || isNaN(Number(addon.value))) {
                         ctx.addIssue({ code: z.ZodIssueCode.custom, message: "REQUIRED", path: [idx, 'value'] });
                    }
                }
            });
        });
    }

    return z.object(schemaObject);
};

export const DeliverableRow = React.memo(function DeliverableRow({ 
    item, 
    isExpanded, 
    isNonCollapsible = false,
    onEdit,
    onDone, 
    onValidityChange,
    onUpdate,
    onRemove,
    isPersistent = false,
    isReadOnly = false,
    manualSyncOnly = false,
    showCommercials = false
}: DeliverableRowProps) {
    const product = React.useMemo(() => productCatalog.find(p => p.id === item.productId) || null, [item.productId]);
    const isBranchA = product?.configType === 'A' || product?.configType === 'B';
    
    const [showNotes, setShowNotes] = React.useState(!!item.specialRequest);
    const [hasValidated, setHasValidated] = React.useState(false);
    const [justActivatedAddonId, setJustActivatedAddonId] = React.useState<string | null>(null);

    const form = useForm({
        resolver: zodResolver(getValidationSchema(product)),
        defaultValues: {
            variant: item.variant,
            quantity: item.quantity,
            pages: item.pages,
            specialRequest: item.specialRequest || '',
            customFieldValues: item.customFieldValues || {},
            rateOverrides: item.rateOverrides || {},
            addons: product?.addons?.map(addon => {
                const existingAddon = item.addons?.find(a => a.id === addon.id);
                return { 
                    id: addon.id, 
                    name: addon.name, 
                    value: existingAddon?.value ?? undefined
                };
            }) || []
        },
        mode: 'onChange'
    });

    const { register, control, watch, formState: { errors, isValid }, trigger, getValues, setValue, reset } = form;
    const watchedValues = watch();

    // Discard uncommitted changes when exiting edit mode
    React.useEffect(() => {
        if (isReadOnly) {
            reset({
                variant: item.variant,
                quantity: item.quantity,
                pages: item.pages,
                specialRequest: item.specialRequest || '',
                customFieldValues: item.customFieldValues || {},
                rateOverrides: item.rateOverrides || {},
                addons: product?.addons?.map(addon => {
                    const existingAddon = item.addons?.find(a => a.id === addon.id);
                    return { 
                        id: addon.id, 
                        name: addon.name, 
                        value: existingAddon?.value ?? undefined
                    };
                }) || []
            });
        }
    }, [isReadOnly, item, product, reset]);

    // Handle initial validation and external sync
    React.useEffect(() => {
        const initValidation = async () => {
            const res = await trigger();
            onValidityChange(item.id, res);
            setHasValidated(true);
        };
        initValidation();
    }, [trigger, item.id, onValidityChange]);

    React.useEffect(() => {
        if (hasValidated) {
            onValidityChange(item.id, isValid);
        }
    }, [item.id, isValid, hasValidated, onValidityChange]);

    // Internal breakdown for "Live" feedback during editing
    const itemBreakdown = React.useMemo(() => {
        const currentItem: ConfiguredProduct = {
            ...item,
            ...watchedValues,
            addons: (watchedValues.addons || []).filter((a: any) => a.value !== undefined && a.value !== false) as any
        };
        return calculateItemBreakdown(currentItem);
    }, [watchedValues, item]);

    const getLogicWarning = React.useCallback((fieldValue: any, constraints?: SoftConstraint[]) => {
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') return null;
        if (!constraints) return null;
        for (const c of constraints) {
            if (c.type === 'min' && Number(fieldValue) < c.value) return c.message.toUpperCase();
            if (c.type === 'max' && Number(fieldValue) > c.value) return c.message.toUpperCase();
        }
        return null;
    }, []);

    const performSyncUpdate = React.useCallback((confirmedValues: any) => {
        onUpdate(item.id, {
            ...confirmedValues,
            addons: (confirmedValues.addons || []).filter((a: any) => a.value !== undefined && a.value !== false) as any
        });
    }, [item.id, onUpdate]);

    // Auto-sync for Deliverables page (where manualSyncOnly is false)
    React.useEffect(() => {
        if (manualSyncOnly) return;
        
        const timer = setTimeout(() => {
            const currentValues = getValues();
            performSyncUpdate(currentValues);
        }, 300);
        return () => clearTimeout(timer);
    }, [
        watchedValues.quantity, 
        watchedValues.pages, 
        watchedValues.specialRequest, 
        watchedValues.customFieldValues, 
        watchedValues.addons, 
        watchedValues.variant,
        watchedValues.rateOverrides,
        performSyncUpdate,
        manualSyncOnly,
        getValues
    ]);

    const handleRateOverride = (label: string, value: number) => {
        const currentOverrides = getValues('rateOverrides') || {};
        setValue('rateOverrides', { ...currentOverrides, [label]: value }, { shouldValidate: true });
    };

    const handleDoneClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const res = await trigger();
        if (res) {
            const currentValues = getValues();
            performSyncUpdate(currentValues);
            onDone(item.id, res);
        }
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(item.id);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to remove this item?")) {
            onRemove(item.id);
        }
    };

    const getSummaryText = () => {
        if (!product) return null;
        const parts: React.ReactNode[] = [];
        
        // Always show the confirmed state in compact mode
        const displayValues = item;

        if (displayValues.variant) {
            parts.push(<span key="variant">{displayValues.variant}</span>);
        }

        if (product.configType === 'A' && typeof displayValues.quantity === 'number') {
            const warning = getLogicWarning(displayValues.quantity, product.softConstraints);
            parts.push(<span key="qty" className={cn(warning && "text-[#FA7315] font-bold")}>Qty: {displayValues.quantity}</span>);
        } else if (product.configType === 'B' && typeof displayValues.pages === 'number') {
            const warning = getLogicWarning(displayValues.pages, product.softConstraints);
            parts.push(<span key="pages" className={cn(warning && "text-[#FA7315] font-bold")}>{displayValues.pages} Pgs</span>);
        }

        if (product.customFields && displayValues.customFieldValues) {
            product.customFields.forEach(field => {
                const val = (displayValues.customFieldValues as any)?.[field.id];
                if (val && typeof val === 'number') {
                    parts.push(<span key={field.id}>{field.name}: {val}</span>);
                }
            });
        }

        const activeAddons = (displayValues.addons || []).filter((a: any) => a.value !== undefined && a.value !== false);
        activeAddons.forEach((a: any) => {
            const displayVal = typeof a.value === 'number' ? `: ${a.value}` : '';
            parts.push(<span key={`addon-${a.id}`}>{a.name}{displayVal}</span>);
        });

        if (displayValues.specialRequest) {
            parts.push(<span key="special" className="italic opacity-80">Note: {displayValues.specialRequest}</span>);
        }

        if (parts.length === 0) return null;
        return parts.reduce((prev, curr, i) => [prev, <span key={`sep-${i}`} className="mx-1 text-muted-foreground/30">•</span>, curr]);
    };

    const getWarningData = React.useCallback((): { type: 'hard' | 'soft' | null, message: string | null } => {
        if (!isValid) return { type: 'hard', message: 'SETUP REQUIRED' };

        if (product?.configType === 'A') {
            const warning = getLogicWarning(watchedValues.quantity, product.softConstraints);
            if (warning) return { type: 'soft', message: warning };
        }
        if (product?.configType === 'B') {
            const warning = getLogicWarning(watchedValues.pages, product.softConstraints);
            if (warning) return { type: 'soft', message: warning };
        }
        return { type: null, message: null };
    }, [isValid, watchedValues, product, getLogicWarning]);

    const getIcon = () => {
        switch (product?.configType) {
            case 'A': return ShoppingBag;
            case 'B': return Clapperboard;
            case 'C': return FileText;
            case 'D': return MailOpen;
            default: return Package;
        }
    };
    const IconComponent = getIcon();
    const warningData = getWarningData();

    return (
        <AccordionItem 
            value={item.id} 
            className={cn(
                "border rounded-xl transition-all duration-200 overflow-hidden mb-2 last:mb-0",
                isExpanded 
                    ? "border-l-4 border-primary shadow-md bg-background" 
                    : cn(
                        "bg-card hover:bg-muted/50",
                        !isValid && "border-destructive border-2 bg-destructive/5"
                    )
            )}
        >
            <div className={cn("flex items-center px-4 transition-all min-h-[3.5rem] py-2")}>
                <div className="flex-1 flex items-center gap-3 text-left w-full overflow-hidden">
                    <div className={cn(
                        "rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        isExpanded ? "h-10 w-10" : "h-7 w-7",
                        !isValid ? "text-destructive bg-destructive/10" : isExpanded ? "text-blue-600 bg-blue-50" : "text-green-600 bg-green-100"
                    )}>
                        <IconComponent className={isExpanded ? "h-5 w-5" : "h-4 w-4"} />
                    </div>
                    <div className={cn("flex flex-col flex-1 overflow-hidden min-w-0")}>
                        <div className="flex items-center gap-2 overflow-hidden">
                            <h3 className={cn("font-semibold leading-none truncate", isExpanded ? "text-base" : "text-sm")}>
                                {item.productName}
                            </h3>
                            {warningData.message && !isPersistent && (
                                <Badge variant={warningData.type === 'hard' ? 'destructive' : 'warning'} className="text-[9px] h-3.5 py-0 px-1 font-bold uppercase shrink-0">
                                    {warningData.message}
                                </Badge>
                            )}
                        </div>
                        {!isExpanded && (
                            <div className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug mt-1 line-clamp-2 max-w-full">
                                {getSummaryText()}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-4 shrink-0">
                    {!isReadOnly && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleDelete}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                    
                    {isReadOnly ? (
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={(e) => {
                                e.stopPropagation();
                                isExpanded ? onDone(item.id, true) : onEdit(item.id);
                            }} 
                            className="gap-2 h-8"
                        >
                            {isExpanded ? <X className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
                            {isExpanded ? 'Hide' : 'View'}
                        </Button>
                    ) : (
                        !isExpanded ? (
                            <Button size="sm" variant="outline" onClick={handleEditClick} className="gap-2 h-8">
                                <Pencil className="h-3.5 w-3.5" /> Edit
                            </Button>
                        ) : (
                            <Button size="sm" onClick={handleDoneClick} className="gap-2 h-8" disabled={!isValid}>
                                <Check className="h-4 w-4" /> Done
                            </Button>
                        )
                    )}
                </div>
            </div>

            <AccordionContent className="px-4 pb-4 border-t bg-muted/5 relative" forceMount={isExpanded}>
                <div className="flex flex-col gap-8 pt-6">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-x-8 gap-y-6">
                            {product?.variants && product.variants.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Variant *</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {product.variants.map(v => (
                                            <Button
                                                key={v}
                                                type="button"
                                                variant={watchedValues.variant === v ? "default" : "outline"}
                                                size="sm"
                                                disabled={isReadOnly}
                                                className={cn("h-9 rounded-full px-4", watchedValues.variant === v && "shadow-sm")}
                                                onClick={() => setValue('variant', v, { shouldValidate: true })}
                                            >
                                                {v}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isBranchA && (
                                <div className="flex flex-col gap-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        {product?.configType === 'A' ? 'Quantity *' : 'Pages *'}
                                    </Label>
                                    <Input 
                                        type="number" 
                                        disabled={isReadOnly}
                                        {...register(product?.configType === 'A' ? 'quantity' : 'pages', { valueAsNumber: true })}
                                        className={cn(
                                            "w-24 h-10 text-lg bg-background",
                                            getLogicWarning(product?.configType === 'A' ? watchedValues.quantity : watchedValues.pages, product?.softConstraints) && "border-[#FA7315] ring-[#FA7315] border-2"
                                        )}
                                    />
                                </div>
                            )}

                            {product?.customFields && product.customFields.map((field) => (
                                <div key={field.id} className="flex flex-col gap-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        {field.name} {product.id !== 5 && "*"}
                                    </Label>
                                    <Input 
                                        type="number" 
                                        disabled={isReadOnly}
                                        className={cn(
                                            "w-20 h-10 bg-background",
                                            getLogicWarning((watchedValues.customFieldValues as any)?.[field.id], field.softConstraints) && "border-[#FA7315] ring-[#FA7315] border-2"
                                        )}
                                        {...register(`customFieldValues.${field.id}`, { valueAsNumber: true })} 
                                    />
                                </div>
                            ))}
                        </div>

                        {product?.addons && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {product.addons.map((addon, index) => {
                                    const parentIndex = addon.dependsOn ? product.addons!.findIndex(a => a.id === addon.dependsOn) : -1;
                                    const parentValue = parentIndex !== -1 ? watchedValues.addons?.[parentIndex]?.value : undefined;
                                    const isParentActive = parentValue !== undefined && parentValue !== false;
                                    if (!((!addon.dependsOn || isParentActive) && (!addon.visibleIfVariant || watchedValues.variant === addon.visibleIfVariant))) return null;
                                    
                                    return (
                                        <Controller
                                            key={addon.id}
                                            name={`addons.${index}.value`}
                                            control={control}
                                            render={({ field }) => {
                                                const isChecked = field.value !== undefined && field.value !== false;
                                                
                                                if (!isChecked) {
                                                    return !isReadOnly ? (
                                                        <Button
                                                            type="button" variant="outline" size="sm" className="h-8 rounded-full px-3 gap-1.5 text-xs"
                                                            onClick={() => { setJustActivatedAddonId(addon.id); field.onChange(addon.type === 'checkbox' ? true : null); }}
                                                        >
                                                            <Plus className="h-3 w-3" /> {addon.name}
                                                        </Button>
                                                    ) : null;
                                                } else {
                                                    const val = field.value ?? '';
                                                    return (
                                                        <div className={cn("inline-flex items-center rounded-full h-8 pl-4 pr-1.5 gap-2 bg-[#FA7315] text-white shadow-sm transition-colors", isReadOnly && "bg-muted text-muted-foreground")}>
                                                            <span className="text-xs font-bold uppercase tracking-tight">{addon.name}</span>
                                                            {addon.type !== 'checkbox' && (
                                                                <Input
                                                                    type="number" disabled={isReadOnly}
                                                                    autoFocus={justActivatedAddonId === addon.id}
                                                                    className="h-6 px-2 py-0 text-xs bg-white border-none focus-visible:ring-0 rounded-md font-bold text-black w-12"
                                                                    value={val}
                                                                    onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                                                />
                                                            )}
                                                            {!isReadOnly && (
                                                                <Button
                                                                    type="button" variant="ghost" size="icon" className="h-5 w-5 rounded-full hover:bg-white/20 text-white p-0"
                                                                    onClick={() => field.onChange(false)}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        <div className="pt-2">
                            {showNotes ? (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Special Instructions</Label>
                                    <Textarea 
                                        {...register('specialRequest')} 
                                        disabled={isReadOnly}
                                        className="min-h-[60px] bg-background/50 leading-6" 
                                        placeholder="Add special instructions..."
                                    />
                                </div>
                            ) : !isReadOnly && (
                                <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground px-3" onClick={() => setShowNotes(true)}>
                                    <MessageSquarePlus className="h-4 w-4" />
                                    <span className="text-xs font-medium uppercase">Add Note</span>
                                </Button>
                            )}
                        </div>
                    </div>

                    {showCommercials && (
                        <div className="border-t pt-8 space-y-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <h4 className="text-sm font-bold uppercase tracking-widest">Commercials &amp; Rates</h4>
                            </div>
                            
                            <div className="rounded-xl border bg-card/30 overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-muted/50 border-b">
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground">Label</th>
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground text-center">Multiplier</th>
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground text-right">Unit Rate (₹)</th>
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemBreakdown.map((comp, i) => (
                                            <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                                <td className="px-4 py-3 font-medium">{comp.label}</td>
                                                <td className="px-4 py-3 text-center text-muted-foreground font-mono">{comp.isFixed ? '-' : comp.multiplier}</td>
                                                <td className="px-4 py-2 text-right">
                                                    <div className="flex justify-end">
                                                        <input 
                                                            type="number"
                                                            disabled={isReadOnly}
                                                            defaultValue={comp.rate}
                                                            onBlur={(e) => handleRateOverride(comp.label, Number(e.target.value))}
                                                            className={cn(
                                                                "w-20 h-7 text-right bg-background border rounded px-1.5 font-bold focus:ring-1 focus:ring-primary",
                                                                isReadOnly && "border-transparent bg-transparent"
                                                            )}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold tabular-nums">₹{comp.total.toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-muted/10">
                                            <td colSpan={3} className="px-4 py-4 text-right font-bold uppercase tracking-widest text-muted-foreground">Item Total</td>
                                            <td className="px-4 py-4 text-right font-black text-sm text-primary">
                                                ₹{itemBreakdown.reduce((sum, c) => sum + c.total, 0).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
});

interface DeliverableRowProps {
    item: ConfiguredProduct;
    isExpanded: boolean;
    isNonCollapsible?: boolean;
    onEdit: (id: string) => void;
    onDone: (id: string, isValid: boolean) => void;
    onValidityChange: (id: string, isValid: boolean) => void;
    onUpdate: (id: string, updates: Partial<ConfiguredProduct>) => void;
    onRemove: (id: string) => void;
    isPersistent?: boolean;
    isReadOnly?: boolean;
    manualSyncOnly?: boolean;
    showCommercials?: boolean;
}
