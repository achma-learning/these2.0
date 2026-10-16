"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  TransitionStartFunction,
  useCallback,
  useEffect,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowDown01,
  ArrowDownAZ,
  ArrowUp01,
  ArrowUpAZ,
  CheckIcon,
  ChevronDown,
} from "lucide-react";

import { cn, isPartOfSort } from "@/lib/utils";

const sortOptions = [
  {
    label: "Order Asc",
    icon: ArrowUp01,
    value: "",
  },
  {
    label: "Order Desc",
    icon: ArrowDown01,
    value: "orderDesc",
  },
  {
    label: "Title Asc",
    icon: ArrowUpAZ,
    value: "titleAsc",
  },
  {
    label: "Title Desc",
    icon: ArrowDownAZ,
    value: "titleDesc",
  },
  {
    label: "Author Asc",
    icon: ArrowUpAZ,
    value: "authorAsc",
  },
  {
    label: "Author Desc",
    icon: ArrowDownAZ,
    value: "authorDesc",
  },
];

const SortBy = () => {
  // const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<sort>("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (currentValue: sort) => {
      let params = new URLSearchParams(Array.from(searchParams.entries()));
      params.delete("page"); // if user presses sort in another page return to page 1
      if (currentValue === "") {
        params.delete("sortBy");
      } else {
        params.set("sortBy", currentValue);
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  // EFFECT: Set Initial Params
  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    const searchQuery = params.get("sortBy") ?? "";
    if (isPartOfSort(searchQuery)) {
      setSortBy(searchQuery as sort);
    } else {
      setSortBy("");
    }
  }, []);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="ml-auto flex text items-center gap-1"
          aria-expanded={open}
        >
          Sorted By: {sortOptions.find((item) => item.value === sortBy)?.label}{" "}
          <ChevronDown className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {sortOptions.map(({ label, icon: Icon, value }) => (
                <CommandItem
                  key={value}
                  onSelect={() => {
                    setSortBy(value as sort);
                    setOpen(false);
                    updateParams(value as sort);
                  }}
                >
                  <Icon className="mr-2 h-5 w-5" />
                  <span>{label}</span>
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      sortBy === (value as sort) ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SortBy;
