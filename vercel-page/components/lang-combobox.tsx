"use client";

import {
  TransitionStartFunction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { ChevronsUpDown, CheckIcon } from "lucide-react";

import { cn, isPartOfCategories } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const Languages = [
  {
    label: "Francais",
    value: "fr",
  },
  {
    label: "Anglais",
    value: "eng",
  },
];
type Props = {
  startTransition: TransitionStartFunction;
};
const LangComboBox = ({ startTransition }: Props) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (currentValue: string) => {
      let params = new URLSearchParams(Array.from(searchParams.entries()));
      if (currentValue === "") {
        params.delete("lang");
      } else {
        params.set("lang", currentValue);
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams, startTransition]
  );

  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    const langQuery = params.get("lang") ?? "";
    if (["fr", "eng"].includes(langQuery)) {
      setValue(langQuery);
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
            ? Languages.find((lang) => lang.value === value)?.label
            : "Select a Lang..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <ScrollArea className="h-20  rounded-md border">
            <CommandGroup>
              {Languages.map((lang) => (
                <CommandItem
                  key={lang.value}
                  value={lang.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                    updateParams(currentValue === value ? "" : currentValue);
                  }}
                >
                  {lang.label}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === lang.value ? "opacity-100" : "opacity-0"
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

export default LangComboBox;
