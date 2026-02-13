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
  configType: 'A' | 'B' | 'C' | 'D';
  basePrice: number;
  variants?: string[];
  variantRateKeys?: Record<string, string>;
  variantConstraints?: Record<string, SoftConstraint[]>;
  softConstraints?: SoftConstraint[];
  addons?: Addon[];
  customFields?: CustomField[];
  specialLogic?: 'RitualCardBlossom' | 'MenuCardCustom' | 'BadgesCustom' | 'WaxSealCustomQty';
};

export type ConfiguredProductAddon = {
  id: string;
  name: string;
  value: boolean | number | null;
};

export type DesignPinStatus = 'open' | 'mistake' | 'fixed' | 'resolved';
export type DesignWorkflowStatus = 'PENDING' | 'DRAFT' | 'INTERNAL_REVIEW' | 'CUSTOMER_REVIEW' | 'APPROVED';

export type DesignReply = {
  author: string;
  text: string;
  timestamp: string;
};

export type DesignPin = {
  id: string;
  x: number; // percentage
  y: number; // percentage
  status: DesignPinStatus;
  author: string;
  timestamp: string;
  version: number;
  text: string;
  replies: DesignReply[];
  isDraft?: boolean;
};

export type DesignVersion = {
  id: string;
  versionNumber: number;
  imageUrl: string;
  timestamp: string;
  author: string;
};

export type DesignComponent = {
  id: string;
  name: string;
  status: DesignWorkflowStatus;
  versions: DesignVersion[];
  pins: DesignPin[];
};

export type DesignData = {
  productId: string;
  components: DesignComponent[];
  isStock?: boolean;
};

export type ConfiguredProduct = {
  id: string; 
  productId: number;
  productName: string;
  variant?: string;
  quantity?: number | null;
  pages?: number | null;
  customFieldValues?: Record<string, number | null>;
  addons: ConfiguredProductAddon[];
  specialRequest?: string;
  warning?: string;
  rateOverrides?: Record<string, number>; // Maps component label to custom rate
  designData?: DesignData;
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

export type CustomerData = {
  visualIdentity: {
    moodStyle: string;
    colorTypography: string;
    designDislikes: string;
  };
  narrative: {
    timeline: string;
    coupleWorld: string;
    easterEggs: string;
  };
  cultureSymbols: {
    mandatoryIcons: string;
    regionalNuances: string;
  };
  atmosphereExtras: {
    venuePersonality: string;
    otherDetails: string;
  };
  productBriefs: Record<string, string>;
};

export type Order = {
  orderId: string;
  eventDetails: Partial<EventDetails>;
  deliverables: ConfiguredProduct[];
  paymentReceived: number;
  customerData?: CustomerData;
  activatedAt?: string;
  lastModifiedAt?: string;
};
