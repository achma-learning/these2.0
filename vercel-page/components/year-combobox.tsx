"use client";

import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, isPartOfNumberRange } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const currentYear = new Date().getFullYear();
const startYear = 2006;
const years = Array.from(
  { length: currentYear - startYear + 1 },
  (_, index) => {
    const year = startYear + index;
    return { value: year.toString(), label: year.toString() };
  }
).reverse();
type Props = {
  startTransition:React.TransitionStartFunction
}
const YearComboBox = ({startTransition}:Props) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const year = params.get("year");
    // if(year)
    if(year && !years.some((item) => item.value === year)){
      return
    }
    setValue(year as string)
  }, []);

  const updateParams = useCallback(
    (currentValue: string) => {
      let params = new URLSearchParams(Array.from(searchParams.entries()));
      if (currentValue === "") {
        params.delete("year");
      } else {
        params.set("year", currentValue);
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams, startTransition]
  );
  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    const yearQuery = params.get("year") ?? "";
    if (isPartOfNumberRange(Number(yearQuery))) {
      setValue(yearQuery);
    } else {
      setValue("");
    }
  }, []);



  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? years.find((year) => year.value === value)?.label
            : "Select a year..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <ScrollArea className="h-60  rounded-md border">
            <CommandGroup>
              {years.map((year) => (
                <CommandItem
                  key={year.value}
                  value={year.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                    updateParams(currentValue === value ? "" : currentValue);

                  }}
                >
                  {year.label}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === year.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default YearComboBox;
