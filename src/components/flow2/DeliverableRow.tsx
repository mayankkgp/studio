'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    AlertTriangle, 
    AlertCircle,
    Trash2, 
    ShoppingBag,
    Clapperboard,
    FileText,
    MailOpen,
    Frame,
    Package,
    Check,
    Pencil,
    MessageSquarePlus,
    Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { productCatalog } from '@/lib/product-data';
import type { Product, ConfiguredProduct, SoftConstraint } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    AccordionItem,
    AccordionContent,
    AccordionTrigger
} from "@/components/ui/accordion";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface DeliverableRowProps {
    item: ConfiguredProduct;
    isExpanded: boolean;
    onEdit: (id: string) => void;
    onDone: (id: string) => void;
    onValidityChange: (id: string, isValid: boolean) => void;
    onUpdate: (id: string, updates: Partial<ConfiguredProduct>) => void;
    onRemove: (id: string) => void;
}

const getValidationSchema = (product: Product | null) => {
    if (!product) return z.object({});
    
    let schemaObject: any = {
        variant: (product.variants && product.variants.length > 0) ? z.string().min(1, "Variant required") : z.string().optional(),
        specialRequest: z.string().optional(),
    };

    if (product.configType === 'A') {
        schemaObject.quantity = z.number({ required_error: "Required", invalid_type_error: "Required" }).min(1, "Required");
    }
    if (product.configType === 'B') {
        schemaObject.pages = z.number({ required_error: "Required", invalid_type_error: "Required" }).min(1, "Required");
    }
    
    if (product.customFields) {
        schemaObject.customFieldValues = z.object(
            product.customFields.reduce((acc, field) => ({
                ...acc, [field.id]: z.number({ required_error: "Required", invalid_type_error: "Required" }).min(0, "Required")
            }), {})
        ).optional();
    }
    
    if (product.addons) {
        schemaObject.addons = z.array(z.object({
            id: z.string(), 
            name: z.string(),
            value: z.union([z.boolean(), z.number({ required_error: "Required", invalid_type_error: "Required" }), z.null()]).refine(val => val !== null, "Required")
        })).optional();
    }

    if (product.sizes) {
        schemaObject.sizes = z.array(z.object({
            name: z.string(), 
            quantity: z.union([z.number({ required_error: "Required", invalid_type_error: "Required" }), z.null()]).refine(val => val !== null, "Required")
        })).optional();
    }
    
    return z.object(schemaObject);
};

