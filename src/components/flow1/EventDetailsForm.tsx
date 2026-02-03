'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { CalendarIcon, Users, Star, PartyPopper, Cake, Milestone, Check, ChevronsUpDown, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

import { eventDetailsSchema } from '@/lib/schemas';
import type { EventDetails, EventType } from '@/lib/types';
import { useOrder } from '@/context/OrderContext';
import { cn } from '@/lib/utils';
import { MobileNav } from '../layout/MobileNav';
import { useHeaderSummary } from '@/hooks/use-header-summary';
import { CITIES } from '@/lib/cities';

const eventTypeOptions: { value: EventType; label: string; icon: React.ElementType }[] = [
  { value: 'Wedding', label: 'Wedding', icon: Users },
  { value: 'Engagement', label: 'Engagement', icon: Star },
  { value: 'Anniversary', label: 'Anniversary', icon: PartyPopper },
  { value: 'Birthday', label: 'Birthday', icon: Cake },
  { value: 'Others', label: 'Others', icon: Milestone },
];

function FormError({ message }: { message?: string }) {
  return (
    <div className={cn(
      "overflow-hidden transition-all duration-300 ease-in-out",
      message ? "max-h-10 opacity-100 mt-1.5" : "max-h-0 opacity-0"
    )}>
      <p className="text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1">
        {message}
      </p>
    </div>
  );
}

