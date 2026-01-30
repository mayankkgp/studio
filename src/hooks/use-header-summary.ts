import { useMemo } from 'react';
import { format } from 'date-fns';
import { getOrdinal } from '@/lib/utils';
import type { EventDetails } from '@/lib/types';

export function useHeaderSummary(eventDetails: Partial<EventDetails>) {
    const headerSummary = useMemo(() => {
        let eventTypeDisplay = 'New Order';
        if (eventDetails.eventType) {
          eventTypeDisplay = `${eventDetails.eventType}`;
        }
        
        let namesDisplay = '';
        let dateDisplay = '';

        if (eventDetails.eventType === 'Anniversary' && eventDetails.milestoneYears) {
            eventTypeDisplay = `${getOrdinal(eventDetails.milestoneYears)} Anniversary`;
            if (eventDetails.husbandName && eventDetails.wifeName) {
                namesDisplay = `${eventDetails.wifeName} & ${eventDetails.husbandName}`;
            }
        } else if (eventDetails.eventType === 'Birthday' && eventDetails.ageMilestone) {
            eventTypeDisplay = `${getOrdinal(eventDetails.ageMilestone)} Birthday`;
            namesDisplay = eventDetails.honoreeNameBirthday || '';
        } else if (eventDetails.eventType === 'Wedding') {
            if (eventDetails.brideName && eventDetails.groomName) {
                namesDisplay = `${eventDetails.brideName} & ${eventDetails.groomName}`;
            }
        } else if (eventDetails.eventType === 'Engagement') {
            if (eventDetails.engagementBrideName && eventDetails.engagementGroomName) {
                namesDisplay = `${eventDetails.engagementBrideName} & ${eventDetails.engagementGroomName}`;
            }
        } else if (eventDetails.eventType === 'Others') {
            eventTypeDisplay = eventDetails.eventName || 'Other Event';
            namesDisplay = eventDetails.honoreeNameOther || '';
        }

        if (eventDetails.eventDate) {
            try {
              dateDisplay = format(new Date(eventDetails.eventDate), 'dd MMM yyyy');
            } catch(e) { /* ignore invalid date */ }
        }

        if (!eventDetails.eventType) {
            return 'New Order';
        }

        return [eventTypeDisplay, namesDisplay, dateDisplay].filter(Boolean).join(' • ');
    }, [eventDetails]);

    return headerSummary;
}
