'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { EventDetailsForm } from '@/components/flow1/EventDetailsForm';

export default function NewOrderPage() {
  return (
    <AppLayout>
      <EventDetailsForm />
    </AppLayout>
  );
}
