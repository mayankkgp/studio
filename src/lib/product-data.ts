import type { Product } from './types';

export const productCatalog: Product[] = [
  {
    id: 1,
    name: 'Invitation Card',
    configType: 'A',
    basePrice: 150, // Base price per card
    variants: ['Classic Ivory', 'Modern White', 'Rustic Kraft'],
    addons: [
      { id: 'foil', name: 'Gold Foil', type: 'checkbox', rateKey: 'foil_stamping_rate' },
      { id: 'vellum', name: 'Vellum Wrap', type: 'checkbox', rateKey: 'vellum_wrap_rate' },
      { id: 'wax_seal', name: 'Wax Seal', type: 'checkbox', rateKey: 'wax_seal_rate' },
    ],
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
    addons: [
        { id: 'stand', name: 'Wooden Easel Stand', type: 'checkbox', rateKey: 'easel_stand_rate'}
    ]
  },
  {
    id: 3,
    name: 'Thank You Card',
    configType: 'A',
    basePrice: 80,
    addons: [
      { id: 'photo', name: 'Include Photo', type: 'checkbox', rateKey: 'photo_printing_rate' },
    ],
  },
  {
    id: 4,
    name: 'Menu Card',
    configType: 'C',
    basePrice: 90,
    variants: ['Standard', 'Tall'],
    addons: [
        { id: 'guest_name', name: 'Guest Name Printing', type: 'checkbox', rateKey: 'guest_name_printing_rate' }
    ]
  },
  {
    id: 5,
    name: 'Gift Box',
    configType: 'D',
    basePrice: 250,
    variants: ['White', 'Black', 'Blue'],
    addons: [
      { id: 'ribbon', name: 'Satin Ribbon', type: 'checkbox', rateKey: 'ribbon_rate' },
      { id: 'tag', name: 'Personalized Tag', type: 'checkbox', rateKey: 'tag_rate' },
      { id: 'filler', name: 'Crinkle Paper Filler', type: 'checkbox', rateKey: 'filler_rate'}
    ],
  },
  {
    id: 6,
    name: 'Place Cards',
    configType: 'A',
    basePrice: 50,
  },
  {
    id: 7,
    name: 'Wedding Program',
    configType: 'A',
    basePrice: 120, // for a single page program
    addons: [
        { id: 'extra_pages', name: 'Additional Pages', type: 'numeric', rateKey: 'program_page_rate'}
    ]
  },
  {
    id: 8,
    name: 'Custom Stickers',
    configType: 'B',
    basePrice: 0,
    variants: ['Round', 'Square', 'Die-cut'],
    sizes: [
      { name: '2" Circle/Square', rateKey: 'sticker_small_rate' },
      { name: '3" Circle/Square', rateKey: 'sticker_medium_rate' },
      { name: '4" Circle/Square', rateKey: 'sticker_large_rate' },
    ]
  },
  {
    id: 9,
    name: 'Table Numbers',
    configType: 'A',
    basePrice: 250,
    variants: ['Acrylic', 'Cardstock', 'Wood'],
  },
  {
    id: 10,
    name: 'Seating Chart',
    configType: 'B',
    basePrice: 0,
    sizes: [
      { name: 'Medium (24x36") - up to 150 guests', rateKey: 'seating_chart_medium_rate' },
      { name: 'Large (36x48") - up to 250 guests', rateKey: 'seating_chart_large_rate' },
    ],
     addons: [
        { id: 'stand', name: 'Wooden Easel Stand', type: 'checkbox', rateKey: 'easel_stand_rate'}
    ]
  },
  {
    id: 11,
    name: 'Save the Date Magnets',
    configType: 'A',
    basePrice: 180,
  },
  {
    id: 12,
    name: 'Vow Books',
    configType: 'A',
    basePrice: 800, // Price for a set of 2
    variants: ['His & Hers', 'His & His', 'Hers & Hers'],
    addons: [
        { id: 'silk_ribbon', name: 'Silk Ribbon', type: 'checkbox', rateKey: 'silk_ribbon_rate' },
    ]
  }
];
