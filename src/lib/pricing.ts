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

        // Resolve rate: Use variant-specific rate key if it exists, otherwise use basePrice
        let baseRate = product.basePrice;
        if (item.variant && product.variantRateKeys && product.variantRateKeys[item.variant]) {
            baseRate = getRate(product.variantRateKeys[item.variant]);
        }

        // Handle base price based on config type
        switch (product.configType) {
            case 'A':
                if (item.quantity && item.quantity > 0) {
                    components.push({
                        label: 'Base Price',
                        multiplier: item.quantity,
                        rate: baseRate,
                        total: baseRate * item.quantity,
                        isFixed: false,
                    });
                }
                break;
            case 'B':
                 if (item.pages && item.pages > 0) {
                    components.push({
                        label: 'Base Price',
                        multiplier: item.pages,
                        rate: baseRate,
                        total: baseRate * item.pages,
                        isFixed: false,
                    });
                }
                break;
            case 'C':
            case 'D':
                if (baseRate > 0) {
                     components.push({
                        label: 'Design & Setup Fee',
                        multiplier: 1,
                        rate: baseRate,
                        total: baseRate,
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
                multiplier = item.quantity || 1; 
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
        
        return {
            productName,
            configuredProductId: item.id,
            components,
        }
    }).filter((item): item is BillableItem => item !== null && item.components.length > 0);
}
