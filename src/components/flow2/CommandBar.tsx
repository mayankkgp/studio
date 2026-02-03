'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { productCatalog } from '@/lib/product-data';
import { useOrder } from '@/context/OrderContext';
import { Badge } from '@/components/ui/badge';
import type { ConfiguredProduct, Product } from '@/lib/types';

const QUICK_ADD_ITEMS = ['Logo', 'Invite', 'Save The Date', 'Welcome Note', 'Hashtag'];

export function CommandBar() {
    const [open, setOpen] = React.useState(false);
    const { addDeliverable, order } = useOrder();

    // Global keyboard shortcut (Cmd+K / Ctrl+K)
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const handleAddProduct = (product: Product) => {
        const existingItems = order.deliverables.filter(item => item.productId === product.id).length;
        const productName = existingItems > 0 ? `${product.name} #${existingItems + 1}` : product.name;

        const newDeliverable: ConfiguredProduct = {
            id: `${product.id}-${Date.now()}`,
            productId: product.id,
            productName: productName,
            variant: undefined, // Forced Intent: No default variant
            quantity: product.configType === 'A' ? 1 : undefined,
            pages: product.configType === 'B' ? 1 : undefined,
            addons: [],
            customFieldValues: {},
            sizes: [],
            specialRequest: '',
        };

        addDeliverable(newDeliverable);
        setOpen(false);
    };

    const handleQuickAdd = (name: string) => {
        const product = productCatalog.find(p => p.name === name);
        if (product) handleAddProduct(product);
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between h-14 text-lg px-4 bg-card hover:bg-card/80 border-2 border-primary/20 hover:border-primary/40 shadow-sm"
                        >
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Search className="h-5 w-5" />
                                <span>Search products to add...</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
                                    <span className="text-xs">⌘</span>K
                                </kbd>
                                <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                            </div>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Type a product name..." className="h-12" />
                            <CommandList>
                                <CommandEmpty>No product found.</CommandEmpty>
                                <CommandGroup heading="Product Catalog">
                                    {productCatalog.map((product) => (
                                        <CommandItem
                                            key={product.id}
                                            value={product.name}
                                            onSelect={() => handleAddProduct(product)}
                                            className="h-11"
                                        >
                                            <Zap className="mr-2 h-4 w-4 text-primary" />
                                            {product.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase mr-2">Quick Add:</span>
                {QUICK_ADD_ITEMS.map((name) => (
                    <Badge
                        key={name}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1 px-3 gap-1"
                        onClick={() => handleQuickAdd(name)}
                    >
                        <Zap className="h-3 w-3" />
                        {name}
                    </Badge>
                ))}
            </div>
        </div>
    );
}
