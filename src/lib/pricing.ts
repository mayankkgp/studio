import type { BillableItem, ConfiguredProduct, BillableComponent, Product } from "./types";
import { productCatalog } from './product-data';
import { rates } from './rates';

const getRate = (rateKey?: string) => (rateKey && rates[rateKey]) || 0;

export function calculateBillableItems(deliverables: ConfiguredProduct[]): BillableItem[] {
    return deliverables.map(item => {
        const product = productCatalog.find(p => p.id === item.productId);
        if (!product) return null;

        const components: BillableComponent[] = [];
        
        // 1. RESOLVE VARIANT / BASE PRICE ROW
        // Rule: If no variant in product, treat product name as variant name
        const variantLabel = item.variant || item.productName;
        
        // Resolve rate: Use variant-specific rate key if it exists, otherwise use basePrice
        let baseRate = product.basePrice;
        if (item.variant && product.variantRateKeys && product.variantRateKeys[item.variant]) {
            baseRate = getRate(product.variantRateKeys[item.variant]);
        }

        // Rule: Determine if Fixed or Variable based on presence of main quantity/pages input
        let baseMultiplier = 1;
        let isBaseFixed = true;

        if (product.configType === 'A') {
            baseMultiplier = item.quantity || 0;
            isBaseFixed = false;
        } else if (product.configType === 'B') {
            baseMultiplier = item.pages || 0;
            isBaseFixed = false;
        }

        // Only add base row if it has value or is a fixed setup fee
        if (baseRate > 0 || isBaseFixed) {
            components.push({
                label: variantLabel,
                multiplier: baseMultiplier,
                rate: baseRate,
                total: baseRate * baseMultiplier,
                isFixed: isBaseFixed,
            });
        }

        // 2. CUSTOM FIELD ROWS
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
                        isFixed: false,
                    });
                }
            });
        }
        
        // 3. SELECTED ADD-ON ROWS
        item.addons?.forEach(addon => {
            const addonDef = product.addons?.find(a => a.id === addon.id);
            if (!addonDef || addon.value === undefined || addon.value === false || addon.value === null) return;

            let rate = getRate(addonDef.rateKey);
            let multiplier = 0;
            let isFixed = false;

            // Rule: Ritual Card - Blossom Dynamic Rate
            if (product.id === 334 && addonDef.id === 'physical') {
                const petals = item.customFieldValues?.petals || 0;
                const surchargeRate = rates['physical_petal_surcharge'] || 10;
                rate = petals * surchargeRate;
            }

            // Rule: Checkbox = Fixed, Numeric = Variable
            if (addonDef.type === 'checkbox') {
                multiplier = 1;
                isFixed = true;
            } else if (typeof addon.value === 'number' && addon.value > 0) {
                multiplier = addon.value;
                isFixed = false;
            }

            if (multiplier > 0 || isFixed) {
                components.push({
                    label: addon.name,
                    multiplier,
                    rate,
                    total: rate * multiplier,
                    isFixed: isFixed,
                });
            }
        });

        // 4. PROVIDED SPECIAL REQUEST ROW
        // Rule: Always a fixed price row if note is provided
        if (item.specialRequest && item.specialRequest.trim().length > 0) {
            components.push({
                label: 'Special Request',
                description: item.specialRequest,
                multiplier: 1,
                rate: 0, // Default 0, editable in commercials
                total: 0,
                isFixed: true,
            });
        }
        
        return {
            productName: item.productName,
            configuredProductId: item.id,
            components,
        }
    }).filter((item): item is BillableItem => item !== null && item.components.length > 0);
}
