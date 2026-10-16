"use client";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
type Props = {
  currentPage: number;
  totalPages: number;
};
const QueryPagination = ({ currentPage, totalPages }: Props) => {
  const isPrevDisabled = currentPage === 1;
  const isNextDisabled = totalPages === currentPage;

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const paginate = useCallback(
    (where: "prev" | "next") => {
      const params = new URLSearchParams(searchParams.toString());
      if (where === "prev") {
        if (isPrevDisabled) return;
        params.set("page", `${currentPage - 1}`);
      } else if (where === "next") {
        if (isNextDisabled) return;
        params.set("page", `${currentPage + 1}`);
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [currentPage]
  );

  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    let page = params.get("page") ?? 1;
    page = Number(page);

    if (page < 1 || page > totalPages) {
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [currentPage,totalPages,searchParams,router,pathname]);
  return (
    <Pagination>
      <PaginationContent className="flex items-center justify-between w-full">
        <PaginationItem>
          <PaginationPrevious
            onClick={() => paginate("prev")}
            isActive={!isPrevDisabled}
            className={cn(
              "cursor-pointer",
              isPrevDisabled && "opacity-55 select-none cursor-not-allowed"
            )}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            onClick={() => paginate("next")}
            isActive={!isNextDisabled}
            className={cn(
              "cursor-pointer",
              isNextDisabled && "opacity-55 select-none cursor-not-allowed"
            )}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default QueryPagination;
