'use client';

import * as React from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Product, ConfiguredProduct, SoftConstraint } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

interface ProductConfiguratorProps {
  product: Product | null;
  configuredProduct?: ConfiguredProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ConfiguredProduct) => void;
}

function FormError({ message }: { message?: string }) {
  return (
    <div className={cn(
      "overflow-hidden transition-all duration-300 ease-in-out",
      message ? "max-h-10 opacity-100 mt-1" : "max-h-0 opacity-0"
    )}>
      <p className="text-[10px] font-medium text-destructive animate-in fade-in slide-in-from-top-0.5">
        {message}
      </p>
    </div>
  );
}

const getValidationSchema = (product: Product | null) => {
    if (!product) return z.object({});
    
    let schemaObject: any = {
        variant: product.variants ? z.string().min(1, "Please select a variant") : z.string().optional(),
        specialRequest: z.string().optional(),
    };

    if (product.configType === 'A') schemaObject.quantity = z.number().min(1, "Quantity required").default(1);
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
            id: z.string(), name: z.string(),
            value: z.union([z.boolean(), z.number()]).default(false)
        })).optional();
    }

    if (product.sizes) {
        schemaObject.sizes = z.array(z.object({
            name: z.string(), quantity: z.number().min(0).default(0)
        })).optional();
    }
    
    return z.object(schemaObject);
};

