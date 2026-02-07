
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Order, EventDetails, ConfiguredProduct } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { usePathname, useRouter } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { useFirestore } from '@/firebase';

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

// Keys for LocalStorage
const LS_DRAFTS_KEY = 'srishbish_drafts_v1';
const LS_ACTIVE_KEY = 'srishbish_active_v1';

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [order, setOrder] = useState<Order>(initialOrderState);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const db = useFirestore();
  
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
      title: 'Draft Restored',
      description: `Order ${draftOrder.orderId} is now active.`,
    });
  }, [toast]);

  const saveToLocalStorage = useCallback((collection: string, data: any) => {
    try {
      const existingRaw = localStorage.getItem(collection);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      existing[data.orderId] = { ...data, lastSavedAt: new Date().toISOString() };
      localStorage.setItem(collection, JSON.stringify(existing));
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
      orderId: currentOrderId,
      id: currentOrderId,
      eventDetails: manualDetails || order.eventDetails,
      deliverables: order.deliverables || [],
      paymentReceived: order.paymentReceived || 0,
      currentStep: pathname || '/',
      lastSavedAt: new Date().toISOString(),
    };

    // 1. Save to LocalStorage IMMEDIATELY (Relaxed Permission)
    saveToLocalStorage(LS_DRAFTS_KEY, orderToSave);
    
    // 2. Background Sync to Cloud (Non-blocking)
    if (db) {
      const draftRef = doc(db, 'drafts', currentOrderId);
      setDoc(draftRef, { ...orderToSave, lastSavedAt: serverTimestamp() }, { merge: true })
        .catch(() => {
          // Silent catch for background sync errors to avoid blocking UI
          console.debug('Cloud sync pending rules update');
        });
    }

    toast({ title: 'Saved Locally', description: `Progress for ${currentOrderId} secured.` });
    return true;
  }, [order, toast, pathname, db, saveToLocalStorage]);

  const activateOrder = useCallback(async (): Promise<boolean> => {
    if (!order.orderId) {
        toast({ variant: 'destructive', title: 'Action Denied', description: 'Please save as draft first.' });
        return false;
    }

    const orderToActivate = {
      orderId: order.orderId,
      id: order.orderId,
      eventDetails: order.eventDetails,
      deliverables: order.deliverables,
      paymentReceived: order.paymentReceived,
      currentStep: '/active-orders',
      activatedAt: new Date().toISOString(),
    };

    // 1. Save to Local Active
    saveToLocalStorage(LS_ACTIVE_KEY, orderToActivate);
    
    // 2. Remove from Local Drafts
    try {
      const existingDrafts = JSON.parse(localStorage.getItem(LS_DRAFTS_KEY) || '{}');
      delete existingDrafts[order.orderId];
      localStorage.setItem(LS_DRAFTS_KEY, JSON.stringify(existingDrafts));
    } catch (e) {}

    // 3. Background Cloud Sync
    if (db) {
      const activeRef = doc(db, 'active-orders', order.orderId);
      const draftRef = doc(db, 'drafts', order.orderId);
      
      setDoc(activeRef, { ...orderToActivate, activatedAt: serverTimestamp() })
        .then(() => deleteDoc(draftRef))
        .catch(() => console.debug('Cloud activation pending rules'));
    }

    toast({ title: 'Order Activated!', description: `Moved ${order.orderId} to Active List.` });
    resetOrder();
    router.push('/active-orders');
    return true;
  }, [order, db, toast, router, resetOrder, saveToLocalStorage]);

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
