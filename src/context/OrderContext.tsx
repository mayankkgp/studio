'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

const STORAGE_KEY = 'srishbish-order';

export const OrderProvider: React.FC<{ children: React.NewNode }> = ({ children }: { children: React.ReactNode }) => {
  const [order, setOrder] = useState<Order>(initialOrderState);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();
  
  // Use a ref to track if we need to save to avoid infinite loops or unnecessary writes
  const lastSavedRef = useRef<string>('');

  // Initial load
  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem(STORAGE_KEY);
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        if (parsedOrder.eventDetails?.eventDate) {
            parsedOrder.eventDetails.eventDate = new Date(parsedOrder.eventDetails.eventDate);
        }
        if (parsedOrder.eventDetails?.orderDueDate) {
            parsedOrder.eventDetails.orderDueDate = new Date(parsedOrder.eventDetails.orderDueDate);
        }
        if (parsedOrder.eventDetails?.weddingDate) {
            parsedOrder.eventDetails.weddingDate = new Date(parsedOrder.eventDetails.weddingDate);
        }
        setOrder(parsedOrder);
        lastSavedRef.current = savedOrder;
      } else {
        const newOrderId = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
        setOrder((prev) => ({ ...prev, orderId: newOrderId }));
      }
    } catch (error) {
      console.error("Failed to load order from localStorage", error);
      const newOrderId = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      setOrder((prev) => ({ ...prev, orderId: newOrderId }));
    }
    setIsLoaded(true);
  }, []);

  // DEBOUNCED PERSISTENCE: Save to localStorage only after changes stop for 500ms
  useEffect(() => {
    if (!isLoaded) return;

    const timer = setTimeout(() => {
      try {
        const orderString = JSON.stringify(order);
        if (orderString !== lastSavedRef.current) {
          localStorage.setItem(STORAGE_KEY, orderString);
          lastSavedRef.current = orderString;
        }
      } catch (error) {
        console.error("Failed to save order to localStorage", error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [order, isLoaded]);

  const saveAsDraft = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
      toast({
        title: 'Draft Saved',
        description: `Your order ${order.orderId} has been saved manually.`,
      });
    } catch (e) {
      console.error(e);
    }
  }, [order, toast]);


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
    localStorage.removeItem(STORAGE_KEY);
    toast({
        title: 'Order Cancelled',
        description: 'The form has been reset.',
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
