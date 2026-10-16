import { getLocalData } from "@/actions/load-data";
import TheseCard from "@/components/these-card";
import { Separator } from "@/components/ui/separator";
import { formatTitle } from "@/lib/utils";
import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";

type Props = {
  params: {
    theseId: string;
  };
};
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return {
    title: `these2.0 | ${formatTitle(params.theseId)}`,
  };
}
const Page = async ({ params: { theseId } }: Props) => {
  const isMatch = theseId.match(/^these(\d+)-(\d+)$/);

  if (!isMatch) {
    return redirect("/");
  }

  const { data } = await getLocalData();
  const found = data.find((item) => item.href.includes(theseId));
  if (!found) {
    return redirect("/search");
  }
  return (
    <div className="h-full  py-12 px-8 sm:px-12 md:px-20 lg:px-32 ">
      <div className="space-y-4">
        <p className="font-semibold text-3xl text-neutral-800">
          {`Dr. ${formatTitle(found.author)}`}
        </p>
        <Separator />
        <TheseCard these={found} />
      </div>
    </div>
  );
};

export default Page;
