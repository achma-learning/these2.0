import SortBy from "./sort-by";
import These from "./these";

type Props = {
  data: These[];
  currentPage: number;
  totalTheses: number;
  totalPages: number;
};

const QueryListing = ({
  data,
  currentPage,
  totalPages,
  totalTheses,
}: Props) => {
  return (
    <>
      <SortBy />
      <p className="px-8 font-medium text-slate-700 text-base">
        page{" "}
        <span className="text-blue-600 font-bold">
          {totalTheses === 0 ? "1" : currentPage}
        </span>{" "}
        / {totalPages} (
        {totalTheses === 0 ? "0 results found" : `${totalTheses} results found`}
        )
      </p>
      <div className="mt-6 px-4 sm:px-6 md:px-8 flex flex-col gap-4">
        {data.map((these, index) => (
          <These key={index} these={these} />
        ))}
      </div>
    </>
  );
};

export default QueryListing;
