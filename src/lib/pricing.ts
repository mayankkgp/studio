import type { BillableItem, ConfiguredProduct, BillableComponent } from "./types";

// This is a simplified mock pricing engine.
export function calculateBillableItems(deliverables: ConfiguredProduct[]): BillableItem[] {
    return deliverables.map(item => {
        // Mock price calculation
        const basePrice = (item.productId * 50) + 50;
        const quantity = item.quantity || 1;
        const total = basePrice * quantity;

        const components: BillableComponent[] = [
            {
                label: 'Base Price',
                multiplier: quantity,
                rate: basePrice,
                total: total,
                isFixed: false,
            }
        ];

        return {
            productName: `${item.productName}${item.variant ? ` (${item.variant})` : ''}`,
            configuredProductId: item.id,
            components,
        }
    });
}
