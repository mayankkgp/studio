'use client';

import type { BillableItem, ConfiguredProduct, BillableComponent } from "./types";
import { productCatalog } from './product-data';
import { rates } from './rates';

const getRate = (rateKey?: string) => (rateKey && rates[rateKey]) || 0;

/**
 * Calculates billable items based on configured deliverables.
 * Follows the "Price Row" model where every variant, add-on, and special request 
 * generates a specific row in the bill.
 */
export function calculateBillableItems(deliverables: ConfiguredProduct[]): BillableItem[] {
    return deliverables.map(item => {
        const product = productCatalog.find(p => p.id === item.productId);
        if (!product) return null;

        const components: BillableComponent[] = [];
        
        // Rule Indicators
        const isInvite = product.id === 5;
        const isBlossom = product.id === 334;

        // 1. RESOLVE BASE ROW (VARIANT)
        // Rule: If no variant in product, treat product name as variant name
        const variantLabel = item.variant || item.productName;
        
        // Resolve rate: Use variant-specific rate key if it exists, otherwise use basePrice
        let baseRate = product.basePrice;
        if (item.variant && product.variantRateKeys && product.variantRateKeys[item.variant]) {
            baseRate = getRate(product.variantRateKeys[item.variant]);
        }

        // Apply Override if exists
        if (item.rateOverrides && item.rateOverrides[variantLabel] !== undefined) {
            baseRate = item.rateOverrides[variantLabel];
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
        // SPECIAL RULE: Ritual Card - Blossom (ID 334) variant row is variable, using 'petals' as multiplier
        else if (isBlossom) {
            baseMultiplier = item.customFieldValues?.petals || 0;
            isBaseFixed = false;
        } 
        // Rule: For Type C products, the basePrice is a fixed setup fee
        else if (product.configType === 'C') {
            baseMultiplier = 1;
            isBaseFixed = true;
        }

        // Rule: In invite product, there is no fixed variant pricing row.
        if (!isInvite && (baseRate > 0 || isBaseFixed || (isBlossom && baseMultiplier > 0))) {
            components.push({
                label: variantLabel,
                multiplier: baseMultiplier,
                rate: baseRate,
                total: baseRate * baseMultiplier,
                isFixed: isBaseFixed,
            });
        }

        // 2. CUSTOM FIELD ROWS
        // Rule: For all products (including Invite), treat each custom field as variable price row.
        if (product.customFields && item.customFieldValues) {
            product.customFields.forEach(field => {
                // SPECIAL RULE: Ritual Card - Blossom 'petals' field is used for base multiplier, not a separate row
                if (isBlossom && field.id === 'petals') return;

                const value = item.customFieldValues?.[field.id];
                if (value && value > 0) {
                    let rate = getRate(field.rateKey);
                    
                    // Apply Override
                    if (item.rateOverrides && item.rateOverrides[field.name] !== undefined) {
                        rate = item.rateOverrides[field.name];
                    }

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
            
            // Apply Override
            if (item.rateOverrides && item.rateOverrides[addon.name] !== undefined) {
                rate = item.rateOverrides[addon.name];
            }

            let multiplier = 0;
            let isFixed = false;

            // SPECIAL RULE: Ritual Card - Blossom Physical Dynamic Rate
            if (isBlossom && addonDef.id === 'physical') {
                const petals = item.customFieldValues?.petals || 0;
                const surchargeRate = rates['physical_petal_surcharge'] || 10;
                // If overridden, we use the literal override rate, otherwise dynamic
                if (!(item.rateOverrides && item.rateOverrides[addon.name] !== undefined)) {
                    rate = petals * surchargeRate;
                }
            }

            // Rule: Checkbox = Fixed (1), Numeric = Variable (Value)
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
            const label = 'Special Request';
            let rate = 0;
            if (item.rateOverrides && item.rateOverrides[label] !== undefined) {
                rate = item.rateOverrides[label];
            }

            components.push({
                label: label,
                description: item.specialRequest,
                multiplier: 1,
                rate: rate,
                total: rate * 1,
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
