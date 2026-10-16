"use client";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useDebounce } from "use-debounce";
import CategoryCombobox from "./category-combobox";
import LangComboBox from "./lang-combobox";
import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import YearComboBox from "./year-combobox";
type Props = {
  showOptions: boolean;
};
const SearchInput = ({ showOptions }: Props) => {
  // for route / pathname / params navigation
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // for the transition effect
  const [isPending, startTransition] = useTransition();

  // for search options
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [debouncedSearch] = useDebounce(searchQuery, 750);
  const [showSearchOptions, setShowSearchOptions] =
    useState<boolean>(showOptions);

  // for focusing the input with ctrl + f
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSearchParams = useCallback(
    (debouncedValue: string) => {
      let params = new URLSearchParams(searchParams);

      // test if this is correct
      if (debouncedValue != searchQuery) {
        params.set("page", "1");
      }

      if (debouncedValue.length > 0) {
        params.set("search", debouncedValue);
        // todo find a way to fix the issue that when user is in another page and searches he appears in firstPage
      } else {
        params.delete("search");
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );
  const handleClear = useCallback(() => {
    setShowSearchOptions(false);
    let params = new URLSearchParams(searchParams);
    params.delete("lang");
    params.delete("year");
    params.delete("categ");
    params.delete("page"); // for user to return to 1st page
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }, [pathname, router, searchParams]);

  //! removed this if causes error return to it
  // useEffect(() => {
  //   const params = new URLSearchParams(searchParams);
  //   const searchQuery = params.get("search") ?? "";
  //   setSearchQuery(searchQuery);
  // }, []);

  useEffect(() => {
    handleSearchParams(debouncedSearch);
  }, [debouncedSearch, handleSearchParams]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        if (inputRef.current) inputRef.current.focus();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "s")) {
        e.preventDefault();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  return (
    <div className="flex flex-col mt-32 px-4 sm:px-6 md:px-8">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="flex gap-3 items-center select-none">
          <Loader
            className={cn(
              "animate-none h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20",
              isPending && "animate-spin"
            )}
          />
          <h1 className="font-medium text-4xl sm:text-6xl md:text-7xl">
            These2.0
          </h1>
        </div>
        <p className="text-slate-700 italic font-medium text-sm sm:text-base md:text-lg select-none">
          The best website to research for fmpm thesis for free.
        </p>
        <div className="w-full">
          <div className="flex w-full flex-row items-center">
            <Input
              ref={inputRef}
              placeholder="Search for title, author, category, tag, prof..."
              className="flex-[3] outline-none focus-visible:ring-transparent text-base  border-gray-400 rounded-r-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button className="rounded-l-none block">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {!showSearchOptions && (
            <Button
              variant={"link"}
              size={"sm"}
              onClick={() => setShowSearchOptions(true)}
              className="text-slate-500"
            >
              Search options
            </Button>
          )}
          {showSearchOptions && (
            // search by category / search by year / by lang
            <div className="flex flex-wrap items-center gap-3 py-2">
              <YearComboBox startTransition={startTransition} />
              <CategoryCombobox startTransition={startTransition} />
              <LangComboBox startTransition={startTransition} />
              <Button
                variant={"link"}
                size={"sm"}
                onClick={() => handleClear()}
                className="text-slate-500"
              >
                clear
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchInput;
