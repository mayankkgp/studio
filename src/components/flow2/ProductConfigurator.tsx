'use client';

import * as React from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Product, ConfiguredProduct, ConfiguredProductAddon } from '@/lib/types';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '../ui/scroll-area';

interface ProductConfiguratorProps {
  product: Product | null;
  configuredProduct?: ConfiguredProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ConfiguredProduct) => void;
}

const getConfigSchema = (product: Product | null) => {
    if (!product) return z.object({});
    
    const schemaObject: any = {
        quantity: z.number().min(1, 'Quantity must be at least 1').default(1),
        variant: product.variants ? z.string().min(1, "Please select a variant") : z.string().optional(),
        specialRequest: z.string().optional(),
        addons: z.array(z.object({
            id: z.string(),
            name: z.string(),
            value: z.union([z.boolean(), z.number()])
        })).optional(),
        sizes: product.sizes ? z.array(z.object({
            name: z.string(),
            quantity: z.number().min(0).default(0)
        })).optional() : z.undefined()
    };
    
    return z.object(schemaObject);
};

export function ProductConfigurator({ product, configuredProduct, isOpen, onClose, onSave }: ProductConfiguratorProps) {
  const isEditing = !!configuredProduct;
  const configSchema = getConfigSchema(product);
  
  const { register, control, handleSubmit, reset } = useForm({
    resolver: zodResolver(configSchema),
    defaultValues: {
        quantity: 1,
    }
  });

  React.useEffect(() => {
    if (product && isOpen) {
        const defaultValues: any = {
            quantity: configuredProduct?.quantity || 1,
            variant: configuredProduct?.variant || (product.variants ? product.variants[0] : undefined),
            specialRequest: configuredProduct?.specialRequest || '',
            addons: product.addons?.map(addon => {
                const existingAddon = configuredProduct?.addons.find(a => a.id === addon.id);
                if (existingAddon) return existingAddon;
                return { id: addon.id, name: addon.name, value: addon.type === 'checkbox' ? false : 0 };
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

  const onSubmit = (data: any) => {
    if (!product) return;
    const finalProduct: ConfiguredProduct = {
      id: configuredProduct?.id || `${product.id}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      quantity: data.quantity,
      ...(data.variant && { variant: data.variant }),
      addons: data.addons?.filter((a: ConfiguredProductAddon) => a.value) || [],
      ...(data.sizes && { sizes: data.sizes.filter(s => s.quantity > 0) }),
      ...(data.specialRequest && { specialRequest: data.specialRequest }),
    };
    onSave(finalProduct);
    onClose();
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Configure'} {product.name}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for this item.' : `Add details for ${product.name} to your order.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
        <ScrollArea className="max-h-[60vh] p-1">
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input id="quantity" type="number" {...register('quantity', { valueAsNumber: true })} />
                </div>
                {product.variants && (
                    <div className="space-y-2">
                        <Label htmlFor="variant">Variant</Label>
                        <Controller
                        name="variant"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger id="variant">
                                <SelectValue placeholder="Select a variant" />
                            </SelectTrigger>
                            <SelectContent>
                                {product.variants?.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                            </SelectContent>
                            </Select>
                        )}
                        />
                    </div>
                )}
            </div>

            {product.addons && product.addons.length > 0 && (
              <div className="space-y-2">
                <Label>Add-ons</Label>
                <div className="space-y-2 rounded-md border p-4">
                  {addonFields.map((field, index) => {
                    const addonDef = product.addons![index];
                    return (
                        <div key={field.id} className="flex items-center justify-between">
                            {addonDef.type === 'checkbox' ? (
                                <Controller
                                    name={`addons.${index}.value`}
                                    control={control}
                                    render={({ field: checkboxField }) => (
                                        <div className='flex items-center gap-2'>
                                            <Checkbox
                                                id={`addons.${index}.value`}
                                                checked={!!checkboxField.value}
                                                onCheckedChange={checkboxField.onChange}
                                            />
                                            <Label htmlFor={`addons.${index}.value`}>{addonDef.name}</Label>
                                        </div>
                                    )}
                                />
                            ) : (
                                <>
                                    <Label htmlFor={`addons.${index}.value`}>{addonDef.name}</Label>
                                    <Input
                                        id={`addons.${index}.value`}
                                        type="number"
                                        className="w-24"
                                        {...register(`addons.${index}.value`, { valueAsNumber: true })}
                                    />
                                </>
                            )}
                        </div>
                    );
                  })}
                </div>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-2">
                    <Label>Sizes</Label>
                    <div className="space-y-2 rounded-md border p-4">
                        {sizeFields.map((field, index) => (
                             <div key={field.id} className="flex items-center justify-between">
                                <Label htmlFor={`sizes.${index}.quantity`}>{product.sizes![index].name}</Label>
                                <Input
                                    id={`sizes.${index}.quantity`}
                                    type="number"
                                    className="w-24"
                                    {...register(`sizes.${index}.quantity`, { valueAsNumber: true })}
                                />
                             </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="specialRequest">Special Request</Label>
                <Textarea id="specialRequest" {...register('specialRequest')} />
            </div>

          </div>
          </ScrollArea>
          <DialogFooter className='mt-4 p-4 border-t'>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">{isEditing ? 'Update Item' : 'Add to Order'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
