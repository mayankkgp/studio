'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    AlertTriangle, 
    Trash2, 
    Package,
    Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { productCatalog } from '@/lib/product-data';
import type { Product, ConfiguredProduct, SoftConstraint } from '@/lib/types';
import { useOrder } from '@/context/OrderContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
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
    onDone: () => void;
    onValidityChange: (id: string, isValid: boolean) => void;
}

const getValidationSchema = (product: Product | null) => {
    if (!product) return z.object({});
    
    let schemaObject: any = {
        variant: product.variants ? z.string().min(1, "Variant required") : z.string().optional(),
        specialRequest: z.string().optional(),
    };

    if (product.configType === 'A') schemaObject.quantity = z.number().min(1, "Qty required").default(1);
    if (product.configType === 'B') schemaObject.pages = z.number().min(1, "Pages required").default(1);
    
    if (product.customFields) {
        schemaObject.customFieldValues = z.object(
            product.customFields.reduce((acc, field) => ({
                ...acc, [field.id]: z.number().min(0).default(0)
            }), {})
        ).optional();
    }
    
    if (product.addons) {
        schemaObject.addons = z.array(z.object({
            id: z.string(), 
            name: z.string(),
            value: z.union([z.boolean(), z.number()]).default(false)
        })).optional();
    }

    if (product.sizes) {
        schemaObject.sizes = z.array(z.object({
            name: z.string(), 
            quantity: z.number().min(0).default(0)
        })).optional();
    }
    
    return z.object(schemaObject);
};

