'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { format, isValid as isValidDate } from 'date-fns';
import { CalendarIcon, Users, Star, PartyPopper, Cake, Milestone, Check, ChevronsUpDown, X, MapPin } from 'lucide-react';

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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

import { eventDetailsSchema } from '@/lib/schemas';
import type { EventDetails, EventType } from '@/lib/types';
import { useOrder } from '@/context/OrderContext';
import { cn } from '@/lib/utils';
import { MobileNav } from '../layout/MobileNav';
import { useHeaderSummary } from '@/hooks/use-header-summary';
import { CITIES } from '@/lib/cities';

function ComboboxCity({ 
  value, 
  onSelect, 
  placeholder 
}: { 
  value?: string, 
  onSelect: (val: string) => void, 
  placeholder: string
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
              "w-full justify-start font-normal text-left h-10 px-3 pr-14 hover:bg-transparent hover:border-foreground",
              !value && "text-muted-foreground"
            )}
          >
            <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate">{value || placeholder}</span>
            <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 opacity-50 pointer-events-none" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command 
            onKeyDown={(e) => {
              if (e.key === "Enter") {
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

const formatDisplayDate = (dateValue: any) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (!isValidDate(date)) return null;
  return format(date, 'dd MMM yyyy');
};

export function EventDetailsForm() {
  const router = useRouter();
  const { order, setEventDetails, saveAsDraft, resetOrder, isLoaded } = useOrder();
  
  const [openEventDate, setOpenEventDate] = useState(false);
  const [openDueDate, setOpenDueDate] = useState(false);
  const [openWeddingDate, setOpenWeddingDate] = useState(false);

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

  useEffect(() => {
    if (watchedFields.eventType && watchedFields.eventType !== 'Engagement') {
      setValue('dateStatus', true);
    }
  }, [watchedFields.eventType, setValue]);

  const onSubmit = (data: EventDetails) => {
    setEventDetails(data);
    router.push('/deliverables');
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? All unsaved changes will be lost.")) {
      resetOrder();
    }
  };

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-screen">
      <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 md:px-6 bg-background z-50">
        <MobileNav />
        <div className="flex-1 overflow-hidden">
          <h1 className="font-semibold text-base md:text-lg font-headline truncate" title={headerSummary}>
            {headerSummary}
          </h1>
           <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Event Details</p>
        </div>
        <div className="hidden lg:block font-mono text-xs opacity-50">
            {order.orderId}
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Event Type *</CardTitle>
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
                            field.value === option.value && "border-primary ring-2 ring-primary bg-primary/5"
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
                      />
                    )}
                  />
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
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Event Date *</Label>
                   <Controller
                      name="eventDate"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Popover open={openEventDate} onOpenChange={setOpenEventDate}>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal hover:bg-transparent hover:border-foreground", 
                                !field.value && "text-muted-foreground",
                                fieldState.invalid && "border-destructive"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formatDisplayDate(field.value) || <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 flex flex-col" align="start">
                            <Calendar 
                              mode="single" 
                              selected={field.value || undefined} 
                              onSelect={(date) => {
                                field.onChange(date);
                                setOpenEventDate(false);
                              }} 
                              initialFocus 
                            />
                            {field.value && (
                              <div className="p-2 border-t">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                  type="button"
                                  onClick={() => {
                                    field.onChange(null);
                                    setOpenEventDate(false);
                                  }}
                                >
                                  Clear Date
                                </Button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="orderDueDate">Order Due Date *</Label>
                   <Controller
                      name="orderDueDate"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Popover open={openDueDate} onOpenChange={setOpenDueDate}>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal hover:bg-transparent hover:border-foreground", 
                                !field.value && "text-muted-foreground",
                                fieldState.invalid && "border-destructive"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formatDisplayDate(field.value) || <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 flex flex-col" align="start">
                            <Calendar 
                              mode="single" 
                              selected={field.value || undefined} 
                              onSelect={(date) => {
                                field.onChange(date);
                                setOpenDueDate(false);
                              }} 
                              initialFocus 
                            />
                            {field.value && (
                              <div className="p-2 border-t">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                  type="button"
                                  onClick={() => {
                                    field.onChange(null);
                                    setOpenDueDate(false);
                                  }}
                                >
                                  Clear Date
                                </Button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      )}
                    />
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
                      <Label htmlFor="brideName">Bride's Name *</Label>
                      <Input id="brideName" {...register('brideName')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="groomName">Groom's Name *</Label>
                      <Input id="groomName" {...register('groomName')} />
                    </div>
                  </div>
                )}
                
                {/* Engagement Fields */}
                {watchedFields.eventType === 'Engagement' && (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="engagementBrideName">Bride's Name *</Label>
                            <Input id="engagementBrideName" {...register('engagementBrideName')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="engagementGroomName">Groom's Name *</Label>
                            <Input id="engagementGroomName" {...register('engagementGroomName')} />
                        </div>
                    </div>
                     <div className="grid md:grid-cols-2 gap-6 items-start">
                        <div className="space-y-2">
                            <Label htmlFor="weddingDate">Wedding Date *</Label>
                            <Controller
                                name="weddingDate"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <Popover open={openWeddingDate} onOpenChange={setOpenWeddingDate}>
                                    <PopoverTrigger asChild>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full justify-start text-left font-normal hover:bg-transparent hover:border-foreground", 
                                          !field.value && "text-muted-foreground",
                                          fieldState.invalid && "border-destructive"
                                        )}
                                        >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formatDisplayDate(field.value) || <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 flex flex-col" align="start">
                                        <Calendar 
                                          mode="single" 
                                          selected={field.value || undefined} 
                                          onSelect={(date) => {
                                            field.onChange(date);
                                            setOpenWeddingDate(false);
                                          }} 
                                          initialFocus 
                                        />
                                        {field.value && (
                                          <div className="p-2 border-t">
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                              type="button"
                                              onClick={() => {
                                                field.onChange(null);
                                                setOpenWeddingDate(false);
                                              }}
                                            >
                                              Clear Date
                                            </Button>
                                          </div>
                                        )}
                                    </PopoverContent>
                                    </Popover>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                           <Label>Wedding Date Status *</Label>
                           <Controller
                              name="dateStatus"
                              control={control}
                              render={({ field }) => (
                                <Tabs 
                                  value={field.value === true ? 'fixed' : field.value === false ? 'tentative' : ''} 
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
                        </div>
                    </div>
                  </>
                )}

                {/* Anniversary Fields */}
                {watchedFields.eventType === 'Anniversary' && (
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="wifeName">Wife's Name *</Label>
                      <Input id="wifeName" {...register('wifeName')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="husbandName">Husband's Name *</Label>
                      <Input id="husbandName" {...register('husbandName')} />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="milestoneYears">Milestone Years *</Label>
                      <Input id="milestoneYears" type="number" {...register('milestoneYears', { valueAsNumber: true })} />
                    </div>
                  </div>
                )}
                
                {/* Birthday Fields */}
                {watchedFields.eventType === 'Birthday' && (
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="honoreeNameBirthday">Honoree Name *</Label>
                      <Input id="honoreeNameBirthday" {...register('honoreeNameBirthday')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender *</Label>
                       <Controller
                          name="gender"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger className={cn(!field.value && "text-muted-foreground")}>
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
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="ageMilestone">Age / Milestone *</Label>
                      <Input id="ageMilestone" type="number" {...register('ageMilestone', { valueAsNumber: true })} />
                    </div>
                  </div>
                )}
                
                {/* Others Fields */}
                {watchedFields.eventType === 'Others' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="eventName">Event Name *</Label>
                      <Input id="eventName" {...register('eventName')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="honoreeNameOther">Honoree Name *</Label>
                      <Input id="honoreeNameOther" {...register('honoreeNameOther')} />
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
        <Button variant="outline" type="button" onClick={handleCancel}>Cancel</Button>
        <div className="flex items-center gap-4">
          <Button variant="secondary" type="button" onClick={saveAsDraft}>Save as Draft</Button>
          <Button type="submit" disabled={!isValid}>Next Step</Button>
        </div>
      </footer>
    </form>
  );
}

const eventTypeOptions: { value: EventType; label: string; icon: React.ElementType }[] = [
  { value: 'Wedding', label: 'Wedding', icon: Users },
  { value: 'Engagement', label: 'Engagement', icon: Star },
  { value: 'Anniversary', label: 'Anniversary', icon: PartyPopper },
  { value: 'Birthday', label: 'Birthday', icon: Cake },
  { value: 'Others', label: 'Others', icon: Milestone },
];
