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

const initialOrderState: Order = {
  orderId: '',
  eventDetails: {},
  deliverables: [],
  paymentReceived: 0,
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }: { children: React.ReactNode }) => {
  const [order, setOrder] = useState<Order>(initialOrderState);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();
  
  // Initial load - generate a fresh Order ID and clear any legacy storage
  useEffect(() => {
    const newOrderId = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    setOrder((prev) => ({ ...prev, orderId: newOrderId }));
    setIsLoaded(true);
    
    // Clear any existing legacy cache to ensure a clean start
    try {
      localStorage.removeItem('srishbish-order');
    } catch (e) {
      // Ignore errors if localStorage is blocked
    }
  }, []);

  const saveAsDraft = useCallback(() => {
    // Manual save functionality - kept as a placeholder/UI action
    toast({
      title: 'Draft Saved (Session Only)',
      description: `Your order ${order.orderId} is active for this session. Persistence is disabled.`,
    });
  }, [order.orderId, toast]);

  const setEventDetails = useCallback((details: EventDetails) => {
    setOrder((prev) => ({ ...prev, eventDetails: details }));
  }, []);
  
  const addDeliverable = useCallback((deliverable: ConfiguredProduct) => {
    setOrder((prev) => ({ ...prev, deliverables: [...prev.deliverables, deliverable] }));
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
    const newOrder = { ...initialOrderState, orderId: newOrderId };
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
