import type { BillableItem, ConfiguredProduct, BillableComponent } from "./types";
import { productCatalog } from './product-data';
import { rates } from './rates';

// This is a simplified mock pricing engine.
export function calculateBillableItems(deliverables: ConfiguredProduct[]): BillableItem[] {
    return deliverables.map(item => {
        const product = productCatalog.find(p => p.id === item.productId);
        if (!product) return null;

        const components: BillableComponent[] = [];
        const quantity = item.quantity || 1;

        // Base Price - only if not a size-based product
        if (!product.sizes || product.sizes.length === 0) {
            components.push({
                label: 'Base Price',
                multiplier: quantity,
                rate: product.basePrice,
                total: product.basePrice * quantity,
                isFixed: false,
            });
        }

        // Addons
        item.addons.forEach(addon => {
            const addonDef = product.addons?.find(a => a.id === addon.id);
            if (!addonDef || !addonDef.rateKey) return;
            
            // @ts-ignore
            const rate = rates[addonDef.rateKey] || 0;
            let multiplier = 0;
            
            if (addonDef.type === 'checkbox' && addon.value === true) {
                multiplier = quantity; // Apply to each main product quantity
            } else if (addonDef.type === 'numeric' && typeof addon.value === 'number' && addon.value > 0) {
                multiplier = addon.value; // Use the numeric value as the multiplier
            } else {
                return; // Don't add if checkbox is false or number is 0
            }

            components.push({
                label: addon.name,
                multiplier,
                rate,
                total: rate * multiplier,
                isFixed: addonDef.type === 'numeric',
            });
        });

        // Sizes
        if (item.sizes) {
            // Base price for size-based products comes from the sizes themselves
            item.sizes.forEach(size => {
                const sizeDef = product.sizes?.find(s => s.name === size.name);
                if (!sizeDef || !sizeDef.rateKey || size.quantity === 0) return;
                
                // @ts-ignore
                const rate = rates[sizeDef.rateKey] || 0;
                components.push({
                    label: `Size: ${size.name}`,
                    multiplier: size.quantity,
                    rate: rate,
                    total: rate * size.quantity,
                    isFixed: false,
                });
            });
        }
        
        return {
            productName: `${item.productName}${item.variant ? ` (${item.variant})` : ''}`,
            configuredProductId: item.id,
            components,
        }
    }).filter((item): item is BillableItem => item !== null && item.components.length > 0);
}
