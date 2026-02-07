
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

const SYNC_TIMEOUT = 12000;

const withTimeout = <T>(promise: Promise<T>, ms: number = SYNC_TIMEOUT): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('DATABASE_RULES_UPDATING')), ms)
    )
  ]);
};

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

  const saveAsDraft = useCallback(async (manualDetails?: EventDetails): Promise<boolean> => {
    if (!db) return false;

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
      lastSavedAt: serverTimestamp(),
    };

    const draftRef = doc(db, 'drafts', currentOrderId);

    try {
      await withTimeout(setDoc(draftRef, orderToSave, { merge: true }));
      toast({ title: 'Draft Saved', description: `Order ${currentOrderId} synced to cloud.` });
      return true;
    } catch (serverError: any) {
      if (serverError.message === 'DATABASE_RULES_UPDATING') {
        toast({ title: 'Sync Failed', description: 'Database rules are updating. Please try again in 5 seconds.' });
        return false;
      }
      const permissionError = new FirestorePermissionError({
        path: draftRef.path,
        operation: 'write',
        requestResourceData: orderToSave,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      return false;
    }
  }, [order, toast, pathname, db]);

  const activateOrder = useCallback(async (): Promise<boolean> => {
    if (!db || !order.orderId) {
        toast({ variant: 'destructive', title: 'Action Denied', description: 'Order ID missing. Please save as draft first.' });
        return false;
    }

    const orderToActivate = {
      orderId: order.orderId,
      id: order.orderId,
      eventDetails: order.eventDetails,
      deliverables: order.deliverables,
      paymentReceived: order.paymentReceived,
      currentStep: '/active-orders',
      lastSavedAt: order.lastSavedAt || null,
      activatedAt: serverTimestamp(),
    };

    const activeRef = doc(db, 'active-orders', order.orderId);
    const draftRef = doc(db, 'drafts', order.orderId);

    try {
      await withTimeout(setDoc(activeRef, orderToActivate));
      deleteDoc(draftRef).catch(() => {});
      toast({ title: 'Success!', description: `Order ${order.orderId} has been activated.` });
      resetOrder();
      router.push('/active-orders');
      return true;
    } catch (serverError: any) {
      if (serverError.message === 'DATABASE_RULES_UPDATING') {
        toast({ title: 'Sync Failed', description: 'Rules are updating. Please try again.' });
        return false;
      }
      const permissionError = new FirestorePermissionError({
        path: activeRef.path,
        operation: 'create',
        requestResourceData: orderToActivate,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      return false;
    }
  }, [order, db, toast, router, resetOrder]);

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
