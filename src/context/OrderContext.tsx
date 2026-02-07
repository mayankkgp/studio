'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Order, EventDetails, ConfiguredProduct } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { usePathname, useRouter } from 'next/navigation';

type OrderContextType = {
  order: Order;
  setEventDetails: (details: EventDetails) => void;
  addDeliverable: (deliverable: ConfiguredProduct) => void;
  updateDeliverable: (id: string, updates: Partial<ConfiguredProduct>) => void;
  removeDeliverable: (id: string) => void;
  setPaymentReceived: (amount: number) => void;
  saveAsDraft: (manualDetails?: EventDetails) => Promise<boolean>;
  activateOrder: () => Promise<boolean>;
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

const LS_DRAFTS_KEY = 'srishbish_drafts_v1';
const LS_ACTIVE_KEY = 'srishbish_active_v1';

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [order, setOrder] = useState<Order>(initialOrderState);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const resetOrder = useCallback(() => {
    setOrder(initialOrderState);
  }, []);

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

  const loadDraft = useCallback((draftOrder: Order) => {
    setOrder(draftOrder);
    toast({
      title: 'Order Loaded',
      description: `Order ${draftOrder.orderId} is now active.`,
    });
  }, [toast]);

  const saveToLocalStorage = useCallback((key: string, data: any) => {
    try {
      const existingRaw = localStorage.getItem(key);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      existing[data.orderId] = { ...data, lastSavedAt: new Date().toISOString() };
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) {
      console.warn('LocalStorage Save Failed', e);
    }
  }, []);

  const saveAsDraft = useCallback(async (manualDetails?: EventDetails): Promise<boolean> => {
    let currentOrderId = order.orderId;
    if (!currentOrderId) {
      currentOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      setOrder(prev => ({ ...prev, orderId: currentOrderId }));
    }

    const orderToSave = {
      ...order,
      orderId: currentOrderId,
      eventDetails: manualDetails || order.eventDetails,
      currentStep: pathname || '/',
      lastSavedAt: new Date().toISOString(),
    };

    saveToLocalStorage(LS_DRAFTS_KEY, orderToSave);
    
    toast({ title: 'Saved Locally', description: `Order ${currentOrderId} saved to device.` });
    return true;
  }, [order, toast, pathname, saveToLocalStorage]);

  const activateOrder = useCallback(async (): Promise<boolean> => {
    if (!order.orderId) {
        toast({ variant: 'destructive', title: 'Action Denied', description: 'Please save as draft first.' });
        return false;
    }

    const orderToActivate = {
      ...order,
      currentStep: '/active-orders',
      activatedAt: new Date().toISOString(),
    };

    saveToLocalStorage(LS_ACTIVE_KEY, orderToActivate);
    
    try {
      const existingDrafts = JSON.parse(localStorage.getItem(LS_DRAFTS_KEY) || '{}');
      delete existingDrafts[order.orderId];
      localStorage.setItem(LS_DRAFTS_KEY, JSON.stringify(existingDrafts));
    } catch (e) {}

    toast({ title: 'Order Activated!', description: `Moved ${order.orderId} to Active Orders.` });
    resetOrder();
    router.push('/active-orders');
    return true;
  }, [order, toast, router, resetOrder, saveToLocalStorage]);

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
        activateOrder,
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