function ComboboxCity({ 
  value, 
  onSelect, 
  placeholder, 
  error 
}: { 
  value?: string, 
  onSelect: (val: string) => void, 
  placeholder: string,
  error?: string
}) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleSelectCustom = () => {
    if (searchValue) {
      onSelect(searchValue);
      setOpen(false);
    }
  };

  return (
    <div className="relative group">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal text-left h-10 px-3 pr-14",
              !value && "text-muted-foreground",
              error && "border-destructive ring-1 ring-destructive"
            )}
          >
            <span className="truncate">{value || placeholder}</span>
            <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 opacity-50 pointer-events-none" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command 
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // If there's search text and no exact match is selected, use the custom value
                const hasExactMatch = CITIES.some(city => city.toLowerCase() === searchValue.toLowerCase());
                if (!hasExactMatch && searchValue) {
                  handleSelectCustom();
                }
              }
            }}
          >
            <CommandInput 
              placeholder={`Search ${placeholder.toLowerCase()}...`} 
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                <div className="p-2 flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground text-center">No city found.</p>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="w-full justify-start h-8 px-2"
                    type="button"
                    onClick={handleSelectCustom}
                  >
                    Use "{searchValue}"
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup heading="Cities">
                {CITIES.map((city) => (
                  <CommandItem
                    key={city}
                    value={city}
                    onSelect={(currentValue) => {
                      onSelect(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === city ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {city}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-8 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground z-20"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect("");
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export function EventDetailsForm() {
  const router = useRouter();
  const { order, setEventDetails, saveAsDraft, resetOrder, isLoaded } = useOrder();
  
  const form = useForm<EventDetails>({
    resolver: zodResolver(eventDetailsSchema),
    defaultValues: order.eventDetails,
    mode: 'onChange'
  });

  const { register, control, watch, handleSubmit, formState: { errors, isValid }, reset, setValue } = form;
  
  useEffect(() => {
    if (isLoaded) {
      reset(order.eventDetails);
    }
  }, [isLoaded, order.eventDetails, reset]);
  
  const watchedFields = watch();
  const headerSummary = useHeaderSummary(watchedFields);

  const dueDateWarning = (
    watchedFields.orderDueDate && watchedFields.eventDate &&
    new Date(watchedFields.orderDueDate) > new Date(watchedFields.eventDate)
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
                            "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/20 hover:text-accent-foreground cursor-pointer transition-all",
                            field.value === option.value && "border-primary ring-2 ring-primary bg-primary/5",
                            errors.eventType && "border-destructive/50"
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
              <FormError message={errors.eventType?.message} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Date & Venue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="venueName">Venue</Label>
                  <Controller
                    name="venueName"
                    control={control}
                    render={({ field }) => (
                      <ComboboxCity 
                        value={field.value} 
                        onSelect={field.onChange} 
                        placeholder="Select or enter venue" 
                        error={errors.venueName?.message}
                      />
                    )}
                  />
                  <FormError message={errors.venueName?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipToCity">Ship to City</Label>
                  <Controller
                    name="shipToCity"
                    control={control}
                    render={({ field }) => (
                      <ComboboxCity 
                        value={field.value} 
                        onSelect={field.onChange} 
                        placeholder="Select or enter city" 
                      />
                    )}
                  />
                  <FormError message={errors.shipToCity?.message} />
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
                              className={cn(
                                "w-full justify-start text-left font-normal", 
                                !field.value && "text-muted-foreground",
                                errors.eventDate && "border-destructive ring-1 ring-destructive"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(new Date(field.value), 'dd MMM yyyy') : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 flex flex-col" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            {field.value && (
                              <div className="p-2 border-t">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                  type="button"
                                  onClick={() => field.onChange(undefined)}
                                >
                                  Clear Date
                                </Button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                  <FormError message={errors.eventDate?.message} />
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
                              className={cn(
                                "w-full justify-start text-left font-normal", 
                                !field.value && "text-muted-foreground",
                                errors.orderDueDate && "border-destructive ring-1 ring-destructive"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(new Date(field.value), 'dd MMM yyyy') : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 flex flex-col" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            {field.value && (
                              <div className="p-2 border-t">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                  type="button"
                                  onClick={() => field.onChange(undefined)}
                                >
                                  Clear Date
                                </Button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                  <FormError message={errors.orderDueDate?.message} />
                  {dueDateWarning && (
                    <Alert variant="destructive" className="mt-2 bg-orange-100 border-orange-300 text-orange-800 animate-in fade-in slide-in-from-top-1">
                      <AlertDescription>Due date is past the event.</AlertDescription>
                    </Alert>
                  )}
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
                      <Input id="brideName" {...register('brideName')} className={cn(errors.brideName && "border-destructive")} />
                      <FormError message={errors.brideName?.message} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="groomName">Groom's Name</Label>
                      <Input id="groomName" {...register('groomName')} className={cn(errors.groomName && "border-destructive")} />
                      <FormError message={errors.groomName?.message} />
                    </div>
                  </div>
                )}
                
                {/* Engagement Fields */}
                {watchedFields.eventType === 'Engagement' && (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="engagementBrideName">Bride's Name</Label>
                            <Input id="engagementBrideName" {...register('engagementBrideName')} className={cn(errors.engagementBrideName && "border-destructive")} />
                            <FormError message={errors.engagementBrideName?.message} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="engagementGroomName">Groom's Name</Label>
                            <Input id="engagementGroomName" {...register('engagementGroomName')} className={cn(errors.engagementGroomName && "border-destructive")} />
                            <FormError message={errors.engagementGroomName?.message} />
                        </div>
                    </div>
                     <div className="grid md:grid-cols-2 gap-6 items-start">
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
                                        className={cn(
                                          "w-full justify-start text-left font-normal", 
                                          !field.value && "text-muted-foreground",
                                          errors.weddingDate && "border-destructive ring-1 ring-destructive"
                                        )}
                                        >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(new Date(field.value), 'dd MMM yyyy') : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 flex flex-col" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                        {field.value && (
                                          <div className="p-2 border-t">
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                              type="button"
                                              onClick={() => field.onChange(undefined)}
                                            >
                                              Clear Date
                                            </Button>
                                          </div>
                                        )}
                                    </PopoverContent>
                                    </Popover>
                                )}
                            />
                            <FormError message={errors.weddingDate?.message} />
                        </div>
                        <div className="space-y-2">
                           <Label>Wedding Date Status</Label>
                           <Controller
                              name="dateStatus"
                              control={control}
                              render={({ field }) => (
                                <Tabs 
                                  value={field.value ? 'fixed' : 'tentative'} 
                                  onValueChange={(val) => field.onChange(val === 'fixed')}
                                  className="w-full"
                                >
                                  <TabsList className="grid w-full grid-cols-2 h-10">
                                    <TabsTrigger value="tentative">Tentative</TabsTrigger>
                                    <TabsTrigger value="fixed">Fixed</TabsTrigger>
                                  </TabsList>
                                </Tabs>
                              )}
                            />
                            <div className="h-5" /> {/* Spacer for symmetry */}
                        </div>
                    </div>
                  </>
                )}

                {/* Anniversary Fields */}
                {watchedFields.eventType === 'Anniversary' && (
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="wifeName">Wife's Name</Label>
                      <Input id="wifeName" {...register('wifeName')} className={cn(errors.wifeName && "border-destructive")} />
                      <FormError message={errors.wifeName?.message} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="husbandName">Husband's Name</Label>
                      <Input id="husbandName" {...register('husbandName')} className={cn(errors.husbandName && "border-destructive")} />
                      <FormError message={errors.husbandName?.message} />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="milestoneYears">Milestone Years</Label>
                      <Input id="milestoneYears" type="number" {...register('milestoneYears', { valueAsNumber: true })} className={cn(errors.milestoneYears && "border-destructive")} />
                      <FormError message={errors.milestoneYears?.message} />
                    </div>
                  </div>
                )}
                
                {/* Birthday Fields */}
                {watchedFields.eventType === 'Birthday' && (
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="honoreeNameBirthday">Honoree Name</Label>
                      <Input id="honoreeNameBirthday" {...register('honoreeNameBirthday')} className={cn(errors.honoreeNameBirthday && "border-destructive")} />
                      <FormError message={errors.honoreeNameBirthday?.message} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                       <Controller
                          name="gender"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger className={cn(errors.gender && "border-destructive")}>
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
                      <FormError message={errors.gender?.message} />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="ageMilestone">Age / Milestone</Label>
                      <Input id="ageMilestone" type="number" {...register('ageMilestone', { valueAsNumber: true })} className={cn(errors.ageMilestone && "border-destructive")} />
                      <FormError message={errors.ageMilestone?.message} />
                    </div>
                  </div>
                )}
                
                {/* Others Fields */}
                {watchedFields.eventType === 'Others' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="eventName">Event Name</Label>
                      <Input id="eventName" {...register('eventName')} className={cn(errors.eventName && "border-destructive")} />
                      <FormError message={errors.eventName?.message} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="honoreeNameOther">Honoree Name</Label>
                      <Input id="honoreeNameOther" {...register('honoreeNameOther')} className={cn(errors.honoreeNameOther && "border-destructive")} />
                      <FormError message={errors.honoreeNameOther?.message} />
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

      <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t bg-background px-4 md:px-6 h-20">
        <Button variant="outline" type="button" onClick={() => resetOrder()}>Cancel</Button>
        <div className="flex items-center gap-4">
          <Button variant="secondary" type="button" onClick={saveAsDraft}>Save as Draft</Button>
          <Button type="submit" disabled={!isValid}>Next Step</Button>
        </div>
      </footer>
    </form>
  );
}
