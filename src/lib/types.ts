import { z } from 'zod';
import { eventDetailsSchema } from './schemas';

export type EventType = 'Wedding' | 'Engagement' | 'Anniversary' | 'Birthday' | 'Others';
export type Gender = 'Male' | 'Female' | 'Other';
export type DateStatus = 'Tentative' | 'Fixed';

export type EventDetails = z.infer<typeof eventDetailsSchema>;

export type SoftConstraint = {
  type: 'min' | 'max';
  value: number;
  message: string;
};

export type Addon = {
  id: string;
  name: string;
  type: 'checkbox' | 'physical_quantity' | 'numeric';
  rateKey?: string;
  softConstraints?: SoftConstraint[];
  dependsOn?: string; // ID of parent addon
  visibleIfVariant?: string; // Only show if product variant matches
};

export type ProductSize = {
  name: string;
  rateKey: string;
  softConstraints?: SoftConstraint[];
};

export type CustomField = {
  id: string;
  name: string;
  type: 'numeric';
  rateKey?: string;
  softConstraints?: SoftConstraint[];
};

export type Product = {
  id: number;
  name: string;
  configType: 'A' | 'B' | 'C' | 'D' | 'E';
  basePrice: number;
  variants?: string[];
  softConstraints?: SoftConstraint[];
  addons?: Addon[];
  customFields?: CustomField[];
  sizes?: ProductSize[];
  specialLogic?: 'RitualCardBlossom' | 'MenuCardCustom' | 'BadgesCustom' | 'WaxSealCustomQty';
};

export type ConfiguredProductAddon = {
  id: string;
  name: string;
  value: boolean | number | null;
};

export type ConfiguredProductSize = {
  name: string;
  quantity: number | null;
};

export type ConfiguredProduct = {
  id: string; // Unique ID for this specific instance in the cart
  productId: number;
  productName: string;
  variant?: string;
  quantity?: number | null;
  pages?: number | null;
  customFieldValues?: Record<string, number | null>;
  addons: ConfiguredProductAddon[];
  sizes?: ConfiguredProductSize[];
  specialRequest?: string;
  warning?: string;
};

export type BillableComponent = {
  label: string;
  description?: string;
  multiplier: number;
  rate: number;
  total: number;
  isFixed: boolean;
};

export type BillableItem = {
  productName: string;
  configuredProductId: string;
  components: BillableComponent[];
};

export type Order = {
  orderId: string;
  eventDetails: Partial<EventDetails>;
  deliverables: ConfiguredProduct[];
  paymentReceived: number;
};
