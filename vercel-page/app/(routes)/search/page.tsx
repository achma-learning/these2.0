import { getTheses } from "@/actions/get-theses";
import QueryListing from "@/components/query-listing";
import QueryPagination from "@/components/query-pagination";
import SearchInput from "@/components/searchInput";
import { getSearchParams } from "@/lib/utils";
import { writeFileSync } from "fs";
import { Metadata } from "next";

type Props = {
  searchParams: searchParams;
};

export const metadata: Metadata = {
  title: "These2.0 | Search",
  description: "Search for title, author, category, tag, prof...",
};
const page = async ({ searchParams }: Props) => {
  const { categ, lang, search, sort, year, page } = await getSearchParams(
    searchParams
  );
  const isShowOptions = !!categ || !!lang || !!year;

  const { pageData, totalPages, totalTheses } =
    await getTheses({
      searchParams: { search: search, category: categ, langue: lang, year },
      nbPerPage: 50,
      page: page,
      sort: sort,
    });

  return (
    // todo fix this bug where if user searches for something in page nth n!== 1 with search different than prv return to page 1
    <div className="h-full flex flex-col max-w-7xl m-auto">
      <SearchInput showOptions={isShowOptions} />

      <QueryListing
        data={pageData}
        totalPages={totalPages}
        currentPage={page}
        totalTheses={totalTheses}
      />

      <div className="mb-4 mt-6 px-8">
        {totalPages !== 1 && (
          <QueryPagination currentPage={page} totalPages={totalPages} />
        )}
      </div>
    </div>
  );
};

export default page;
