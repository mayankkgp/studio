'use client';

import type { BillableItem, ConfiguredProduct, BillableComponent } from "./types";
import { productCatalog } from './product-data';
import { rates } from './rates';

const getRate = (rateKey?: string) => (rateKey && rates[rateKey]) || 0;

/**
 * Helper to calculate breakdown for a single item.
 */
export function calculateItemBreakdown(item: ConfiguredProduct): BillableComponent[] {
    const product = productCatalog.find(p => p.id === item.productId);
    if (!product) return [];

    const components: BillableComponent[] = [];
    
    // Rule Indicators
    const isInvite = product.id === 5;
    const isBlossom = product.id === 334;

    // 1. RESOLVE BASE ROW (VARIANT)
    const variantLabel = item.variant || item.productName;
    
    let baseRate = product.basePrice;
    if (item.variant && product.variantRateKeys && product.variantRateKeys[item.variant]) {
        baseRate = getRate(product.variantRateKeys[item.variant]);
    }

    // Apply Override if exists
    if (item.rateOverrides && item.rateOverrides[variantLabel] !== undefined) {
        baseRate = item.rateOverrides[variantLabel];
    }

    let baseMultiplier = 1;
    let isBaseFixed = true;

    if (product.configType === 'A') {
        baseMultiplier = item.quantity || 0;
        isBaseFixed = false;
    } else if (product.configType === 'B') {
        baseMultiplier = item.pages || 0;
        isBaseFixed = false;
    } else if (isBlossom) {
        baseMultiplier = item.customFieldValues?.petals || 0;
        isBaseFixed = false;
    } else if (product.configType === 'C') {
        baseMultiplier = 1;
        isBaseFixed = true;
    }

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
    if (product.customFields && item.customFieldValues) {
        product.customFields.forEach(field => {
            if (isBlossom && field.id === 'petals') return;

            const value = item.customFieldValues?.[field.id];
            if (value && value > 0) {
                let rate = getRate(field.rateKey);
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
        if (item.rateOverrides && item.rateOverrides[addon.name] !== undefined) {
            rate = item.rateOverrides[addon.name];
        }

        let multiplier = 0;
        let isFixed = false;

        if (isBlossom && addonDef.id === 'physical') {
            const petals = item.customFieldValues?.petals || 0;
            const surchargeRate = rates['physical_petal_surcharge'] || 10;
            if (!(item.rateOverrides && item.rateOverrides[addon.name] !== undefined)) {
                rate = petals * surchargeRate;
            }
        }

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
    
    return components;
}

/**
 * Calculates billable items based on configured deliverables.
 */
export function calculateBillableItems(deliverables: ConfiguredProduct[] = []): BillableItem[] {
    if (!deliverables || !Array.isArray(deliverables)) return [];

    return deliverables.map(item => {
        const components = calculateItemBreakdown(item);
        if (components.length === 0) return null;

        return {
            productName: item.productName,
            configuredProductId: item.id,
            components,
        }
    }).filter((item): item is BillableItem => item !== null);
}
