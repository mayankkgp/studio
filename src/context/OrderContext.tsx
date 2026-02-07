'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Order, EventDetails, ConfiguredProduct } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { usePathname } from 'next/navigation';

type OrderContextType = {
  order: Order;
  setEventDetails: (details: EventDetails) => void;
  addDeliverable: (deliverable: ConfiguredProduct) => void;
  updateDeliverable: (id: string, updates: Partial<ConfiguredProduct>) => void;
  removeDeliverable: (id: string) => void;
  setPaymentReceived: (amount: number) => void;
  saveAsDraft: (manualDetails?: EventDetails) => Promise<boolean>;
  loadDraft: (draftOrder: Order) => void;
  resetOrder: () => void;
  isLoaded: boolean;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const initialOrderState: Order = {
  orderId: '',
  eventDetails: {
    eventType: 'Wedding',
    brideName: '',
    groomName: '',
    eventDate: undefined,
    orderDueDate: undefined,
    venueName: '',
    shipToCity: ''
  },
  deliverables: [],
  paymentReceived: 0,
};

// Helper to force a timeout for database operations
const withTimeout = (promise: Promise<any>, ms: number) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Request timed out")), ms)
        )
    ]);
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }: { children: React.ReactNode }) => {
  const [order, setOrder] = useState<Order>(initialOrderState);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();
  const pathname = usePathname();
  
  useEffect(() => {
    const newOrderId = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    setOrder((prev) => ({ ...prev, orderId: prev.orderId || newOrderId }));
    setIsLoaded(true);
  }, []);

  const saveAsDraft = useCallback(async (manualDetails?: EventDetails): Promise<boolean> => {
    try {
      const currentOrderId = order.orderId;
      if (!currentOrderId) return false;

      const draftRef = doc(db, 'drafts', currentOrderId);
      
      const orderToSave = {
        ...order,
        eventDetails: manualDetails || order.eventDetails,
        currentStep: pathname,
        lastSavedAt: serverTimestamp(),
      };

      // Force fail if it takes longer than 10 seconds
      await withTimeout(
        setDoc(draftRef, orderToSave, { merge: true }), 
        10000 
      );

      toast({
        title: 'Draft Saved',
        description: `Order ${currentOrderId} has been successfully persisted to the cloud.`,
      });
      return true;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error.message || 'Could not save draft. Please check your connection.',
      });
      return false;
    }
  }, [order, toast, pathname]);

  const loadDraft = useCallback((draftOrder: Order) => {
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