export function ProductConfigurator({ product, configuredProduct, isOpen, onClose, onSave }: ProductConfiguratorProps) {
    const isEditing = !!configuredProduct;
    
    const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm({
        resolver: zodResolver(getValidationSchema(product)),
    });
    
    const watchedVariant = watch('variant');
    const watchedAddons = watch('addons');

    React.useEffect(() => {
        if (product && isOpen) {
            const defaultValues: any = {
                variant: configuredProduct?.variant || (product.variants ? product.variants[0] : undefined),
                quantity: configuredProduct?.quantity || (product.configType === 'A' ? 1 : undefined),
                pages: configuredProduct?.pages || (product.configType === 'B' ? 1 : undefined),
                specialRequest: configuredProduct?.specialRequest || '',
                customFieldValues: configuredProduct?.customFieldValues || {},
                addons: product.addons?.map(addon => {
                    const existingAddon = configuredProduct?.addons.find(a => a.id === addon.id);
                    return { id: addon.id, name: addon.name, value: existingAddon?.value ?? (addon.type === 'checkbox' ? false : 0) };
                }) || [],
                sizes: product.sizes?.map(size => {
                    const existingSize = configuredProduct?.sizes?.find(s => s.name === size.name);
                    return { name: size.name, quantity: existingSize?.quantity || 0 };
                })
            };
            reset(defaultValues);
        }
    }, [product, configuredProduct, isOpen, reset]);

    const { fields: addonFields } = useFieldArray({ control, name: "addons" });
    const { fields: sizeFields } = useFieldArray({ control, name: "sizes" });

    const checkWarnings = (data: any): string | undefined => {
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
            const total = Object.values(data.customFieldValues || {}).reduce((a: any, b: any) => a + b, 0) as number;
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

        if (product.specialLogic === 'RitualCardBlossom') {
            const petals = data.customFieldValues?.petals || 0;
            if (petals > 12) warnings.push('Max recommended petals is 12.');
        }

        return warnings.join(' ');
    };

    const onSubmit = (data: any) => {
        if (!product) return;
        const warning = checkWarnings(data);

        const finalProduct: ConfiguredProduct = {
            id: configuredProduct?.id || `${product.id}-${Date.now()}`,
            productId: product.id,
            productName: product.name,
            quantity: data.quantity,
            pages: data.pages,
            variant: data.variant,
            customFieldValues: data.customFieldValues,
            addons: data.addons?.filter((a: any) => a.value) || [],
            sizes: data.sizes?.filter((s: any) => s.quantity > 0),
            specialRequest: data.specialRequest,
            warning,
        };
        onSave(finalProduct);
        onClose();
    };
    
    if (!product) return null;
    
    const findAddonValue = (id: string) => watchedAddons?.find((a: any) => a.id === id)?.value;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit' : 'Configure'} {product.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <ScrollArea className="max-h-[70vh] p-1">
                        <div className="space-y-4 px-4">
                            {/* Variants */}
                            {product.variants && (
                                <div className="space-y-2">
                                    <Label className={cn(errors.variant && "text-destructive")}>Variant</Label>
                                    <Controller name="variant" control={control} render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger className={cn(errors.variant && "border-destructive")}>
                                              <SelectValue placeholder="Select a variant" />
                                            </SelectTrigger>
                                            <SelectContent>{product.variants?.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                                        </Select>
                                    )}/>
                                    <FormError message={errors.variant?.message as string} />
                                </div>
                            )}

                            {/* Config Type A */}
                            {product.configType === 'A' && (
                                <div className="space-y-2">
                                    <Label htmlFor="quantity" className={cn(errors.quantity && "text-destructive")}>Quantity</Label>
                                    <Input id="quantity" type="number" {...register('quantity', { valueAsNumber: true })} className={cn(errors.quantity && "border-destructive")} />
                                    <FormError message={errors.quantity?.message as string} />
                                </div>
                            )}

                             {/* Config Type B */}
                            {product.configType === 'B' && (
                                <div className="space-y-2">
                                    <Label htmlFor="pages" className={cn(errors.pages && "text-destructive")}>Pages</Label>
                                    <Input id="pages" type="number" {...register('pages', { valueAsNumber: true })} className={cn(errors.pages && "border-destructive")} />
                                    <FormError message={errors.pages?.message as string} />
                                </div>
                            )}

                            {/* Config Type D */}
                            {product.configType === 'D' && product.customFields && (
                                <div className="space-y-2 rounded-md border p-4">
                                    <Label>Quantities</Label>
                                    {product.customFields.map((field) => (
                                       <div key={field.id} className="mt-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor={`customFieldValues.${field.id}`} className="text-xs">{field.name}</Label>
                                                <Input type="number" id={`customFieldValues.${field.id}`} className="w-20 h-8 text-xs" {...register(`customFieldValues.${field.id}`, { valueAsNumber: true })} />
                                            </div>
                                        </div>
                                    ))}
                                    {errors.customFieldValues && <FormError message="At least one quantity is required" />}
                                </div>
                            )}
                            
                            {/* Special Logic: RitualCardBlossom */}
                            {product.specialLogic === 'RitualCardBlossom' && product.customFields && (
                                <div className="space-y-2">
                                    <Label htmlFor={`customFieldValues.${product.customFields[0].id}`}>Petals</Label>
                                    <Input type="number" id={`customFieldValues.${product.customFields[0].id}`} {...register(`customFieldValues.${product.customFields[0].id}`, { valueAsNumber: true })} />
                                    <FormError message={errors.customFieldValues?.petals?.message as string} />
                                </div>
                            )}

                            {/* Add-ons */}
                            {product.addons && addonFields.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Add-ons</Label>
                                    <div className="space-y-3 rounded-md border p-4">
                                        {addonFields.map((field, index) => {
                                            const addonDef = product.addons![index];
                                            const isVisible = (!addonDef.dependsOn || findAddonValue(addonDef.dependsOn)) && (!addonDef.visibleIfVariant || watchedVariant === addonDef.visibleIfVariant);
                                            if (!isVisible) return null;

                                            return (
                                                <div key={field.id} className="animate-in fade-in slide-in-from-top-1 duration-200">
                                                    {addonDef.type === 'checkbox' && (
                                                        <Controller name={`addons.${index}.value`} control={control} render={({ field: checkboxField }) => (
                                                            <div className='flex items-center gap-2'>
                                                              <Checkbox id={`addons.${index}.value`} checked={!!checkboxField.value} onCheckedChange={checkboxField.onChange} />
                                                              <Label htmlFor={`addons.${index}.value`} className='font-normal text-sm'>{addonDef.name}</Label>
                                                            </div>
                                                        )}/>
                                                    )}
                                                    {addonDef.type === 'numeric' && (
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor={`addons.${index}.value`} className="text-sm">{addonDef.name}</Label>
                                                            <Input id={`addons.${index}.value`} type="number" className="w-20 h-8" {...register(`addons.${index}.value`, { valueAsNumber: true })} />
                                                        </div>
                                                    )}
                                                    {addonDef.type === 'physical_quantity' && (
                                                        <Controller
                                                            name={`addons.${index}.value`}
                                                            control={control}
                                                            render={({ field: physicalField }) => (
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <Checkbox
                                                                                id={`addons.${index}.checkbox`}
                                                                                checked={!!physicalField.value}
                                                                                onCheckedChange={(checked) => {
                                                                                    physicalField.onChange(checked ? 1 : false);
                                                                                }}
                                                                            />
                                                                            <Label htmlFor={`addons.${index}.checkbox`} className="font-normal text-sm">{addonDef.name}</Label>
                                                                        </div>
                                                                        {!!physicalField.value && (
                                                                            <Input
                                                                                id={`addons.${index}.value`}
                                                                                type="number"
                                                                                className="w-20 h-8 animate-in zoom-in-95 duration-150"
                                                                                value={typeof physicalField.value === 'number' ? physicalField.value : 1}
                                                                                onChange={e => physicalField.onChange(parseInt(e.target.value) || 0)}
                                                                                min={1}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Sizes (Type E) */}
                            {product.configType === 'E' && sizeFields.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Sizes</Label>
                                    <div className="space-y-2 rounded-md border p-4">
                                        {sizeFields.map((field, index) => (
                                            <div key={field.id} className="flex items-center justify-between">
                                                <Label htmlFor={`sizes.${index}.quantity`} className="text-sm">{product.sizes![index].name}</Label>
                                                <Input id={`sizes.${index}.quantity`} type="number" className="w-20 h-8" {...register(`sizes.${index}.quantity`, { valueAsNumber: true })} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <Label htmlFor="specialRequest">Special Request</Label>
                                <Textarea id="specialRequest" {...register('specialRequest')} className="min-h-[60px]" />
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className='mt-4 p-4 border-t'>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">{isEditing ? 'Update Item' : 'Add to Order'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
