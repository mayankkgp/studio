import type { BillableItem, ConfiguredProduct, BillableComponent, Product } from "./types";
import { productCatalog } from './product-data';
import { rates } from './rates';

const getRate = (rateKey?: string) => (rateKey && rates[rateKey]) || 0;

export function calculateBillableItems(deliverables: ConfiguredProduct[]): BillableItem[] {
    return deliverables.map(item => {
        const product = productCatalog.find(p => p.id === item.productId);
        if (!product) return null;

        const components: BillableComponent[] = [];
        const productName = `${item.productName}${item.variant ? ` (${item.variant})` : ''}`;

        // Handle base price based on config type
        switch (product.configType) {
            case 'A':
                if (item.quantity && item.quantity > 0) {
                    components.push({
                        label: 'Base Price',
                        multiplier: item.quantity,
                        rate: product.basePrice,
                        total: product.basePrice * item.quantity,
                        isFixed: false,
                    });
                }
                break;
            case 'B':
                 if (item.pages && item.pages > 0) {
                    components.push({
                        label: 'Base Price',
                        multiplier: item.pages,
                        rate: product.basePrice,
                        total: product.basePrice * item.pages,
                        isFixed: false,
                    });
                }
                break;
            // For C, D, E, base price is 0 and cost is derived from addons/sizes/fields
            case 'C':
            case 'D':
            case 'E':
                if (product.basePrice > 0) {
                     components.push({
                        label: 'Design & Setup Fee',
                        multiplier: 1,
                        rate: product.basePrice,
                        total: product.basePrice,
                        isFixed: true,
                    });
                }
                break;
        }

        // Custom Fields (Type D & Ritual Blossom)
        if (product.customFields && item.customFieldValues) {
            product.customFields.forEach(field => {
                const value = item.customFieldValues?.[field.id];
                if (value && value > 0) {
                    const rate = getRate(field.rateKey);
                    components.push({
                        label: field.name,
                        multiplier: value,
                        rate: rate,
                        total: rate * value,
                        isFixed: true,
                    });
                }
            });
        }
        
        // Addons
        item.addons?.forEach(addon => {
            const addonDef = product.addons?.find(a => a.id === addon.id);
            if (!addonDef || !addon.value) return;

            const rate = getRate(addonDef.rateKey);
            let multiplier = 0;

            if (addonDef.type === 'checkbox' && addon.value === true) {
                multiplier = item.quantity || 1; // Apply to each main product quantity if it exists
            } else if ((addonDef.type === 'numeric' || addonDef.type === 'physical_quantity') && typeof addon.value === 'number' && addon.value > 0) {
                multiplier = addon.value;
            }

            if (multiplier > 0) {
                components.push({
                    label: addon.name,
                    multiplier,
                    rate,
                    total: rate * multiplier,
                    isFixed: addonDef.type !== 'checkbox',
                });
            }
        });

        // Sizes (Type E)
        if (item.sizes) {
            item.sizes.forEach(size => {
                const sizeDef = product.sizes?.find(s => s.name === size.name);
                if (sizeDef && size.quantity > 0) {
                    const rate = getRate(sizeDef.rateKey);
                    components.push({
                        label: `Size: ${size.name}`,
                        multiplier: size.quantity,
                        rate: rate,
                        total: rate * size.quantity,
                        isFixed: false,
                    });
                }
            });
        }
        
        return {
            productName,
            configuredProductId: item.id,
            components,
        }
    }).filter((item): item is BillableItem => item !== null && item.components.length > 0);
}
