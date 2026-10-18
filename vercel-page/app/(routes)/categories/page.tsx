import { getAllCategories } from "@/actions/get-all-categories";
import { getLocalData } from "@/actions/load-data";
import SpecialitesSection from "@/components/specialites-section";
import CategoryCardsLister from "@/components/category-cards-lister";
import Loader from "@/components/loader";
import { Metadata } from "next";
import { Suspense } from "react";

type Props = {};

export const metadata: Metadata = {
  title: "These2.0 | Categories",
  description: "Spécialités officielles de la FMPM et catégories de la bibliothèque",
};
const Page = async (props: Props) => {
  const { categories,error } = await getAllCategories();
  // number of theses per official specialty (These.specialite, set by scripts/specialites.py)
  const counts: Record<string, number> = {};
  let unclassified = 0;
  for (const t of (await getLocalData()).data) {
    if (t.specialite && t.specialite !== "Non classée") counts[t.specialite] = (counts[t.specialite] || 0) + 1;
    else unclassified++;
  }

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
    <div className="px-8 py-12 space-y-10">
      <SpecialitesSection counts={counts} unclassified={unclassified} />
      <h2 className="font-semibold text-2xl text-neutral-800">Catégories de la bibliothèque</h2>
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
