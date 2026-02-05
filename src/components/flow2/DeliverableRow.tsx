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
    Frame,
    Package,
    Check,
    Pencil,
    MessageSquarePlus,
    Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { productCatalog } from '@/lib/product-data';
import type { Product, ConfiguredProduct } from '@/lib/types';
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
        variant: (product.variants && product.variants.length > 0) ? z.string().min(1, "Required") : z.string().optional(),
        specialRequest: z.string().optional(),
    };

    if (product.configType === 'A') {
        let qSchema = z.number({ required_error: "Required", invalid_type_error: "Required" });
        if (product.softConstraints) {
            product.softConstraints.forEach(constraint => {
                if (constraint.type === 'min') qSchema = qSchema.min(constraint.value, constraint.message.toUpperCase());
                if (constraint.type === 'max') qSchema = qSchema.max(constraint.value, constraint.message.toUpperCase());
            });
        }
        schemaObject.quantity = qSchema;
    }
    
    if (product.configType === 'B') {
        let pSchema = z.number({ required_error: "Required", invalid_type_error: "Required" });
        if (product.softConstraints) {
            product.softConstraints.forEach(constraint => {
                if (constraint.type === 'min') pSchema = pSchema.min(constraint.value, constraint.message.toUpperCase());
                if (constraint.type === 'max') pSchema = pSchema.max(constraint.value, constraint.message.toUpperCase());
            });
        }
        schemaObject.pages = pSchema;
    }
    
    if (product.customFields) {
        schemaObject.customFieldValues = z.object(
            product.customFields.reduce((acc, field) => {
                let fSchema = z.number({ required_error: "Required", invalid_type_error: "Required" });
                if (field.softConstraints) {
                    field.softConstraints.forEach(constraint => {
                        if (constraint.type === 'min') fSchema = fSchema.min(constraint.value, constraint.message.toUpperCase());
                        if (constraint.type === 'max') fSchema = fSchema.max(constraint.value, constraint.message.toUpperCase());
                    });
                }
                return { ...acc, [field.id]: fSchema };
            }, {})
        ).optional();
    }
    
    if (product.addons) {
        schemaObject.addons = z.array(z.object({
            id: z.string(), 
            name: z.string(),
            value: z.any()
        })).superRefine((addons, ctx) => {
            addons.forEach((addon, idx) => {
                const addonDef = product.addons?.find(a => a.id === addon.id);
                if (addon.value !== undefined && addon.value !== null) {
                    if (addonDef && (addonDef.type === 'numeric' || addonDef.type === 'physical_quantity')) {
                        if (addon.value === '') {
                             ctx.addIssue({
                                code: z.ZodIssueCode.custom,
                                message: "REQUIRED",
                                path: [idx, 'value']
                            });
                        } else if (typeof addon.value !== 'number') {
                             ctx.addIssue({
                                code: z.ZodIssueCode.custom,
                                message: "REQUIRED",
                                path: [idx, 'value']
                            });
                        } else if (addonDef.softConstraints) {
                            addonDef.softConstraints.forEach(constraint => {
                                if (constraint.type === 'min' && (addon.value as number) < constraint.value) {
                                    ctx.addIssue({
                                        code: z.ZodIssueCode.custom,
                                        message: constraint.message.toUpperCase(),
                                        path: [idx, 'value']
                                    });
                                }
                                if (constraint.type === 'max' && (addon.value as number) > constraint.value) {
                                    ctx.addIssue({
                                        code: z.ZodIssueCode.custom,
                                        message: constraint.message.toUpperCase(),
                                        path: [idx, 'value']
                                    });
                                }
                            });
                        }
                    }
                }
            });
        });
    }

    if (product.sizes) {
        schemaObject.sizes = z.array(z.object({
            name: z.string(), 
            quantity: z.union([z.number(), z.null(), z.undefined(), z.literal('')])
        })).superRefine((sizes, ctx) => {
            sizes.forEach((size, idx) => {
                const sizeDef = product.sizes?.find(s => s.name === size.name);
                if (sizeDef && sizeDef.softConstraints && size.quantity !== undefined && size.quantity !== null && size.quantity !== '') {
                    sizeDef.softConstraints.forEach(constraint => {
                        if (constraint.type === 'min' && (size.quantity as number) < constraint.value) {
                            ctx.addIssue({
                                code: z.ZodIssueCode.custom,
                                message: constraint.message.toUpperCase(),
                                path: [idx, 'quantity']
                            });
                        }
                        if (constraint.type === 'max' && (size.quantity as number) > constraint.value) {
                            ctx.addIssue({
                                code: z.ZodIssueCode.custom,
                                message: constraint.message.toUpperCase(),
                                path: [idx, 'quantity']
                            });
                        }
                    });
                }
            });
        });
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
                return { 
                    id: addon.id, 
                    name: addon.name, 
                    value: existingAddon?.value ?? undefined
                };
            }) || [],
            sizes: product?.sizes?.map(size => {
                const existingSize = item.sizes?.find(s => s.name === size.name);
                return { name: size.name, quantity: existingSize?.quantity ?? undefined };
            }) || []
        },
        mode: 'onChange'
    });

    const { register, control, watch, formState: { errors, isValid }, trigger, getValues } = form;
    
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

    const performSyncUpdate = React.useCallback(() => {
        const currentValues = getValues();
        onUpdate(item.id, {
            ...currentValues,
            addons: currentValues.addons?.filter((a: any) => a.value !== undefined) as any,
            sizes: currentValues.sizes?.filter((s: any) => s.quantity !== undefined) as any
        });
    }, [getValues, item.id, onUpdate]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            performSyncUpdate();
            trigger();
        }, 300);
        return () => clearTimeout(timer);
    }, [
        watchedValues.quantity, 
        watchedValues.pages, 
        watchedValues.specialRequest, 
        watchedValues.customFieldValues, 
        watchedValues.addons, 
        watchedValues.sizes, 
        watchedValues.variant, 
        performSyncUpdate,
        trigger
    ]);

    const handleDoneClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const result = await trigger();
        if (result) {
            performSyncUpdate();
            onDone(item.id);
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
        
        if (!hasVariants && parts.length === 0) return '';
        
        return parts.join(' • ');
    };

    const getPriorityWarning = React.useCallback(() => {
        if (isValid) return null;

        const qError = errors.quantity as any;
        if (qError?.message && qError.message.toUpperCase() !== 'REQUIRED') return qError.message.toUpperCase();
        
        const pError = errors.pages as any;
        if (pError?.message && pError.message.toUpperCase() !== 'REQUIRED') return pError.message.toUpperCase();

        if (errors.customFieldValues) {
            const cfErrors = errors.customFieldValues as Record<string, any>;
            for (const key in cfErrors) {
                const msg = cfErrors[key]?.message;
                if (msg && String(msg).toUpperCase() !== 'REQUIRED') return String(msg).toUpperCase();
            }
        }

        if (errors.addons && Array.isArray(errors.addons)) {
            for (const err of (errors.addons as any[])) {
                const msg = err?.value?.message || err?.message;
                if (msg && String(msg).toUpperCase() !== 'REQUIRED') return String(msg).toUpperCase();
            }
        }

        if (errors.sizes && Array.isArray(errors.sizes)) {
            for (const err of (errors.sizes as any[])) {
                const msg = err?.quantity?.message || err?.message;
                if (msg && String(msg).toUpperCase() !== 'REQUIRED') return String(msg).toUpperCase();
            }
        }

        return 'SETUP REQUIRED';
    }, [isValid, errors]);

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

    const iconStatusClasses = !isValid 
        ? "text-destructive bg-destructive/10"
        : isExpanded 
            ? "text-blue-600 bg-blue-50" 
            : "text-green-600 bg-green-100";

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
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap min-w-[40px]">QTY *</Label>
                    <Input 
                        id={`qty-input-${item.id}`}
                        type="number" 
                        {...register('quantity', { valueAsNumber: true })}
                        className="w-24 h-10 text-lg bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                        ref={(e) => {
                            register('quantity').ref(e);
                            // @ts-ignore
                            qtyInputRef.current = e;
                        }}
                    />
                </div>
            );
        }
        if (product?.configType === 'B') {
            return (
                <div className="flex items-center gap-4">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap min-w-[40px]">PAGES *</Label>
                    <Input 
                        id={`pages-input-${item.id}`}
                        type="number" 
                        {...register('pages', { valueAsNumber: true })}
                        className="w-24 h-10 text-lg bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    />
                </div>
            );
        }
        if (promotedCustomField) {
            return (
                <div className="flex items-center gap-4">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap min-w-[40px]">
                        {promotedCustomField.name} *
                    </Label>
                    <Input 
                        id={`custom-input-${item.id}-${promotedCustomField.id}`}
                        type="number" 
                        className="w-24 h-10 text-lg bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                        {...register(`customFieldValues.${promotedCustomField.id}`, { valueAsNumber: true })} 
                    />
                </div>
            );
        }
        return null;
    };

    const isBranchA = product?.configType === 'A';
    const isComplexProduct = item.productId === 4 || item.productId === 5; 
    const showHeader = (product?.variants && product.variants.length > 0) || renderPromotedInput() !== null;
    const warningText = getPriorityWarning();

    return (
        <div className="group relative">
            <AccordionItem 
                value={item.id} 
                id={`deliverable-${item.id}`}
                className={cn(
                    "border rounded-xl transition-all duration-200 overflow-hidden scroll-mt-[176px]",
                    isExpanded 
                        ? "border-l-4 border-primary shadow-md bg-background ring-2 ring-primary/10" 
                        : cn(
                            "bg-card hover:bg-muted/50",
                            !isValid && "border-destructive border-2 bg-destructive/5"
                        )
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
                            {warningText ? (
                                <Badge variant="destructive" className="bg-destructive text-destructive-foreground text-[10px] h-4 py-0 font-bold tracking-wide uppercase">
                                    {warningText}
                                </Badge>
                            ) : !isExpanded && (
                                <div className="text-xs text-muted-foreground truncate flex-1">
                                    {getSummaryText()}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
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
                    <AccordionTrigger className="invisible">
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
                            {showHeader && (
                                <div className="flex flex-wrap items-start justify-between gap-6">
                                    {product?.variants && product.variants.length > 0 ? (
                                        <div className="flex items-start gap-4 flex-1">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap min-w-[40px] mt-2.5">
                                                Variant *
                                            </Label>
                                            <div className="flex flex-wrap gap-2">
                                                {product.variants!.map(v => (
                                                    <Button
                                                        key={v}
                                                        type="button"
                                                        variant={watchedValues.variant === v ? "default" : "outline"}
                                                        size="sm"
                                                        className={cn(
                                                            "h-9 rounded-full px-4 transition-all",
                                                            watchedValues.variant === v ? "shadow-sm" : "hover:bg-accent hover:text-accent-foreground"
                                                        )}
                                                        onClick={() => form.setValue('variant', v, { shouldValidate: true })}
                                                    >
                                                        {v}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : <div className="flex-1" />}
                                    {renderPromotedInput()}
                                </div>
                            )}

                            {product?.customFields && product.customFields.length > (promotedCustomField ? 1 : 0) && (
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                                    {product.customFields.map((field) => {
                                        if (field.id === promotedCustomField?.id) return null;
                                        return (
                                            <div key={field.id} className="flex items-center gap-3">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                                    {field.name} *
                                                </Label>
                                                <Input 
                                                    id={`custom-input-${item.id}-${field.id}`}
                                                    type="number" 
                                                    className="w-16 h-10 px-2 text-sm bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                                    {...register(`customFieldValues.${field.id}`, { valueAsNumber: true })} 
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {product?.sizes && product.sizes.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {product.sizes.map((size, index) => (
                                        <Controller
                                            key={size.name}
                                            name={`sizes.${index}.quantity`}
                                            control={control}
                                            render={({ field }) => {
                                                const isChecked = field.value !== undefined;
                                                
                                                if (!isChecked) {
                                                    return (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 rounded-full px-3 gap-1.5 transition-all text-xs"
                                                            onClick={() => {
                                                                field.onChange(null); 
                                                                setTimeout(() => {
                                                                    document.getElementById(`size-input-${item.id}-${size.name.replace(/\s+/g, '-')}`)?.focus();
                                                                }, 0);
                                                            }}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            {size.name}
                                                        </Button>
                                                    );
                                                } else {
                                                    return (
                                                        <div className="inline-flex items-center rounded-full h-8 pl-3 pr-1 gap-2 shadow-sm transition-colors bg-primary text-primary-foreground">
                                                            <span className="text-xs font-medium cursor-pointer" onClick={() => field.onChange(undefined)}>
                                                                {size.name}
                                                            </span>
                                                            <Input
                                                                id={`size-input-${item.id}-${size.name.replace(/\s+/g, '-')}`}
                                                                type="number"
                                                                className="h-6 px-2 py-0 text-xs bg-white border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-md font-bold text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                style={{ width: `${Math.max(2, String(field.value ?? '').length + 2)}ch` }}
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                                                onKeyDown={(e) => { 
                                                                    if (e.key === 'Enter') e.currentTarget.blur(); 
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            <div className={cn("flex", isComplexProduct ? "flex-col items-stretch gap-4" : "flex-wrap items-start gap-6")}>
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
                                                                            field.onChange(null); 
                                                                            setTimeout(() => {
                                                                                document.getElementById(`addon-input-${item.id}-${addon.id}`)?.focus();
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
                                                                            id={`addon-input-${item.id}-${addon.id}`}
                                                                            type="number"
                                                                            className="h-6 px-2 py-0 text-xs bg-white border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-md font-bold text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                            style={{ width: `${Math.max(2, String(field.value ?? '').length + 2)}ch` }}
                                                                            value={field.value ?? ''}
                                                                            onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                                                            onKeyDown={(e) => { 
                                                                                if (e.key === 'Enter') e.currentTarget.blur(); 
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
