'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    AlertTriangle, 
    ChevronDown, 
    ChevronUp, 
    MoreHorizontal, 
    Trash2, 
    Settings2, 
    Package,
    ChevronRight
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DeliverableRowProps {
    item: ConfiguredProduct;
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

export function DeliverableRow({ item }: DeliverableRowProps) {
    const { updateDeliverable, removeDeliverable } = useOrder();
    const product = productCatalog.find(p => p.id === item.productId) || null;
    
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

    const { register, control, watch, formState: { errors }, handleSubmit } = form;
    const watchedValues = watch();

    // Auto-update context when form changes
    React.useEffect(() => {
        const subscription = watch((value) => {
            const warning = checkWarnings(value, product);
            updateDeliverable(item.id, {
                ...value,
                warning,
                addons: value.addons?.filter((a: any) => a.value) as any,
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
            if (addon.softConstraints && addonValue) {
                check(typeof addonValue === 'number' ? addonValue : 1, addon.softConstraints);
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

    const getSummary = () => {
        if (!product) return '';
        const parts: string[] = [];
        
        if (item.variant) parts.push(item.variant);
        
        if (product.configType === 'A' && item.quantity) {
            parts.push(`Qty: ${item.quantity}`);
        } else if (product.configType === 'B' && item.pages) {
            parts.push(`${item.pages} Pages`);
        } else if (product.configType === 'D' && item.customFieldValues) {
            const total = Object.values(item.customFieldValues).reduce((a, b) => a + b, 0);
            parts.push(`${total} Units`);
        } else if (product.configType === 'E' && item.sizes) {
            const total = item.sizes.reduce((a, b) => a + b.quantity, 0);
            parts.push(`${total} Units`);
        }

        if (item.addons?.length) {
            parts.push(`${item.addons.length} Add-ons`);
        }

        return parts.join(' • ');
    };

    return (
        <div className="group relative">
            <AccordionItem value={item.id} className="border rounded-xl bg-card shadow-sm overflow-hidden transition-all data-[state=open]:ring-2 data-[state=open]:ring-primary/20">
                <div className="flex items-center px-4 h-16">
                    <AccordionTrigger className="flex-1 hover:no-underline py-0">
                        <div className="flex items-center gap-4 text-left">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base leading-none">{item.productName}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{getSummary()}</p>
                            </div>
                        </div>
                    </AccordionTrigger>

                    <div className="flex items-center gap-3 ml-4" onClick={(e) => e.stopPropagation()}>
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

                        {product?.configType === 'A' && (
                            <div className="flex items-center gap-2">
                                <Label htmlFor={`qty-${item.id}`} className="sr-only">Quantity</Label>
                                <Input
                                    id={`qty-${item.id}`}
                                    type="number"
                                    className="w-20 h-9 bg-background/50"
                                    {...register('quantity', { valueAsNumber: true })}
                                />
                            </div>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem className="text-destructive" onClick={() => removeDeliverable(item.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove Item
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <AccordionContent className="px-4 pb-4 border-t bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        <div className="space-y-4">
                            {/* Variant Selection */}
                            {product?.variants && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variant</Label>
                                    <Controller
                                        name="variant"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger className="h-9">
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
                                            const isVisible = (!addon.dependsOn || watchedValues.addons?.[product.addons!.findIndex(a => a.id === addon.dependsOn)]?.value) && 
                                                              (!addon.visibleIfVariant || watchedValues.variant === addon.visibleIfVariant);
                                            
                                            if (!isVisible) return null;

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
                                                                        checked={!!field.value} 
                                                                        onCheckedChange={(checked) => field.onChange(checked ? (typeof field.value === 'number' ? field.value : 1) : false)} 
                                                                    />
                                                                )
                                                            )}
                                                        />
                                                        <span className="text-sm">{addon.name}</span>
                                                    </div>
                                                    
                                                    {addon.type !== 'checkbox' && !!watchedValues.addons?.[index]?.value && (
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
}
