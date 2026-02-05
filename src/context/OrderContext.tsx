'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Order, EventDetails, ConfiguredProduct } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type OrderContextType = {
  order: Order;
  setEventDetails: (details: EventDetails) => void;
  addDeliverable: (deliverable: ConfiguredProduct) => void;
  updateDeliverable: (id: string, updates: Partial<ConfiguredProduct>) => void;
  removeDeliverable: (id: string) => void;
  setPaymentReceived: (amount: number) => void;
  saveAsDraft: () => void;
  resetOrder: () => void;
  isLoaded: boolean;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Sample Data Generators for "Random Suitable Default Values"
const SAMPLE_DELIVERABLES: ConfiguredProduct[] = [
  {
    id: `1-${Date.now()}-sample-1`,
    productId: 1,
    productName: "Logo",
    variant: "Custom",
    quantity: 1,
    addons: [],
    customFieldValues: {},
    specialRequest: "Make it look premium and modern",
  },
  {
    id: `5-${Date.now()}-sample-2`,
    productId: 5,
    productName: "Invite",
    variant: undefined,
    addons: [
      { id: 'name_swap', name: 'Name Swap', value: true },
      { id: 'video_main', name: 'Video Main', value: 1 }
    ],
    customFieldValues: {
      event_page_cat: 4,
      cover_page_custom: 1
    },
    specialRequest: "",
  },
  {
    id: `334-${Date.now()}-sample-3`,
    productId: 334,
    productName: "Ritual Card - Blossom",
    variant: "Catalogue",
    addons: [
      { id: 'physical', name: 'Physical', value: 75 }
    ],
    customFieldValues: {
      petals: 8
    },
    specialRequest: "",
  },
  {
    id: `9-${Date.now()}-sample-4`,
    productId: 9,
    productName: "Welcome Note",
    variant: "Catalogue",
    addons: [
      { id: 'physical', name: 'Physical', value: 150 }
    ],
    customFieldValues: {},
    specialRequest: "Include guest names on each note",
  },
  {
    id: `41-${Date.now()}-sample-5`,
    productId: 41,
    productName: "Sticker",
    variant: "3in",
    quantity: 100,
    addons: [],
    customFieldValues: {},
    specialRequest: "",
  }
];

const initialOrderState: Order = {
  orderId: '',
  eventDetails: {
    eventType: 'Wedding',
    brideName: 'Riya',
    groomName: 'Arjun',
    eventDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    orderDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    venueName: 'The Oberoi, Mumbai',
    shipToCity: 'Mumbai'
  },
  deliverables: SAMPLE_DELIVERABLES,
  paymentReceived: 7500,
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }: { children: React.ReactNode }) => {
  const [order, setOrder] = useState<Order>(initialOrderState);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const newOrderId = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    setOrder((prev) => ({ ...prev, orderId: newOrderId }));
    setIsLoaded(true);
  }, []);

  const saveAsDraft = useCallback(() => {
    toast({
      title: 'Draft Saved (Session Only)',
      description: `Your order ${order.orderId} is active for this session. Persistence is disabled.`,
    });
  }, [order.orderId, toast]);

  const setEventDetails = useCallback((details: EventDetails) => {
    setOrder((prev) => ({ ...prev, eventDetails: details }));
  }, []);
  
  const addDeliverable = useCallback((deliverable: ConfiguredProduct) => {
    setOrder((prev) => ({ ...prev, deliverables: [deliverable, ...prev.deliverables] }));
  }, []);

  const updateDeliverable = useCallback((id: string, updates: Partial<ConfiguredProduct>) => {
    setOrder((prev) => {
      const newDeliverables = prev.deliverables.map((d) => (d.id === id ? { ...d, ...updates } : d));
      return { ...prev, deliverables: newDeliverables };
    });
  }, []);

  const removeDeliverable = useCallback((id: string) => {
    setOrder((prev) => {
      const newDeliverables = prev.deliverables.filter((d) => d.id !== id);
      return { ...prev, deliverables: newDeliverables };
    });
  }, []);
  
  const setPaymentReceived = useCallback((amount: number) => {
    setOrder((prev) => ({ ...prev, paymentReceived: amount }));
  }, []);

  const resetOrder = useCallback(() => {
    const newOrderId = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = { ...initialOrderState, orderId: newOrderId, deliverables: [] };
    setOrder(newOrder);
    toast({
        title: 'Order Reset',
        description: 'All session data has been cleared.',
    });
  }, [toast]);

  return (
    <OrderContext.Provider
      value={{
        order,
        setEventDetails,
        addDeliverable,
        updateDeliverable,
        removeDeliverable,
        setPaymentReceived,
        saveAsDraft,
        resetOrder,
        isLoaded,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};