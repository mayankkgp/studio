'use client';

import { OrderProvider } from '@/context/OrderContext';
import type { ReactNode } from 'react';

export function AppProvider({ children }: { children: ReactNode }) {
  return <OrderProvider>{children}</OrderProvider>;
}