export const DeliverableRow = React.memo(function DeliverableRow({ item, isExpanded, onDone, onValidityChange }: DeliverableRowProps) {
    const { updateDeliverable, removeDeliverable } = useOrder();
    const product = productCatalog.find(p => p.id === item.productId) || null;
    
    const qtyInputRef = React.useRef<HTMLInputElement>(null);
    const variantTriggerRef = React.useRef<HTMLButtonElement>(null);

    const form = useForm({
        resolver: zodResolver(getValidationSchema(product)),
        defaultValues: {
            variant: item.variant,
            quantity: item.quantity,
            pages: item.pages,
            specialRequest: item.specialRequest,
            customFieldValues: item.customFieldValues || {},
            addons: product?.addons?.map(addon => {
                const existingAddon = item.addons?.find(a => a.id === addon.id);
                return { 
                    id: addon.id, 
                    name: addon.name, 
                    value: existingAddon?.value ?? (addon.type === 'checkbox' ? false : 0) 
                };
            }) || [],
            sizes: product?.sizes?.map(size => {
                const existingSize = item.sizes?.find(s => s.name === size.name);
                return { name: size.name, quantity: existingSize?.quantity || 0 };
            }) || []
        },
        mode: 'onChange'
    });

    const { register, control, watch, formState: { errors, isValid }, handleSubmit, trigger, setValue } = form;
    const watchedValues = watch();

    React.useEffect(() => {
        onValidityChange(item.id, isValid);
    }, [isValid, item.id, onValidityChange]);

    React.useEffect(() => {
        if (isExpanded) {
            const timer = setTimeout(() => {
                if (product?.variants) {
                    variantTriggerRef.current?.focus();
                } else if (product?.configType === 'A') {
                    qtyInputRef.current?.focus();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isExpanded, product]);

    React.useEffect(() => {
        const subscription = watch((value) => {
            const warning = checkWarnings(value, product);
            updateDeliverable(item.id, {
                ...value,
                warning,
                addons: value.addons?.filter((a: any) => a.value !== false && a.value !== 0) as any,
                sizes: value.sizes?.filter((s: any) => s.quantity > 0) as any
            });
        });
        return () => subscription.unsubscribe();
    }, [watch, updateDeliverable, item.id, product]);

    const checkWarnings = (data: any, product: Product | null): string | undefined => {
        if (!product) return undefined;
        const warnings: string[] = [];

        const check = (value: number, constraints: SoftConstraint[]) => {
            constraints.forEach(c => {
                if (c.type === 'min' && value > 0 && value < c.value) warnings.push(c.message);
                if (c.type === 'max' && value > c.value) warnings.push(c.message);
            });
        };

        if (product.configType === 'A' && product.softConstraints) {
            let value = data.quantity;
            if (product.specialLogic === 'WaxSealCustomQty' && data.variant === 'Custom') {
                if (value > 0 && value < 25) warnings.push('MOQ for Custom is 25.');
            } else {
                 check(value, product.softConstraints);
            }
        }
        if (product.configType === 'D') {
            const total = Object.values(data.customFieldValues || {}).reduce((a: any, b: any) => a + (b as number), 0) as number;
            if (total === 0) warnings.push('Please enter at least one quantity.');
        }

        product.addons?.forEach((addon, index) => {
            const addonValue = data.addons?.[index]?.value;
            if (addon.softConstraints && (typeof addonValue === 'number' && addonValue > 0)) {
                check(addonValue, addon.softConstraints);
            }
        });
        
        product.sizes?.forEach((size, index) => {
            const sizeQty = data.sizes?.[index]?.quantity;
            if (size.softConstraints && sizeQty) {
                check(sizeQty, size.softConstraints);
            }
        });

        return warnings.join(' ');
    };

    const handleDoneClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const result = await trigger();
        if (result) {
            onDone();
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to remove this item? All configurations for this deliverable will be lost.")) {
            removeDeliverable(item.id);
        }
    }

    const getSummary = () => {
        if (!product) return '';
        
        if (product.variants && !watchedValues.variant) {
            return <Badge variant="destructive" className="bg-destructive text-destructive-foreground animate-pulse text-[10px] h-4 py-0">Setup Required</Badge>;
        }

        const parts: string[] = [];
        if (watchedValues.variant) parts.push(watchedValues.variant);
        
        if (product.configType === 'A' && watchedValues.quantity) {
            parts.push(`Qty: ${watchedValues.quantity}`);
        } else if (product.configType === 'B' && watchedValues.pages) {
            parts.push(`${watchedValues.pages} Pages`);
        } else if (product.configType === 'D' && watchedValues.customFieldValues) {
            const total = Object.values(watchedValues.customFieldValues).reduce((a: any, b: any) => (a as number) + (b as number), 0);
            if (total > 0) parts.push(`${total} Units`);
        } else if (product.configType === 'E' && watchedValues.sizes) {
            const total = watchedValues.sizes.reduce((a: any, b: any) => (a as number) + (b.quantity as number), 0);
            if (total > 0) parts.push(`${total} Units`);
        }

        const activeAddons = watchedValues.addons?.filter((a: any) => typeof a.value === 'number' ? a.value > 0 : !!a.value).length || 0;
        if (activeAddons > 0) parts.push(`${activeAddons} Add-ons`);

        return parts.join(' • ');
    };

    return (
        <div className="group relative">
            <AccordionItem 
                value={item.id} 
                id={`deliverable-${item.id}`}
                className={cn(
                    "border rounded-xl transition-all duration-200 overflow-hidden",
                    isExpanded 
                        ? "border-l-4 border-primary shadow-md bg-background ring-2 ring-primary/10" 
                        : "bg-card hover:bg-muted/50",
                    !isValid && !isExpanded && "border-destructive border-2 bg-destructive/5"
                )}
            >
                <div className={cn("flex items-center px-4 transition-all", isExpanded ? "h-16" : "h-12")}>
                    <AccordionTrigger className="flex-1 hover:no-underline py-0">
                        <div className="flex items-center gap-3 text-left w-full overflow-hidden">
                            {!isExpanded ? (
                                <Package className="h-4 w-4 text-primary/60 shrink-0" />
                            ) : (
                                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary text-primary-foreground shrink-0">
                                    <Package className="h-5 w-5" />
                                </div>
                            )}
                            <div className={cn("flex items-baseline gap-3", !isExpanded && "flex-1")}>
                                <h3 className={cn("font-semibold leading-none shrink-0", isExpanded ? "text-base" : "text-sm")}>
                                    {item.productName}
                                </h3>
                                {!isExpanded && (
                                    <div className="text-xs text-muted-foreground truncate flex-1">
                                        {getSummary()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </AccordionTrigger>

                    <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                        {item.warning && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="p-1.5 rounded-full bg-accent/10 text-accent cursor-help">
                                            <AlertTriangle className="h-4 w-4" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{item.warning}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}

                        {!isExpanded && product?.configType === 'A' && (
                            <div className="flex items-center gap-2">
                                <Label htmlFor={`qty-h-${item.id}`} className="sr-only">Quantity</Label>
                                <Input
                                    id={`qty-h-${item.id}`}
                                    type="number"
                                    className="w-16 h-8 bg-background/50 text-xs"
                                    {...register('quantity', { valueAsNumber: true })}
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                onClick={handleDelete}
                                title="Remove Item"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            
                            {isExpanded && (
                                <Button size="sm" onClick={handleDoneClick} className="gap-2 h-8">
                                    <Check className="h-4 w-4" />
                                    Done
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <AccordionContent className="px-4 pb-4 border-t bg-muted/5 relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        <div className="space-y-4">
                            {/* Prominent Quantity for Type A in Expanded View (At the very top) */}
                            {product?.configType === 'A' && (
                                <div className="space-y-1.5 p-4 rounded-lg border-2 border-primary/20 bg-primary/5 shadow-sm">
                                    <Label className={cn(
                                        "text-xs font-bold uppercase tracking-wider",
                                        errors.quantity ? "text-destructive" : "text-primary"
                                    )}>
                                        Base Quantity {errors.quantity && " (Required)"}
                                    </Label>
                                    <Input 
                                        type="number" 
                                        {...register('quantity', { valueAsNumber: true })} 
                                        className={cn("h-12 text-xl font-bold bg-background", errors.quantity && "border-destructive")} 
                                        ref={(e) => {
                                            register('quantity').ref(e);
                                            // @ts-ignore
                                            qtyInputRef.current = e;
                                        }}
                                    />
                                    {errors.quantity && <p className="text-xs text-destructive font-medium">{errors.quantity.message}</p>}
                                </div>
                            )}

                            {/* Variant Selection */}
                            {product?.variants && (
                                <div className="space-y-1.5">
                                    <Label className={cn(
                                        "text-xs font-semibold uppercase tracking-wider",
                                        errors.variant ? "text-destructive" : "text-muted-foreground"
                                    )}>
                                        Variant {errors.variant && " (Required)"}
                                    </Label>
                                    <Controller
                                        name="variant"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger 
                                                    className={cn("h-9", errors.variant && "border-destructive")}
                                                    ref={variantTriggerRef}
                                                >
                                                    <SelectValue placeholder="Select variant" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {product.variants!.map(v => (
                                                        <SelectItem key={v} value={v}>{v}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.variant && <p className="text-xs text-destructive">{errors.variant.message}</p>}
                                </div>
                            )}

                            {/* Configuration Specifics */}
                            {product?.configType === 'B' && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pages</Label>
                                    <Input type="number" {...register('pages', { valueAsNumber: true })} className="h-9" />
                                </div>
                            )}

                            {product?.configType === 'D' && product.customFields && (
                                <div className="space-y-3 p-3 rounded-lg border bg-background/50">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantities</Label>
                                    {product.customFields.map((field) => (
                                        <div key={field.id} className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{field.name}</span>
                                            <Input type="number" className="w-24 h-8" {...register(`customFieldValues.${field.id}`, { valueAsNumber: true })} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {product?.configType === 'E' && product.sizes && (
                                <div className="space-y-3 p-3 rounded-lg border bg-background/50">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sizes</Label>
                                    {product.sizes.map((size, idx) => (
                                        <div key={size.name} className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{size.name}</span>
                                            <Input type="number" className="w-24 h-8" {...register(`sizes.${idx}.quantity`, { valueAsNumber: true })} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Special Request</Label>
                                <Textarea {...register('specialRequest')} className="min-h-[80px] bg-background/50" placeholder="Notes for production..." />
                            </div>
                        </div>

                        {/* Add-ons Section */}
                        <div className="space-y-4">
                            {product?.addons && product.addons.length > 0 && (
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add-ons</Label>
                                    <div className="space-y-2 rounded-lg border bg-background/50 p-4">
                                        {product.addons.map((addon, index) => {
                                            const parentIndex = addon.dependsOn ? product.addons!.findIndex(a => a.id === addon.dependsOn) : -1;
                                            const parentValue = parentIndex !== -1 ? watchedValues.addons?.[parentIndex]?.value : undefined;
                                            const isParentActive = parentValue !== undefined ? (typeof parentValue === 'number' ? parentValue > 0 : !!parentValue) : true;

                                            const isVisible = (!addon.dependsOn || isParentActive) && 
                                                              (!addon.visibleIfVariant || watchedValues.variant === addon.visibleIfVariant);
                                            
                                            if (!isVisible) return null;

                                            const isChecked = typeof watchedValues.addons?.[index]?.value === 'number' 
                                                ? watchedValues.addons?.[index]?.value > 0 
                                                : !!watchedValues.addons?.[index]?.value;

                                            return (
                                                <div key={addon.id} className="flex items-center justify-between py-1 animate-in fade-in slide-in-from-top-1">
                                                    <div className="flex items-center gap-3">
                                                        <Controller
                                                            name={`addons.${index}.value`}
                                                            control={control}
                                                            render={({ field }) => (
                                                                addon.type === 'checkbox' ? (
                                                                    <Checkbox 
                                                                        checked={!!field.value} 
                                                                        onCheckedChange={field.onChange} 
                                                                    />
                                                                ) : (
                                                                    <Checkbox 
                                                                        checked={isChecked} 
                                                                        onCheckedChange={(checked) => {
                                                                            if (checked) {
                                                                                const val = (typeof field.value === 'number' && field.value > 0) ? field.value : 1;
                                                                                field.onChange(val);
                                                                            } else {
                                                                                field.onChange(false);
                                                                            }
                                                                        }} 
                                                                    />
                                                                )
                                                            )}
                                                        />
                                                        <span className="text-sm">{addon.name}</span>
                                                    </div>
                                                    
                                                    {addon.type !== 'checkbox' && isChecked && (
                                                        <Input
                                                            type="number"
                                                            className="w-20 h-8"
                                                            {...register(`addons.${index}.value`, { valueAsNumber: true })}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </div>
    );
});
