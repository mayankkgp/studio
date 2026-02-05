'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    AlertTriangle, 
    Trash2, 
    ShoppingBag,
    Clapperboard,
    FileText,
    MailOpen,
    Frame,
    Package,
    Check,
    Pencil,
    MessageSquarePlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { productCatalog } from '@/lib/product-data';
import type { Product, ConfiguredProduct, SoftConstraint } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

    const getWarnings = (data: any, product: Product | null): string | undefined => {
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
        return warnings.length > 0 ? warnings.join(' ') : undefined;
    };

    React.useEffect(() => {
        const timer = setTimeout(() => {
            const currentValues = getValues();
            const warning = getWarnings(currentValues, product);
            onUpdate(item.id, {
                ...currentValues,
                warning,
                addons: currentValues.addons?.filter((a: any) => a.value !== false && a.value !== 0) as any,
                sizes: currentValues.sizes?.filter((s: any) => s.quantity > 0) as any
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
        const hasVariants = product.variants && product.variants.length > 0;
        
        if (hasVariants && watchedValues.variant) {
            parts.push(watchedValues.variant);
        }
        
        if (product.configType === 'A' && watchedValues.quantity) {
            parts.push(`Qty: ${watchedValues.quantity}`);
        } else if (product.configType === 'B' && watchedValues.pages) {
            parts.push(`${watchedValues.pages} Pages`);
        }
        
        const isReady = !hasVariants || !!watchedValues.variant;
        if (!isReady && hasVariants) return 'Setup Required';
        
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
    const isSimpleTypeA = product?.configType === 'A' && (!product?.variants || product.variants.length === 0);

    const iconStatusClasses = isExpanded 
        ? "text-blue-600 bg-blue-50" 
        : isValid 
            ? "text-green-600 bg-green-100" 
            : "text-destructive bg-destructive/10";

    const renderNotesArea = () => {
        if (showNotes) {
            return (
                <Textarea 
                    {...register('specialRequest')} 
                    className="min-h-[40px] bg-background/50 overflow-hidden resize-none py-2 px-3 leading-6" 
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
                                        <Badge variant="destructive" className="bg-destructive text-destructive-foreground text-[10px] h-4 py-0">Setup Required</Badge>
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
                    {isSimpleTypeA ? (
                        <div className="flex flex-wrap items-center gap-8 pt-4 pb-2">
                            <div className="flex items-center gap-3">
                                <Label className={cn("text-xs font-bold uppercase tracking-wider whitespace-nowrap", errors.quantity ? "text-destructive" : "text-muted-foreground")}>
                                    Qty
                                </Label>
                                <Input 
                                    type="number" 
                                    {...register('quantity', { valueAsNumber: true })}
                                    className={cn("w-24 h-10 text-lg font-bold bg-background", errors.quantity && "border-destructive")} 
                                    ref={(e) => {
                                        register('quantity').ref(e);
                                        // @ts-ignore
                                        qtyInputRef.current = e;
                                    }}
                                />
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                {renderNotesArea()}
                            </div>
                            {errors.quantity && <p className="text-xs text-destructive font-medium w-full">{errors.quantity.message}</p>}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                            <div className="space-y-6">
                                {(product?.configType === 'A' || product?.configType === 'B') && (
                                    <div className="flex items-center gap-4">
                                        <Label className={cn("text-xs font-bold uppercase tracking-wider whitespace-nowrap min-w-[40px]", (errors.quantity || errors.pages) ? "text-destructive" : "text-muted-foreground")}>
                                            {product.configType === 'A' ? 'Qty' : 'Pages'}
                                        </Label>
                                        <div className="flex flex-col gap-1">
                                            <Input 
                                                type="number" 
                                                {...register(product.configType === 'A' ? 'quantity' : 'pages', { 
                                                    valueAsNumber: true 
                                                })}
                                                className={cn("w-24 h-10 text-lg font-bold bg-background", (errors.quantity || errors.pages) && "border-destructive")} 
                                                ref={(e) => {
                                                    if (product.configType === 'A') {
                                                        register('quantity').ref(e);
                                                        // @ts-ignore
                                                        qtyInputRef.current = e;
                                                    } else {
                                                        register('pages').ref(e);
                                                    }
                                                }}
                                            />
                                            {(errors.quantity || errors.pages) && <p className="text-xs text-destructive font-medium whitespace-nowrap">{errors.quantity?.message || errors.pages?.message}</p>}
                                        </div>
                                    </div>
                                )}

                                {product?.variants && product.variants.length > 0 && (
                                    <div className="space-y-1.5">
                                        <Label className={cn("text-xs font-semibold uppercase tracking-wider", errors.variant ? "text-destructive" : "text-muted-foreground")}>Variant</Label>
                                        <Controller
                                            name="variant"
                                            control={control}
                                            render={({ field }) => (
                                                <Select 
                                                    onValueChange={field.onChange} 
                                                    value={field.value || ""}
                                                >
                                                    <SelectTrigger className={cn("h-10", errors.variant && "border-destructive")}>
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

                                <div className="pt-2">
                                    {renderNotesArea()}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {product?.addons && product.addons.length > 0 && (
                                    <div className="space-y-3">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add-ons</Label>
                                        <div className="space-y-2 rounded-lg border bg-background/50 p-4">
                                            {product.addons.map((addon, index) => {
                                                const parentIndex = addon.dependsOn ? product.addons!.findIndex(a => a.id === addon.dependsOn) : -1;
                                                const parentValue = parentIndex !== -1 ? watchedValues.addons?.[parentIndex]?.value : undefined;
                                                const isParentActive = parentValue !== undefined ? (typeof parentValue === 'number' ? parentValue > 0 : !!parentValue) : true;
                                                if (!((!addon.dependsOn || isParentActive) && (!addon.visibleIfVariant || watchedValues.variant === addon.visibleIfVariant))) return null;
                                                const isChecked = typeof watchedValues.addons?.[index]?.value === 'number' ? watchedValues.addons?.[index]?.value > 0 : !!watchedValues.addons?.[index]?.value;
                                                return (
                                                    <div key={addon.id} className="flex items-center justify-between py-1">
                                                        <div className="flex items-center gap-3">
                                                            <Controller
                                                                name={`addons.${index}.value`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Checkbox 
                                                                        checked={addon.type === 'checkbox' ? !!field.value : isChecked} 
                                                                        onCheckedChange={(checked) => {
                                                                            if (addon.type === 'checkbox') field.onChange(checked);
                                                                            else field.onChange(checked ? 1 : 0);
                                                                        }} 
                                                                    />
                                                                )}
                                                            />
                                                            <span className="text-sm">{addon.name}</span>
                                                        </div>
                                                        {addon.type !== 'checkbox' && isChecked && (
                                                            <Input type="number" className="w-20 h-8" {...register(`addons.${index}.value`, { valueAsNumber: true })} />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {product?.sizes && product.sizes.length > 0 && (
                                    <div className="space-y-3">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sizes</Label>
                                        <div className="space-y-2 rounded-lg border bg-background/50 p-4">
                                            {product.sizes.map((size, index) => (
                                                <div key={size.name} className="flex items-center justify-between py-1">
                                                    <span className="text-sm">{size.name}</span>
                                                    <Input 
                                                        type="number" 
                                                        className="w-20 h-8" 
                                                        {...register(`sizes.${index}.quantity`, { valueAsNumber: true })} 
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {product?.customFields && product.customFields.length > 0 && (
                                    <div className="space-y-3">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Additional Details</Label>
                                        <div className="space-y-2 rounded-lg border bg-background/50 p-4">
                                            {product.customFields.map((field) => (
                                                <div key={field.id} className="flex items-center justify-between py-1">
                                                    <span className="text-sm">{field.name}</span>
                                                    <Input 
                                                        type="number" 
                                                        className="w-20 h-8" 
                                                        {...register(`customFieldValues.${field.id}`, { valueAsNumber: true })} 
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </AccordionContent>
            </AccordionItem>
        </div>
    );
});
