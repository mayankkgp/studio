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

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [order, setOrder] = useState<Order>(initialOrderState);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem('srishflow-order');
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        // Dates are stored as strings, need to convert them back to Date objects
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

  const saveToLocalStorage = useCallback((currentOrder: Order) => {
    try {
      localStorage.setItem('srishflow-order', JSON.stringify(currentOrder));
    } catch (error) {
      console.error("Failed to save order to localStorage", error);
    }
  }, []);
  
  const saveAsDraft = useCallback(() => {
    saveToLocalStorage(order);
    toast({
      title: 'Draft Saved',
      description: `Your order ${order.orderId} has been saved.`,
    });
  }, [order, saveToLocalStorage, toast]);


  const setEventDetails = useCallback((details: EventDetails) => {
    setOrder((prev) => {
      const newOrder = { ...prev, eventDetails: details };
      saveToLocalStorage(newOrder);
      return newOrder;
    });
  }, [saveToLocalStorage]);
  
  const addDeliverable = useCallback((deliverable: ConfiguredProduct) => {
    setOrder((prev) => {
      const newOrder = { ...prev, deliverables: [...prev.deliverables, deliverable] };
      saveToLocalStorage(newOrder);
      return newOrder;
    });
  }, [saveToLocalStorage]);

  const updateDeliverable = useCallback((id: string, updates: Partial<ConfiguredProduct>) => {
    setOrder((prev) => {
      const newDeliverables = prev.deliverables.map((d) => (d.id === id ? { ...d, ...updates } : d));
      const newOrder = { ...prev, deliverables: newDeliverables };
      saveToLocalStorage(newOrder);
      return newOrder;
    });
  }, [saveToLocalStorage]);

  const removeDeliverable = useCallback((id: string) => {
    setOrder((prev) => {
      const newDeliverables = prev.deliverables.filter((d) => d.id !== id);
      const newOrder = { ...prev, deliverables: newDeliverables };
      saveToLocalStorage(newOrder);
      return newOrder;
    });
  }, [saveToLocalStorage]);
  
  const setPaymentReceived = useCallback((amount: number) => {
    setOrder((prev) => {
        const newOrder = { ...prev, paymentReceived: amount };
        saveToLocalStorage(newOrder);
        return newOrder;
    });
  }, [saveToLocalStorage]);

  const resetOrder = useCallback(() => {
    const newOrderId = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = { ...initialOrderState, orderId: newOrderId };
    setOrder(newOrder);
    saveToLocalStorage(newOrder);
    toast({
        title: 'Order Cancelled',
        description: 'The form has been reset.',
    });
  }, [saveToLocalStorage, toast]);


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
