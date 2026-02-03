import { z } from 'zod';

const requiredString = z.string().min(1, 'This field is required');
const optionalString = z.string().optional();
const requiredDate = z.date({ required_error: 'Please select a date' });
const requiredNumber = z.number().min(1, 'Must be at least 1');

export const eventDetailsSchema = z
  .object({
    eventType: z.enum(['Wedding', 'Engagement', 'Anniversary', 'Birthday', 'Others'], {
      required_error: 'You need to select an event type.',
    }),
    venueName: optionalString,
    eventDate: requiredDate,
    orderDueDate: requiredDate,
    shipToCity: optionalString,

    // Wedding
    brideName: optionalString,
    groomName: optionalString,

    // Engagement
    engagementBrideName: optionalString,
    engagementGroomName: optionalString,
    weddingDate: z.date().optional(),
    dateStatus: z.boolean().default(true), // false = Tentative, true = Fixed (defaulting to true)

    // Anniversary
    husbandName: optionalString,
    wifeName: optionalString,
    milestoneYears: z.number().optional(),

    // Birthday
    honoreeNameBirthday: optionalString,
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    ageMilestone: z.number().optional(),

    // Others
    eventName: optionalString,
    honoreeNameOther: optionalString,

    additionalNotes: optionalString,
  })
  .superRefine((data, ctx) => {
    // Wedding validation
    if (data.eventType === 'Wedding') {
      if (!data.brideName) ctx.addIssue({ code: 'custom', path: ['brideName'], message: 'Bride\'s name is required' });
      if (!data.groomName) ctx.addIssue({ code: 'custom', path: ['groomName'], message: 'Groom\'s name is required' });
    }

    // Engagement validation
    if (data.eventType === 'Engagement') {
      if (!data.engagementBrideName) ctx.addIssue({ code: 'custom', path: ['engagementBrideName'], message: 'Bride\'s name is required' });
      if (!data.engagementGroomName) ctx.addIssue({ code: 'custom', path: ['engagementGroomName'], message: 'Groom\'s name is required' });
      if (!data.weddingDate) ctx.addIssue({ code: 'custom', path: ['weddingDate'], message: 'Wedding date is required' });
    }

    // Anniversary validation
    if (data.eventType === 'Anniversary') {
      if (!data.husbandName) ctx.addIssue({ code: 'custom', path: ['husbandName'], message: 'Husband\'s name is required' });
      if (!data.wifeName) ctx.addIssue({ code: 'custom', path: ['wifeName'], message: 'Wife\'s name is required' });
      if (!data.milestoneYears) ctx.addIssue({ code: 'custom', path: ['milestoneYears'], message: 'Milestone is required' });
    }
    
    // Birthday validation
    if (data.eventType === 'Birthday') {
      if (!data.honoreeNameBirthday) ctx.addIssue({ code: 'custom', path: ['honoreeNameBirthday'], message: 'Honoree name is required' });
      if (!data.gender) ctx.addIssue({ code: 'custom', path: ['gender'], message: 'Gender is required' });
      if (!data.ageMilestone) ctx.addIssue({ code: 'custom', path: ['ageMilestone'], message: 'Age/Milestone is required' });
    }

    // Others validation
    if (data.eventType === 'Others') {
        if (!data.eventName) ctx.addIssue({ code: 'custom', path: ['eventName'], message: 'Event name is required' });
        if (!data.honoreeNameOther) ctx.addIssue({ code: 'custom', path: ['honoreeNameOther'], message: 'Honoree name is required' });
    }
  });
