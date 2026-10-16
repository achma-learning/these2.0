"use client";

import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, slugify } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { getAllCategories } from "@/actions/get-all-categories";
import { toast } from "sonner";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type categArray = {
  label: string;
  value: string;
};
type Props = {
  startTransition: React.TransitionStartFunction;
};
const CategoryCombobox = ({ startTransition }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [categories, setCategories] = useState<categArray[]>([]);
  const [error, setError] = useState<any>();

  useEffect(() => {
    startTransition(() => {
      getAllCategories().then((response) => {
        if (response?.success) {
          const categArray: categArray[] = response.categories.map((item) => {
            return {
              label: item.category,
              value: slugify(item.category),
            };
          });
          setCategories(categArray);
        } else {
          setError(response?.error);
          toast.error(response.error?.message);
        }
      });
    });
  }, []);

  const updateParams = useCallback(
    (currentValue: string) => {
      let params = new URLSearchParams(Array.from(searchParams.entries()));
      if (currentValue === "") {
        params.delete("categ");
      } else {
        params.set("categ", currentValue);
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams, startTransition]
  );

  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    const categQuery = params.get("categ") ?? "";
    if (
      categories.length !== 0 &&
      categories.map((item) => slugify(item.value)).includes(categQuery)
    ) {
      setValue(categQuery);
    } else {
      setValue("");
    }
  }, [categories]);

  if (error) {
    // todo make an error page
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[240px] justify-between "
        >
          {value
            ? categories.find((categ) => categ.value === value)?.label
            : "Select a category..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <ScrollArea className="h-60  rounded-md border">
            <CommandGroup>
              {categories.map((categ) => (
                <CommandItem
                  key={categ.value}
                  value={categ.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                    updateParams(currentValue === value ? "" : currentValue);
                  }}
                >
                  {categ.label}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === categ.value ? "opacity-100" : "opacity-0"
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

export default CategoryCombobox;
