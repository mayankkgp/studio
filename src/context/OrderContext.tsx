'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Order, EventDetails, ConfiguredProduct } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

type OrderContextType = {
  order: Order;
  setEventDetails: (details: EventDetails) => void;
  addDeliverable: (deliverable: ConfiguredProduct) => void;
  updateDeliverable: (id: string, updates: Partial<ConfiguredProduct>) => void;
  removeDeliverable: (id: string) => void;
  setPaymentReceived: (amount: number) => void;
  saveAsDraft: () => Promise<void>;
  loadDraft: (draftOrder: Order) => void;
  resetOrder: () => void;
  isLoaded: boolean;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

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
    setOrder((prev) => ({ ...prev, orderId: prev.orderId || newOrderId }));
    setIsLoaded(true);
  }, []);

  const saveAsDraft = useCallback(async () => {
    try {
      const draftRef = doc(db, 'drafts', order.orderId);
      
      // Clean dates for Firestore
      const serializedOrder = {
        ...order,
        lastSavedAt: serverTimestamp(),
      };

      await setDoc(draftRef, serializedOrder, { merge: true });

      toast({
        title: 'Draft Saved',
        description: `Order ${order.orderId} has been persisted to the cloud.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error.message || 'Could not save draft to Firestore.',
      });
    }
  }, [order, toast]);

  const loadDraft = useCallback((draftOrder: Order) => {
    // Ensure dates are correctly hydrated if they come back as Firestore timestamps
    const hydratedOrder = {
      ...draftOrder,
      eventDetails: {
        ...draftOrder.eventDetails,
        eventDate: (draftOrder.eventDetails?.eventDate as any)?.toDate?.() || draftOrder.eventDetails?.eventDate,
        orderDueDate: (draftOrder.eventDetails?.orderDueDate as any)?.toDate?.() || draftOrder.eventDetails?.orderDueDate,
        weddingDate: (draftOrder.eventDetails?.weddingDate as any)?.toDate?.() || draftOrder.eventDetails?.weddingDate,
      }
    };

    setOrder(hydratedOrder);
    toast({
      title: 'Order Resumed',
      description: `Draft ${draftOrder.orderId} is now active.`,
    });
  }, [toast]);

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
        loadDraft,
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
