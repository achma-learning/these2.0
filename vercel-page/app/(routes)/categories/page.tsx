import { getAllCategories } from "@/actions/get-all-categories";
import CategoryCardsLister from "@/components/category-cards-lister";
import Loader from "@/components/loader";
import { Metadata } from "next";
import { Suspense } from "react";

type Props = {};

export const metadata: Metadata = {
  title: "These2.0 | Categories",
  description: "Our selection of categories...",
};
const Page = async (props: Props) => {
  const { categories,error } = await getAllCategories();

  if (error) {
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ">
        <p className="text-lg min-w-40">
          This is an Error contact us we would like it if we received your
          feedback{": "}
          <a
            href={`mailto:akram.ammour.mail@gmail.com?subject=From%20these2.0&body=error from getAllCategories() with the error ${JSON.stringify(
              error
            )}`}
            className="font-bold underline"
          >
            Learn more
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="px-8 py-12">
      <Suspense
        fallback={
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Loader />
          </div>
        }
      >
        <CategoryCardsLister categories={categories} />
      </Suspense>
    </div>
  );
};

export default Page;
