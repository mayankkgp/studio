"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useNavigation, type CaptionProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function CustomCaption(props: CaptionProps) {
  const { goToMonth, nextMonth, previousMonth } = useNavigation();
  
  return (
    <div className="flex justify-between items-center w-full pt-1 px-1">
      <Button
        variant="outline"
        className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        type="button"
        disabled={!previousMonth}
        onClick={() => previousMonth && goToMonth(previousMonth)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1 flex justify-center items-center h-10">
        {props.children}
      </div>
      <Button
        variant="outline"
        className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        type="button"
        disabled={!nextMonth}
        onClick={() => nextMonth && goToMonth(nextMonth)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        
        // FIX: w-fit ensures the container matches the grid width
        month: "space-y-4 relative w-fit mx-auto", 
        
        month_caption: "flex justify-center items-center h-10",
        caption_label: "text-sm font-medium hidden",
        dropdowns: "flex justify-center gap-1 items-center z-10",
        
        month_grid: "w-auto mx-auto border-collapse space-y-1",
        weekdays: "flex w-fit mx-auto",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
        week: "flex w-fit mt-2 mx-auto",
        day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].range_end)]:rounded-r-md [&:has([aria-selected].outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        range_end: "range_end",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside:
          "outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        dropdown: "bg-background border rounded px-2 text-sm outline-none h-8 cursor-pointer hover:bg-accent transition-colors",
        months_dropdown: "flex-1",
        years_dropdown: "flex-1",
        dropdown_root: "flex gap-1 items-center",
        ...classNames,
      }}
      components={{
        Caption: CustomCaption,
      }}
      captionLayout="dropdown"
      fromYear={1900}
      toYear={2100}
      hideNavigation
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
