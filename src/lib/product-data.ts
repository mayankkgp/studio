import type { Product } from './types';

export const productCatalog: Product[] = [
  // Type A (Quantity Based)
  { 
    id: 1, 
    name: 'Logo', 
    configType: 'A', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'logo_cat_rate', 'Custom': 'logo_custom_rate' },
    softConstraints: [{ type: 'min', value: 1, message: 'Minimum quantity is 1.' }] 
  },
  { 
    id: 2, 
    name: 'Caricature', 
    configType: 'A', 
    basePrice: 0, 
    variants: ['Couple', 'Single', 'Pet'], 
    variantRateKeys: { 'Couple': 'caricature_couple_rate', 'Single': 'caricature_single_rate', 'Pet': 'caricature_pet_rate' },
    softConstraints: [{ type: 'min', value: 1, message: 'Minimum quantity is 1.' }] 
  },
  { id: 6, name: 'Insta Sticker', configType: 'A', basePrice: 500, softConstraints: [{ type: 'min', value: 1, message: 'Minimum quantity is 1.' }] },
  { id: 7, name: 'Snapchat Filter', configType: 'A', basePrice: 1000, softConstraints: [{ type: 'min', value: 1, message: 'Minimum quantity is 1.' }] },
  { id: 24, name: 'Keychain', configType: 'A', basePrice: 80, softConstraints: [{ type: 'min', value: 50, message: 'MOQ is 50.' }] },
  { 
    id: 29, 
    name: 'Chocolate Wrappers', 
    configType: 'A', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'chocolate_wrapper_cat_rate', 'Custom': 'chocolate_wrapper_custom_rate' },
    softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] 
  },
  { 
    id: 39, 
    name: 'Dessert Topper', 
    configType: 'A', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'dessert_topper_cat_rate', 'Custom': 'dessert_topper_custom_rate' },
    softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] 
  },
  { 
    id: 40, 
    name: 'Drink Stirrer', 
    configType: 'A', 
    basePrice: 0, 
    variants: ['Style A', 'Style B', 'Style C', 'Style D', 'Style E'], 
    variantRateKeys: { 
        'Style A': 'stirrer_style_a_rate', 
        'Style B': 'stirrer_style_b_rate',
        'Style C': 'stirrer_style_c_rate',
        'Style D': 'stirrer_style_d_rate',
        'Style E': 'stirrer_style_e_rate'
    },
    softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] 
  },
  { 
    id: 41, 
    name: 'Sticker', 
    configType: 'A', 
    basePrice: 0, 
    variants: ['1in', '2in', '3in', '4in', '5in'], 
    variantRateKeys: {
        '1in': 'sticker_1in_rate',
        '2in': 'sticker_2in_rate',
        '3in': 'sticker_3in_rate',
        '4in': 'sticker_4in_rate',
        '5in': 'sticker_5in_rate'
    },
    softConstraints: [{ type: 'min', value: 50, message: 'MOQ is 50.' }] 
  },
  { 
    id: 42, 
    name: 'Straw with Flag', 
    configType: 'A', 
    basePrice: 0, 
    variants: ['White', 'Golden'], 
    variantRateKeys: { 'White': 'straw_white_rate', 'Golden': 'straw_golden_rate' },
    softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] 
  },
  { 
    id: 43, 
    name: 'Wax Seal', 
    configType: 'A', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'wax_seal_cat_rate', 'Custom': 'wax_seal_custom_rate' },
    softConstraints: [{ type: 'min', value: 10, message: 'MOQ is 10.' }] 
  },
  { 
    id: 44, 
    name: 'Pin Brooch', 
    configType: 'A', 
    basePrice: 0, 
    variants: ['White', 'Golden'], 
    variantRateKeys: { 'White': 'brooch_white_rate', 'Golden': 'brooch_golden_rate' },
    softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] 
  },
  { id: 45, name: 'Cake Topper', configType: 'A', basePrice: 500, softConstraints: [{ type: 'min', value: 1, message: 'Minimum quantity is 1.' }] },
  { id: 46, name: 'Coconut Stamp', configType: 'A', basePrice: 800, softConstraints: [{ type: 'min', value: 1, message: 'Minimum quantity is 1.' }] },
  { id: 47, name: 'Welcome Mala', configType: 'A', basePrice: 120, softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] },
  { id: 48, name: 'Nani Bouquet', configType: 'A', basePrice: 1000, variants: ['Red White', 'Golden'], softConstraints: [{ type: 'min', value: 1, message: 'Minimum quantity is 1.' }] },
  { id: 52, name: 'Booze Bags', configType: 'A', basePrice: 60, softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] },
  { id: 53, name: 'Sunglasses', configType: 'A', basePrice: 150, softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] },
  { id: 59, name: 'Rattles', configType: 'A', basePrice: 250, softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] },

  // Type B (Page Based)
  { 
    id: 4, 
    name: 'Save The Date', 
    configType: 'B', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'std_cat_rate', 'Custom': 'std_custom_rate' },
    addons: [
      { id: 'name_swap', name: 'Name Swap', type: 'checkbox', rateKey: 'name_swap_rate' },
      { id: 'video_main', name: 'Video Main', type: 'physical_quantity', rateKey: 'video_main_rate', softConstraints: [{ type: 'min', value: 1, message: 'Min 1' }] },
      { id: 'video_extra', name: 'Video Extra', type: 'numeric', rateKey: 'video_extra_rate', dependsOn: 'video_main' },
      { id: 'voiceover', name: 'Voiceover', type: 'checkbox', rateKey: 'voiceover_rate', dependsOn: 'video_main' },
    ],
  },
  
  // Type C (Setup Based)
  { id: 3, name: 'Hashtag', configType: 'C', basePrice: 0, variants: ['Catalogue', 'Custom'], addons: [{ id: 'physical', name: 'Extra Options', type: 'physical_quantity', rateKey: 'hashtag_option_rate', softConstraints: [{ type: 'min', value: 1, message: 'Min 1 option.' }] }] },
  { 
    id: 8, 
    name: 'Itinerary - Key Card', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'itinerary_cat_rate', 'Custom': 'itinerary_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'key_card_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] 
  },
  { 
    id: 81, 
    name: 'Itinerary - Room', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'itinerary_cat_rate', 'Custom': 'itinerary_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'room_itinerary_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] 
  },
  { 
    id: 82, 
    name: 'Itinerary - Passport', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'passport_cat_rate', 'Custom': 'passport_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'passport_itinerary_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] 
  },
  { 
    id: 9, 
    name: 'Welcome Note', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'welcome_note_cat_rate', 'Custom': 'welcome_note_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'welcome_note_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] 
  },
  { 
    id: 10, 
    name: 'Tent Card', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'tent_card_cat_rate', 'Custom': 'tent_card_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'tent_card_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] 
  },
  { 
    id: 11, 
    name: 'Thank You Tags', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'thank_you_tag_cat_rate', 'Custom': 'thank_you_tag_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'thank_you_tag_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] 
  },
  { id: 12, name: 'Explore City Card', configType: 'C', basePrice: 0, variants: ['Catalogue', 'Custom'], addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'city_card_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] },
  { 
    id: 13, 
    name: 'Door Danglers', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'door_dangler_cat_rate', 'Custom': 'door_dangler_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'door_dangler_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] 
  },
  { 
    id: 14, 
    name: 'Newspaper', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['B/W', 'Colored'], 
    variantRateKeys: { 'B/W': 'newspaper_bw_rate', 'Colored': 'newspaper_color_rate' }, 
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'newspaper_bw_rate', softConstraints: [{ type: 'min', value: 50, message: 'MOQ is 50.' }] }] 
  },
  { id: 15, name: 'Magazine', configType: 'C', basePrice: 250, variants: ['Catalogue', 'Custom'], addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'magazine_rate', softConstraints: [{ type: 'min', value: 50, message: 'MOQ is 50.' }] }] },
  { 
    id: 16, 
    name: 'Tambola', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'tambola_cat_rate', 'Custom': 'tambola_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'tambola_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] 
  },
  { 
    id: 17, 
    name: 'Money Envelope', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'money_envelope_cat_rate', 'Custom': 'money_envelope_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'money_envelope_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] 
  },
  { 
    id: 19, 
    name: 'Popcorn Tubs', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'tub_cup_cat_rate', 'Custom': 'tub_cup_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'popcorn_tub_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] 
  },
  { 
    id: 20, 
    name: 'Menu Card', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'menu_card_cat_rate', 'Custom': 'menu_card_custom_rate' },
    addons: [
      { id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'menu_card_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] },
      { id: 'food_art', name: 'Food/Drink Art', type: 'numeric', rateKey: 'food_art_rate', visibleIfVariant: 'Custom', softConstraints: [{ type: 'min', value: 1, message: 'Min 1' }] }
    ]
  },
  { 
    id: 21, 
    name: 'Menu Board', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'board_cat_rate', 'Custom': 'board_custom_rate' },
    addons: [
      { id: 'a4', name: 'A4', type: 'physical_quantity', rateKey: 'menu_board_a4_rate', softConstraints: [{ type: 'min', value: 1, message: 'Min 1.' }] },
      { id: 'a3', name: 'A3', type: 'physical_quantity', rateKey: 'menu_board_a3_rate', softConstraints: [{ type: 'min', value: 1, message: 'Min 1.' }] },
      { id: '2x3ft', name: '2x3 ft', type: 'physical_quantity', rateKey: 'menu_board_2x3_rate', softConstraints: [{ type: 'min', value: 1, message: 'Min 1.' }] }
    ]
  },
  { 
    id: 23, 
    name: 'Playing Cards', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'playing_cards_cat_rate', 'Custom': 'playing_cards_custom_rate' },
    addons: [
      { id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'playing_cards_rate', softConstraints: [{ type: 'min', value: 50, message: 'MOQ is 50.' }] },
      { id: 'custom_numbers', name: 'Custom Numbers', type: 'checkbox', rateKey: 'custom_numbers_rate'}
    ]
  },
  { id: 25, name: 'Bhajan Book', configType: 'C', basePrice: 0, variants: ['Catalogue', 'Custom'], addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'bhajan_book_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] },
  { 
    id: 26, 
    name: 'Paper Cups', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'tub_cup_cat_rate', 'Custom': 'tub_cup_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'paper_cup_rate', softConstraints: [{ type: 'min', value: 500, message: 'MOQ is 500.' }] }] 
  },
  { 
    id: 27, 
    name: 'Information Card', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'info_card_cat_rate', 'Custom': 'info_card_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'info_card_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] 
  },
  { 
    id: 28, 
    name: 'Airport Pickup Board', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'pickup_board_cat_rate', 'Custom': 'pickup_board_custom_rate' },
    addons: [
      { id: 'a4', name: 'A4', type: 'physical_quantity', rateKey: 'pickup_board_a4_rate', softConstraints: [{ type: 'min', value: 1, message: 'Min 1.' }] },
      { id: 'a3', name: 'A3', type: 'physical_quantity', rateKey: 'pickup_board_a3_rate', softConstraints: [{ type: 'min', value: 1, message: 'Min 1.' }] },
      { id: '2x3ft', name: '2x3 ft', type: 'physical_quantity', rateKey: 'pickup_board_2x3_rate', softConstraints: [{ type: 'min', value: 1, message: 'Min 1.' }] }
    ]
  },
  { 
    id: 30, 
    name: 'Badges', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'badge_cat_rate', 'Custom': 'badge_custom_rate' },
    addons: [
      { id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'badge_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] },
      { id: 'extra_bg', name: 'Extra BG', type: 'numeric', rateKey: 'extra_bg_rate', visibleIfVariant: 'Custom', softConstraints: [{ type: 'min', value: 1, message: 'Min 1' }] }
    ]
  },
  { 
    id: 32, 
    name: 'Bells and Tags', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'bells_tags_cat_rate', 'Custom': 'bells_tags_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'bells_tags_rate', softConstraints: [{ type: 'min', value: 50, message: 'MOQ is 50.' }] }] 
  },
  { 
    id: 331, 
    name: 'Ritual Card - Canvas', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'ritual_canvas_cat_rate', 'Custom': 'ritual_canvas_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'ritual_card_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] 
  },
  { 
    id: 332, 
    name: 'Ritual Card - Fold', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'ritual_fold_cat_rate', 'Custom': 'ritual_fold_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'ritual_card_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] 
  },
  { 
    id: 333, 
    name: 'Ritual Card - Lotus', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'ritual_lotus_cat_rate', 'Custom': 'ritual_lotus_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'ritual_card_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] 
  },
  { 
    id: 334, 
    name: 'Ritual Card - Blossom', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'],
    variantRateKeys: { 'Catalogue': 'blossom_cat_rate', 'Custom': 'blossom_custom_rate' },
    customFields: [{id: 'petals', name: 'Petals', type: 'numeric', rateKey: 'petal_rate', softConstraints: [{ type: 'min', value: 4, message: 'Min 4 petals.' }, { type: 'max', value: 12, message: 'Max 12 petals.' }] }], 
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'ritual_card_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] 
  },
  { 
    id: 335, 
    name: 'Ritual Card - Love', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'ritual_canvas_cat_rate', 'Custom': 'ritual_canvas_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'ritual_card_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] 
  },
  { 
    id: 34, 
    name: 'Jute Bag', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'bag_cat_rate', 'Custom': 'bag_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'jute_bag_rate', softConstraints: [{ type: 'min', value: 50, message: 'MOQ is 50.' }] }] 
  },
  { 
    id: 35, 
    name: 'Luggage Tag', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'luggage_tag_cat_rate', 'Custom': 'luggage_tag_custom_rate' },
    addons: [
      { id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'luggage_tag_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }
    ]
  },
  { 
    id: 36, 
    name: 'Welcome Sign', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'welcome_sign_cat_rate', 'Custom': 'welcome_sign_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'welcome_sign_rate', softConstraints: [{ type: 'min', value: 1, message: 'Min 1.' }] }] 
  },
  { 
    id: 37, 
    name: 'Petal Cone', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'petal_cone_cat_rate', 'Custom': 'petal_cone_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'petal_cone_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] 
  },
  { 
    id: 38, 
    name: 'Scratch Card', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'scratch_card_cat_rate', 'Custom': 'scratch_card_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'scratch_card_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] 
  },
  { 
    id: 49, 
    name: 'Tic Tac Toe Board', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'game_cat_rate', 'Custom': 'game_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'board_game_rate', softConstraints: [{ type: 'min', value: 1, message: 'Min 1.' }] }] 
  },
  { 
    id: 50, 
    name: 'Word Search Board', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'game_cat_rate', 'Custom': 'game_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'board_game_rate', softConstraints: [{ type: 'min', value: 1, message: 'Min 1.' }] }] 
  },
  { 
    id: 51, 
    name: 'Crossword Board', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'game_cat_rate', 'Custom': 'game_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'board_game_rate', softConstraints: [{ type: 'min', value: 1, message: 'Min 1.' }] }] 
  },
  { id: 54, name: 'Coaster', configType: 'C', basePrice: 0, variants: ['Paper', 'Plastic'], addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'coaster_paper_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] },
  { id: 55, name: 'Maggi/Ice Cream Tub', configType: 'C', basePrice: 0, variants: ['Catalogue', 'Custom'], addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'tub_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] },
  { id: 56, name: 'Table Numbers', configType: 'C', basePrice: 0, variants: ['Paper', 'Acrylic'], addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'table_number_paper_rate', softConstraints: [{ type: 'min', value: 5, message: 'Min 5 tables.' }] }] },
  { id: 57, name: 'Car Stickers', configType: 'C', basePrice: 0, variants: ['Catalogue', 'Custom'], addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'car_sticker_rate', softConstraints: [{ type: 'min', value: 5, message: 'MOQ is 5.' }] }] },
  { id: 58, name: 'Placecards', configType: 'C', basePrice: 0, variants: ['Catalogue', 'Custom'], addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'placecard_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] },
  { 
    id: 60, 
    name: 'Tote Bags', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'bag_cat_rate', 'Custom': 'bag_custom_rate' },
    addons: [{ id: 'physical', name: 'Physical', type: 'physical_quantity', rateKey: 'tote_bag_rate', softConstraints: [{ type: 'min', value: 25, message: 'MOQ is 25.' }] }] 
  },
  
  // Type D (Invite Complex) - No Variants
  { id: 5, name: 'Invite', configType: 'D', basePrice: 8000, customFields: [
      { id: 'event_page_cat', name: 'Event Page (Catalogue)', type: 'numeric', rateKey: 'event_page_cat_rate' },
      { id: 'event_page_custom', name: 'Event Page (Custom)', type: 'numeric', rateKey: 'event_page_custom_rate' },
      { id: 'cover_page_cat', name: 'Cover Page (Catalogue)', type: 'numeric', rateKey: 'cover_page_cat_rate' },
      { id: 'cover_page_custom', name: 'Cover Page (Custom)', type: 'numeric', rateKey: 'cover_page_custom_rate' },
    ], addons: [
      { id: 'name_swap', name: 'Name Swap', type: 'checkbox', rateKey: 'name_swap_rate' },
      { id: 'parent_page_cat', name: 'Parent Page (Catalogue)', type: 'checkbox', rateKey: 'parent_page_cat_rate' },
      { id: 'parent_page_custom', name: 'Parent Page (Custom)', type: 'checkbox', rateKey: 'parent_page_custom_rate' },
      { id: 'video_main', name: 'Video Main', type: 'physical_quantity', rateKey: 'video_main_rate', softConstraints: [{ type: 'min', value: 1, message: 'Min 1' }] },
      { id: 'video_extra', name: 'Video Extra', type: 'numeric', rateKey: 'video_extra_rate', dependsOn: 'video_main' },
      { id: 'voiceover', name: 'Voiceover', type: 'checkbox', rateKey: 'voiceover_rate', dependsOn: 'video_main' },
    ]
  },

  { 
    id: 18, 
    name: 'Paper Bags', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'bag_cat_rate', 'Custom': 'bag_custom_rate' },
    addons: [
      { id: 'large', name: 'Large', type: 'physical_quantity', rateKey: 'paper_bag_large_rate', softConstraints: [{ type: 'min', value: 100, message: 'MOQ is 100.' }] },
      { id: 'medium', name: 'Medium', type: 'physical_quantity', rateKey: 'paper_bag_medium_rate', softConstraints: [{ type: 'min', value: 100, message: 'MOQ is 100.' }] },
      { id: 'small', name: 'Small', type: 'physical_quantity', rateKey: 'paper_bag_small_rate', softConstraints: [{ type: 'min', value: 100, message: 'MOQ is 100.' }] }
    ]
  },
  { 
    id: 22, 
    name: 'Contract Board', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'board_cat_rate', 'Custom': 'board_custom_rate' },
    addons: [
      { id: 'a3', name: 'A3', type: 'physical_quantity', rateKey: 'contract_board_a3_rate', softConstraints: [{ type: 'min', value: 1, message: 'Min 1.' }] },
      { id: '2x3ft', name: '2x3 ft', type: 'physical_quantity', rateKey: 'contract_board_2x3_rate', softConstraints: [{ type: 'min', value: 1, message: 'Min 1.' }] }
    ]
  },
  { 
    id: 31, 
    name: 'Hangover Kits', 
    configType: 'C', 
    basePrice: 0, 
    variants: ['Catalogue', 'Custom'], 
    variantRateKeys: { 'Catalogue': 'hangover_cat_rate', 'Custom': 'hangover_custom_rate' },
    addons: [
      { id: 'small', name: '5x7 in', type: 'physical_quantity', rateKey: 'hangover_kit_small_rate', softConstraints: [{ type: 'min', value: 50, message: 'MOQ is 50.' }] },
      { id: 'large', name: '10x11 in', type: 'physical_quantity', rateKey: 'hangover_kit_large_rate', softConstraints: [{ type: 'min', value: 50, message: 'MOQ is 50.' }] }
    ]
  },
];
