'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { CalendarIcon, Users, Star, PartyPopper, Cake, Milestone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { eventDetailsSchema } from '@/lib/schemas';
import type { EventDetails, EventType } from '@/lib/types';
import { useOrder } from '@/context/OrderContext';
import { cn } from '@/lib/utils';
import { MobileNav } from '../layout/MobileNav';
import { useHeaderSummary } from '@/hooks/use-header-summary';

const eventTypeOptions: { value: EventType; label: string; icon: React.ElementType }[] = [
  { value: 'Wedding', label: 'Wedding', icon: Users },
  { value: 'Engagement', label: 'Engagement', icon: Star },
  { value: 'Anniversary', label: 'Anniversary', icon: PartyPopper },
  { value: 'Birthday', label: 'Birthday', icon: Cake },
  { value: 'Others', label: 'Others', icon: Milestone },
];

export function EventDetailsForm() {
  const router = useRouter();
  const { order, setEventDetails, saveAsDraft, resetOrder, isLoaded } = useOrder();
  
  const form = useForm<EventDetails>({
    resolver: zodResolver(eventDetailsSchema),
    defaultValues: order.eventDetails,
    mode: 'onChange'
  });

  const { register, control, watch, handleSubmit, formState: { errors, isValid }, reset } = form;
  
  useEffect(() => {
    if (isLoaded) {
      reset(order.eventDetails);
    }
  }, [isLoaded, order.eventDetails, reset]);
  
  const watchedFields = watch();
  const headerSummary = useHeaderSummary(watchedFields);

  const dueDateWarning = (
    watchedFields.orderDueDate && watchedFields.eventDate &&
    watchedFields.orderDueDate > watchedFields.eventDate
  );

  const onSubmit = (data: EventDetails) => {
    setEventDetails(data);
    router.push('/deliverables');
  };

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-screen">
      <header className="sticky top-0 z-10 flex h-20 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
        <MobileNav />
        <div className="flex-1">
          <h1 className="font-semibold text-lg md:text-xl font-headline truncate" title={headerSummary}>
            {headerSummary}
          </h1>
           <p className="text-sm text-muted-foreground">Event Details</p>
        </div>
        <div className="hidden lg:block font-mono text-sm">
            {order.orderId}
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Event Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="eventType"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
                  >
                    {eventTypeOptions.map((option) => (
                      <div key={option.value}>
                        <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                        <Label
                          htmlFor={option.value}
                          className={cn(
                            "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/20 hover:text-accent-foreground cursor-pointer",
                            field.value === option.value && "border-primary ring-2 ring-primary"
                          )}
                        >
                          <option.icon className="mb-3 h-6 w-6" />
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              />
              {errors.eventType && <p className="text-sm font-medium text-destructive mt-2">{errors.eventType.message}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Date & Venue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="venueName">Venue Name</Label>
                  <Input id="venueName" placeholder="e.g., Grand Hyatt" {...register('venueName')} />
                  {errors.venueName && <p className="text-sm font-medium text-destructive">{errors.venueName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipToCity">Ship to City</Label>
                  <Input id="shipToCity" placeholder="e.g., New Delhi" {...register('shipToCity')} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Event Date</Label>
                   <Controller
                      name="eventDate"
                      control={control}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                  {errors.eventDate && <p className="text-sm font-medium text-destructive">{errors.eventDate.message}</p>}
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="orderDueDate">Order Due Date</Label>
                   <Controller
                      name="orderDueDate"
                      control={control}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                  {errors.orderDueDate && <p className="text-sm font-medium text-destructive">{errors.orderDueDate.message}</p>}
                  {dueDateWarning && <Alert variant="destructive" className="mt-2 bg-orange-100 border-orange-300 text-orange-800"><AlertDescription>Due date is past the event.</AlertDescription></Alert>}
                </div>
              </div>
            </CardContent>
          </Card>

          {watchedFields.eventType && (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Event Specifics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Wedding Fields */}
                {watchedFields.eventType === 'Wedding' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="brideName">Bride's Name</Label>
                      <Input id="brideName" {...register('brideName')} />
                      {errors.brideName && <p className="text-sm font-medium text-destructive">{errors.brideName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="groomName">Groom's Name</Label>
                      <Input id="groomName" {...register('groomName')} />
                      {errors.groomName && <p className="text-sm font-medium text-destructive">{errors.groomName.message}</p>}
                    </div>
                  </div>
                )}
                
                {/* Engagement Fields */}
                {watchedFields.eventType === 'Engagement' && (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="engagementBrideName">Bride's Name</Label>
                            <Input id="engagementBrideName" {...register('engagementBrideName')} />
                            {errors.engagementBrideName && <p className="text-sm font-medium text-destructive">{errors.engagementBrideName.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="engagementGroomName">Groom's Name</Label>
                            <Input id="engagementGroomName" {...register('engagementGroomName')} />
                            {errors.engagementGroomName && <p className="text-sm font-medium text-destructive">{errors.engagementGroomName.message}</p>}
                        </div>
                    </div>
                     <div className="grid md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="weddingDate">Wedding Date</Label>
                            <Controller
                                name="weddingDate"
                                control={control}
                                render={({ field }) => (
                                    <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                        variant={"outline"}
                                        className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                                        >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                    </Popover>
                                )}
                            />
                            {errors.weddingDate && <p className="text-sm font-medium text-destructive">{errors.weddingDate.message}</p>}
                        </div>
                        <div className="flex items-center space-x-2 pb-2">
                           <Controller
                              name="dateStatus"
                              control={control}
                              render={({ field }) => (
                                <Switch id="dateStatus" checked={field.value} onCheckedChange={field.onChange} />
                              )}
                            />
                          <Label htmlFor="dateStatus">{watchedFields.dateStatus ? 'Fixed' : 'Tentative'}</Label>
                        </div>
                    </div>
                  </>
                )}

                {/* Anniversary Fields */}
                {watchedFields.eventType === 'Anniversary' && (
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="wifeName">Wife's Name</Label>
                      <Input id="wifeName" {...register('wifeName')} />
                       {errors.wifeName && <p className="text-sm font-medium text-destructive">{errors.wifeName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="husbandName">Husband's Name</Label>
                      <Input id="husbandName" {...register('husbandName')} />
                       {errors.husbandName && <p className="text-sm font-medium text-destructive">{errors.husbandName.message}</p>}
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="milestoneYears">Milestone Years</Label>
                      <Input id="milestoneYears" type="number" {...register('milestoneYears', { valueAsNumber: true })} />
                       {errors.milestoneYears && <p className="text-sm font-medium text-destructive">{errors.milestoneYears.message}</p>}
                    </div>
                  </div>
                )}
                
                {/* Birthday Fields */}
                {watchedFields.eventType === 'Birthday' && (
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="honoreeNameBirthday">Honoree Name</Label>
                      <Input id="honoreeNameBirthday" {...register('honoreeNameBirthday')} />
                       {errors.honoreeNameBirthday && <p className="text-sm font-medium text-destructive">{errors.honoreeNameBirthday.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                       <Controller
                          name="gender"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      {errors.gender && <p className="text-sm font-medium text-destructive">{errors.gender.message}</p>}
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="ageMilestone">Age / Milestone</Label>
                      <Input id="ageMilestone" type="number" {...register('ageMilestone', { valueAsNumber: true })} />
                       {errors.ageMilestone && <p className="text-sm font-medium text-destructive">{errors.ageMilestone.message}</p>}
                    </div>
                  </div>
                )}
                
                {/* Others Fields */}
                {watchedFields.eventType === 'Others' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="eventName">Event Name</Label>
                      <Input id="eventName" {...register('eventName')} />
                      {errors.eventName && <p className="text-sm font-medium text-destructive">{errors.eventName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="honoreeNameOther">Honoree Name</Label>
                      <Input id="honoreeNameOther" {...register('honoreeNameOther')} />
                      {errors.honoreeNameOther && <p className="text-sm font-medium text-destructive">{errors.honoreeNameOther.message}</p>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea placeholder="Any other details..." {...register('additionalNotes')} />
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="sticky bottom-0 z-10 flex items-center justify-end gap-4 border-t bg-background px-4 md:px-6 h-20">
        <Button variant="outline" type="button" onClick={() => {
            resetOrder();
        }}>Cancel</Button>
        <Button variant="secondary" type="button" onClick={saveAsDraft}>Save as Draft</Button>
        <Button type="submit" disabled={!isValid} style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>Next Step</Button>
      </footer>
    </form>
  );
}
