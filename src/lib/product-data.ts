import type { Product } from './types';

export const productCatalog: Product[] = [
  {
    id: 1,
    name: 'Invitation Card',
    configType: 'A',
    variants: ['Classic', 'Modern', 'Floral'],
  },
  {
    id: 2,
    name: 'Welcome Sign',
    configType: 'B',
    sizes: [
      { name: 'Small', rateKey: 'welcome_sign_small_rate' },
      { name: 'Medium', rateKey: 'welcome_sign_medium_rate' },
      { name: 'Large', rateKey: 'welcome_sign_large_rate' },
    ],
  },
  {
    id: 3,
    name: 'Thank You Card',
    configType: 'A',
  },
  {
    id: 4,
    name: 'Menu Card',
    configType: 'C',
    specialLogic: 'MenuCardCustom',
  },
  {
    id: 5,
    name: 'Gift Box',
    configType: 'D',
    addons: [
      { id: 'ribbon', name: 'Ribbon', type: 'checkbox' },
      { id: 'tag', name: 'Personalized Tag', type: 'checkbox' },
    ],
  },
];