export const DeliverableRow = React.memo(function DeliverableRow({ 
    item, 
    isExpanded, 
    onEdit,
    onDone, 
    onValidityChange,
    onUpdate,
    onRemove
}: DeliverableRowProps) {
    const product = productCatalog.find(p => p.id === item.productId) || null;
    const hasValidated = React.useRef(false);
    
    const qtyInputRef = React.useRef<HTMLInputElement>(null);
    const notesRef = React.useRef<HTMLTextAreaElement | null>(null);

    const [showNotes, setShowNotes] = React.useState(!!item.specialRequest);

    const form = useForm({
        resolver: zodResolver(getValidationSchema(product)),
        defaultValues: {
            variant: item.variant,
            quantity: item.quantity,
            pages: item.pages,
            specialRequest: item.specialRequest || '',
            customFieldValues: item.customFieldValues || {},
            addons: product?.addons?.map(addon => {
                const existingAddon = item.addons?.find(a => a.id === addon.id);
                // expert users: don't default to unselected if it was already selected but blank
                const initialValue = existingAddon?.value ?? undefined;
                return { 
                    id: addon.id, 
                    name: addon.name, 
                    value: initialValue
                };
            }) || [],
            sizes: product?.sizes?.map(size => {
                const existingSize = item.sizes?.find(s => s.name === size.name);
                const initialValue = existingSize?.quantity ?? undefined;
                return { name: size.name, quantity: initialValue };
            }) || []
        },
        mode: 'onChange'
    });

    const { register, control, watch, formState: { errors, isValid }, trigger, getValues, setValue } = form;
    
    const watchedValues = watch();

    const adjustHeight = React.useCallback((el: HTMLTextAreaElement | null) => {
        if (!el) return;
        el.style.height = '0px'; 
        const scrollHeight = el.scrollHeight;
        el.style.height = `${Math.max(40, scrollHeight)}px`;
    }, []);

    React.useEffect(() => {
        if (showNotes && notesRef.current) {
            adjustHeight(notesRef.current);
        }
    }, [showNotes, watchedValues.specialRequest, adjustHeight]);

    React.useEffect(() => {
        trigger().then((result) => {
            hasValidated.current = true;
            onValidityChange(item.id, result);
        });
    }, [trigger, item.id, onValidityChange]);

    React.useEffect(() => {
        if (hasValidated.current) {
            onValidityChange(item.id, isValid);
        }
    }, [isValid, item.id, onValidityChange]);

    React.useEffect(() => {
        if (isExpanded && !isValid) {
            const timer = setTimeout(() => {
                if (product?.configType === 'A') {
                    qtyInputRef.current?.focus();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isExpanded, isValid, product]);

    const getWarnings = (data: any, product: Product | null): string | undefined => {
        if (!product) return undefined;
        const warnings: string[] = [];
        const check = (value: number, constraints: SoftConstraint[]) => {
            constraints.forEach(c => {
                if (c.type === 'min' && value > 0 && value < c.value) warnings.push(c.message);
                if (c.type === 'max' && value > c.value) warnings.push(c.message);
            });
        };
        if (product.configType === 'A' && product.softConstraints && typeof data.quantity === 'number') {
            let value = data.quantity;
            if (product.specialLogic === 'WaxSealCustomQty' && data.variant === 'Custom') {
                if (value > 0 && value < 25) warnings.push('MOQ for Custom is 25.');
            } else {
                 check(value, product.softConstraints);
            }
        }
        return warnings.length > 0 ? warnings.join(' ') : undefined;
    };

    React.useEffect(() => {
        const timer = setTimeout(() => {
            const currentValues = getValues();
            const warning = getWarnings(currentValues, product);
            onUpdate(item.id, {
                ...currentValues,
                warning,
                // Only filter out undefined/false. null/NaN stay in the state as "selected but empty" to show errors
                addons: currentValues.addons?.filter((a: any) => a.value !== undefined && a.value !== false) as any,
                sizes: currentValues.sizes?.filter((s: any) => s.quantity !== undefined) as any
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [watchedValues.quantity, watchedValues.pages, watchedValues.specialRequest, watchedValues.customFieldValues, watchedValues.addons, watchedValues.sizes, onUpdate, item.id, product, getValues]);

    const handleDoneClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const result = await trigger();
        if (result) onDone(item.id);
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
    }

    const handleAddNote = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowNotes(true);
        setTimeout(() => {
            notesRef.current?.focus();
        }, 0);
    };

    const getSummaryText = () => {
        if (!product) return '';
        const parts: string[] = [];
        const hasVariants = !!(product.variants && product.variants.length > 0);
        
        if (hasVariants && watchedValues.variant) {
            parts.push(watchedValues.variant);
        }
        
        if (product.configType === 'A' && typeof watchedValues.quantity === 'number') {
            parts.push(`Qty: ${watchedValues.quantity}`);
        } else if (product.configType === 'B' && typeof watchedValues.pages === 'number') {
            parts.push(`${watchedValues.pages} Pages`);
        }
        
        if (!hasVariants) return parts.join(' • ');
        if (!watchedValues.variant) return 'Setup Required';
        
        return parts.join(' • ');
    };

    const getIcon = () => {
        switch (product?.configType) {
            case 'A': return ShoppingBag;
            case 'B': return Clapperboard;
            case 'C': return FileText;
            case 'D': return MailOpen;
            case 'E': return Frame;
            default: return Package;
        }
    };
    const IconComponent = getIcon();

    const isLocked = isExpanded && !isValid;
    const isBranchA = product?.configType === 'A' && (!product?.variants || product.variants.length === 0);

    const iconStatusClasses = isExpanded 
        ? "text-blue-600 bg-blue-50" 
        : isValid 
            ? "text-green-600 bg-green-100" 
            : "text-destructive bg-destructive/10";

    const renderNotesArea = (fullWidth: boolean = false) => {
        if (showNotes) {
            return (
                <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full min-w-[250px]")}>
                    <Textarea 
                        {...register('specialRequest')} 
                        className="min-h-[40px] bg-background/50 overflow-hidden resize-none py-2 px-3 leading-6 border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                        placeholder="Add special instructions..."
                        ref={(e) => {
                            register('specialRequest').ref(e);
                            notesRef.current = e;
                        }}
                        onChange={(e) => {
                            register('specialRequest').onChange(e);
                            adjustHeight(e.target);
                        }}
                    />
                </div>
            );
        }
        return (
            <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 gap-2 text-muted-foreground hover:text-primary transition-colors p-0 hover:bg-transparent"
                onClick={handleAddNote}
            >
                <MessageSquarePlus className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Add Note</span>
            </Button>
        );
    };

    const promotedCustomField = React.useMemo(() => {
        if (product?.configType === 'A' || product?.configType === 'B') return null;
        if (product?.customFields?.length === 1) {
            return product.customFields[0];
        }
        return null;
    }, [product]);

    const renderPromotedInput = () => {
        if (product?.configType === 'A') {
            return (
                <div className="flex items-center gap-4">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap min-w-[40px]">QTY</Label>
                    <div className="flex items-center gap-2">
                        <Input 
                            type="number" 
                            {...register('quantity', { valueAsNumber: true })}
                            className={cn("w-24 h-10 text-lg bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none", errors.quantity && "border-destructive")} 
                            ref={(e) => {
                                register('quantity').ref(e);
                                // @ts-ignore
                                qtyInputRef.current = e;
                            }}
                        />
                        {errors.quantity && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertCircle className="h-4 w-4 text-destructive shrink-0 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent><p>{errors.quantity.message}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </div>
            );
        }
        if (product?.configType === 'B') {
            return (
                <div className="flex items-center gap-4">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap min-w-[40px]">PAGES</Label>
                    <div className="flex items-center gap-2">
                        <Input 
                            type="number" 
                            {...register('pages', { valueAsNumber: true })}
                            className={cn("w-24 h-10 text-lg bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none", errors.pages && "border-destructive")} 
                        />
                        {errors.pages && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertCircle className="h-4 w-4 text-destructive shrink-0 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent><p>{errors.pages.message}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </div>
            );
        }
        if (promotedCustomField) {
            return (
                <div className="flex items-center gap-4">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap min-w-[40px]">
                        {promotedCustomField.name}
                    </Label>
                    <div className="flex items-center gap-2">
                        <Input 
                            type="number" 
                            className={cn("w-24 h-10 text-lg bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none", errors.customFieldValues?.[promotedCustomField.id] && "border-destructive")} 
                            {...register(`customFieldValues.${promotedCustomField.id}`, { valueAsNumber: true })} 
                        />
                        {errors.customFieldValues?.[promotedCustomField.id] && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertCircle className="h-4 w-4 text-destructive shrink-0 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent><p>{(errors.customFieldValues as any)?.[promotedCustomField.id]?.message || 'Required'}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    const isComplexProduct = item.productId === 4 || item.productId === 5; // Save the Date or Invite
    const showHeader = (product?.variants && product.variants.length > 0) || renderPromotedInput() !== null;

    return (
        <div className="group relative">
            <AccordionItem 
                value={item.id} 
                id={`deliverable-${item.id}`}
                className={cn(
                    "border rounded-xl transition-all duration-200 overflow-hidden scroll-mt-[176px]",
                    isExpanded 
                        ? "border-l-4 border-primary shadow-md bg-background ring-2 ring-primary/10" 
                        : "bg-card hover:bg-muted/50",
                    !isValid && !isExpanded && "border-destructive border-2 bg-destructive/5"
                )}
            >
                <div className={cn("flex items-center px-4 transition-all h-14")}>
                    <div className="flex-1 flex items-center gap-3 text-left w-full overflow-hidden">
                        <div className={cn(
                            "rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            isExpanded ? "h-10 w-10" : "h-7 w-7",
                            iconStatusClasses
                        )}>
                            <IconComponent className={isExpanded ? "h-5 w-5" : "h-4 w-4"} />
                        </div>
                        <div className={cn("flex items-baseline gap-3", !isExpanded && "flex-1")}>
                            <h3 className={cn("font-semibold leading-none shrink-0", isExpanded ? "text-base" : "text-sm")}>
                                {item.productName}
                            </h3>
                            {!isExpanded && (
                                <div className="text-xs text-muted-foreground truncate flex-1">
                                    {getSummaryText() === 'Setup Required' ? (
                                        <Badge variant="destructive" className="bg-destructive text-destructive-foreground text-[10px] h-4 py-0 font-bold tracking-wide">Setup Required</Badge>
                                    ) : getSummaryText()}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                        {item.warning && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="p-1.5 rounded-full bg-accent/10 text-accent cursor-help">
                                            <AlertTriangle className="h-4 w-4" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{item.warning}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        <div className="flex items-center gap-2">
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                onClick={handleDelete}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            {!isExpanded ? (
                                <Button size="sm" variant="outline" onClick={handleEditClick} className="gap-2 h-8">
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit
                                </Button>
                            ) : (
                                <Button size="sm" onClick={handleDoneClick} className="gap-2 h-8" disabled={!isValid}>
                                    <Check className="h-4 w-4" />
                                    Done
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pointer-events-none absolute inset-0 -z-10">
                    <AccordionTrigger className={cn("invisible", isLocked && "cursor-default [&>svg]:hidden")}>
                        Toggle
                    </AccordionTrigger>
                </div>

                <AccordionContent className="px-4 pb-4 border-t bg-muted/5 relative">
                    {isBranchA ? (
                        <div className="flex flex-wrap items-center gap-8 pt-4 pb-2">
                            {renderPromotedInput()}
                            <div className="flex-1 min-w-[250px]">
                                {renderNotesArea()}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 pt-4">
                            {/* Row 1: Header (Variants + Promoted Input) */}
                            {showHeader && (
                                <div className="flex flex-wrap items-start justify-between gap-6">
                                    {product?.variants && product.variants.length > 0 ? (
                                        <div className="flex items-start gap-4 flex-1">
                                            <Label className={cn("text-xs font-bold uppercase tracking-wider whitespace-nowrap min-w-[40px] mt-2.5", errors.variant ? "text-destructive" : "text-muted-foreground")}>
                                                Variant
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                <Controller
                                                    name="variant"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <div className="flex flex-wrap gap-2">
                                                            {product.variants!.map(v => (
                                                                <Button
                                                                    key={v}
                                                                    type="button"
                                                                    variant={field.value === v ? "default" : "outline"}
                                                                    size="sm"
                                                                    className={cn(
                                                                        "h-9 rounded-full px-4 transition-all",
                                                                        field.value === v ? "shadow-sm" : "hover:bg-accent hover:text-accent-foreground"
                                                                    )}
                                                                    onClick={() => field.onChange(v)}
                                                                >
                                                                    {v}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    )}
                                                />
                                                {errors.variant && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <AlertCircle className="h-4 w-4 text-destructive shrink-0 cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{errors.variant.message}</p></TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                        </div>
                                    ) : <div className="flex-1" />}
                                    {renderPromotedInput()}
                                </div>
                            )}

                            {/* Row 2: Custom Fields (Remaining) */}
                            {product?.customFields && product.customFields.length > (promotedCustomField ? 1 : 0) && (
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                                    {product.customFields.map((field) => {
                                        if (field.id === promotedCustomField?.id) return null;
                                        return (
                                            <div key={field.id} className="flex items-center gap-3">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                                    {field.name}
                                                </Label>
                                                <div className="flex items-center gap-2">
                                                    <Input 
                                                        type="number" 
                                                        className={cn("w-16 h-10 px-2 text-sm bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none", errors.customFieldValues?.[field.id] && "border-destructive")} 
                                                        {...register(`customFieldValues.${field.id}`, { valueAsNumber: true })} 
                                                    />
                                                    {errors.customFieldValues?.[field.id] && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 cursor-help" />
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{(errors.customFieldValues as any)?.[field.id]?.message || 'Required'}</p></TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Row 3: Sizes Cluster */}
                            {product?.sizes && product.sizes.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {product.sizes.map((size, index) => (
                                        <Controller
                                            key={size.name}
                                            name={`sizes.${index}.quantity`}
                                            control={control}
                                            render={({ field }) => {
                                                const isChecked = field.value !== undefined;
                                                const hasError = (errors.sizes as any)?.[index]?.quantity;
                                                
                                                if (!isChecked) {
                                                    return (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 rounded-full px-3 gap-1.5 transition-all text-xs"
                                                            onClick={() => {
                                                                field.onChange(null); // Explicit selection but blank
                                                                setTimeout(() => {
                                                                    document.getElementById(`size-input-${item.id}-${index}`)?.focus();
                                                                }, 0);
                                                            }}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            {size.name}
                                                        </Button>
                                                    );
                                                } else {
                                                    return (
                                                        <div className={cn(
                                                            "inline-flex items-center rounded-full h-8 pl-3 pr-1 gap-2 shadow-sm transition-colors",
                                                            hasError ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                                                        )}>
                                                            <span className="text-xs font-medium cursor-pointer" onClick={() => field.onChange(undefined)}>
                                                                {size.name}
                                                            </span>
                                                            <Input
                                                                id={`size-input-${item.id}-${index}`}
                                                                type="number"
                                                                className={cn(
                                                                    "h-6 px-1.5 py-0 text-xs bg-white border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-md font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                                    hasError ? "text-destructive" : "text-primary"
                                                                )}
                                                                style={{ width: `${Math.max(2, String(field.value ?? '').length + 1)}ch` }}
                                                                value={field.value ?? ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value === '' ? null : Number(e.target.value);
                                                                    field.onChange(val);
                                                                }}
                                                            />
                                                            {hasError && (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <AlertCircle className="h-3 w-3 shrink-0" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent><p>{hasError.message}</p></TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Unified Footer Row: Add-ons + Notes */}
                            <div className={cn(
                                "flex gap-6",
                                isComplexProduct ? "flex-col items-stretch" : "flex-wrap items-start"
                            )}>
                                {/* Add-ons cluster */}
                                {product?.addons && product.addons.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {product.addons.map((addon, index) => {
                                            const parentIndex = addon.dependsOn ? product.addons!.findIndex(a => a.id === addon.dependsOn) : -1;
                                            const parentValue = parentIndex !== -1 ? watchedValues.addons?.[parentIndex]?.value : undefined;
                                            const isParentActive = parentValue !== undefined ? (typeof parentValue === 'number' || parentValue === null ? true : !!parentValue) : true;
                                            
                                            if (!((!addon.dependsOn || isParentActive) && (!addon.visibleIfVariant || watchedValues.variant === addon.visibleIfVariant))) return null;
                                            
                                            return (
                                                <Controller
                                                    key={addon.id}
                                                    name={`addons.${index}.value`}
                                                    control={control}
                                                    render={({ field }) => {
                                                        const isChecked = field.value !== undefined;
                                                        const hasError = (errors.addons as any)?.[index]?.value;
                                                        
                                                        if (addon.type === 'checkbox') {
                                                            return (
                                                                <Button
                                                                    type="button"
                                                                    variant={field.value ? "default" : "outline"}
                                                                    size="sm"
                                                                    className="h-8 rounded-full px-3 gap-1.5 transition-all text-xs"
                                                                    onClick={() => field.onChange(field.value ? undefined : true)}
                                                                >
                                                                    {field.value ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                                                    {addon.name}
                                                                </Button>
                                                            );
                                                        } else {
                                                            if (!isChecked) {
                                                                return (
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-8 rounded-full px-3 gap-1.5 transition-all text-xs"
                                                                        onClick={() => {
                                                                            field.onChange(null); // Explicit selection but blank
                                                                            setTimeout(() => {
                                                                                document.getElementById(`addon-input-${addon.id}`)?.focus();
                                                                            }, 0);
                                                                        }}
                                                                    >
                                                                        <Plus className="h-3 w-3" />
                                                                        {addon.name}
                                                                    </Button>
                                                                );
                                                            } else {
                                                                return (
                                                                    <div className={cn(
                                                                        "inline-flex items-center rounded-full h-8 pl-3 pr-1 gap-2 shadow-sm transition-colors",
                                                                        hasError ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                                                                    )}>
                                                                        <span className="text-xs font-medium cursor-pointer" onClick={() => field.onChange(undefined)}>
                                                                            {addon.name}
                                                                        </span>
                                                                        <Input
                                                                            id={`addon-input-${addon.id}`}
                                                                            type="number"
                                                                            className={cn(
                                                                                "h-6 px-1.5 py-0 text-xs bg-white border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-md font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                                                hasError ? "text-destructive" : "text-primary"
                                                                            )}
                                                                            style={{ width: `${Math.max(2, String(field.value ?? '').length + 1)}ch` }}
                                                                            value={field.value ?? ''}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value === '' ? null : Number(e.target.value);
                                                                                field.onChange(val);
                                                                            }}
                                                                        />
                                                                        {hasError && (
                                                                            <TooltipProvider>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <AlertCircle className="h-3 w-3 shrink-0" />
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent><p>{hasError.message}</p></TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }
                                                        }
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Special Request (Notes) */}
                                <div className={cn(isComplexProduct ? "w-full" : "flex-1 min-w-[250px]")}>
                                    {renderNotesArea(true)}
                                </div>
                            </div>
                        </div>
                    )}
                </AccordionContent>
            </AccordionItem>
        </div>
    );
});
