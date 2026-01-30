import type { Product } from './types';

export const productCatalog: Product[] = [
  {
    id: 1,
    name: 'Invitation Card',
    configType: 'A',
    basePrice: 200,
    variants: ['Classic', 'Modern', 'Floral'],
  },
  {
    id: 2,
    name: 'Welcome Sign',
    configType: 'B',
    basePrice: 0, // Price is per size
    sizes: [
      { name: 'Small (18x24")', rateKey: 'welcome_sign_small_rate' },
      { name: 'Medium (24x36")', rateKey: 'welcome_sign_medium_rate' },
      { name: 'Large (36x48")', rateKey: 'welcome_sign_large_rate' },
    ],
  },
  {
    id: 3,
    name: 'Thank You Card',
    configType: 'A',
    basePrice: 150,
  },
  {
    id: 4,
    name: 'Menu Card',
    configType: 'C',
    basePrice: 100,
    specialLogic: 'MenuCardCustom',
  },
  {
    id: 5,
    name: 'Gift Box',
    configType: 'D',
    basePrice: 300,
    addons: [
      { id: 'ribbon', name: 'Ribbon', type: 'checkbox', rateKey: 'ribbon_rate' },
      { id: 'tag', name: 'Personalized Tag', type: 'checkbox', rateKey: 'tag_rate' },
    ],
  },
];
