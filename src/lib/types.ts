import { z } from 'zod';
import { eventDetailsSchema } from './schemas';

export type EventType = 'Wedding' | 'Engagement' | 'Anniversary' | 'Birthday' | 'Others';
export type Gender = 'Male' | 'Female' | 'Other';
export type DateStatus = 'Tentative' | 'Fixed';

export type EventDetails = z.infer<typeof eventDetailsSchema>;

export type AddonConstraint = {
  type: 'min' | 'max';
  value: number;
  message: string;
};

export type Addon = {
  id: string;
  name: string;
  type: 'checkbox' | 'numeric' | 'conditional_numeric';
  constraints?: AddonConstraint[];
  dependsOn?: string; // ID of parent addon
  rateKey?: string;
};

export type ProductSize = {
  name: string;
  constraints?: AddonConstraint[];
  rateKey?: string;
};

export type Product = {
  id: number;
  name: string;
  basePrice: number;
  configType: 'A' | 'B' | 'C' | 'D' | 'E';
  variants?: string[];
  softConstraints?: AddonConstraint[];
  addons?: Addon[];
  customFields?: { id: string; name: string; type: 'numeric' }[];
  sizes?: ProductSize[];
  specialLogic?: 'RitualCardBlossom' | 'MenuCardCustom' | 'BadgesCustom' | 'WaxSealCustomQty';
};

export type ConfiguredProductAddon = {
  id: string;
  name:string;
  value: boolean | number;
};

export type ConfiguredProductSize = {
  name: string;
  quantity: number;
};

export type ConfiguredProduct = {
  id: string; // Unique ID for this specific instance in the cart
  productId: number;
  productName: string;
  variant?: string;
  quantity?: number;
  pages?: number;
  customFieldValues?: Record<string, number>;
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
