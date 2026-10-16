import { Card, CardContent } from "@/components/ui/card";
import { formatTitle, getImageByCategory } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

type Props = {
  these: These;
};

const These = ({ these }: Props) => {
  if(!these.ord){
    console.log(these)
  }
  // 
  const integral = `these${
    these.ord < 10 ? "0" + these.ord.toString() : these.ord
  }-${these.year.toString().slice(2)}`;
  return (
    <Link href={`/these/${integral}`}>
      <Card className="hover:shadow-blue-600/80 hover:shadow-md transition-all duration-300">
        <CardContent className="flex items-center  gap-4 p-2">
          <div className="rounded-md">
            <Image
              src={getImageByCategory(
                these?.category?.length === 0 || !these?.category
                  ? "idk"
                  : these?.category?.[these?.category?.length - 1]
              )}
              alt="image"
              width={200}
              height={100}
              className="rounded-md object-cover -sm:h-20 -sm:w-23"
            />
          </div>
          <div className="w-full flex flex-col gap-3 justify-between overflow-hidden p-2">
            <div className="flex flex-col gap-1">
              <h1 className=" overflow-hidden truncate max-h-8 font-bold text-[14px] md:text-lg">
                {these.title}
              </h1>
              <p className="truncate font-bold text-[12px] md:text-base text-blue-600">
                {these?.category?.length === 0 || !these?.category
                  ? "Not Available"
                  : these?.category?.[these?.category?.length - 1]}
              </p>
              <p className="truncate font-medium text-[11px] md:text-sm  text-gray-400">
                Dr. {formatTitle(these.author) || "Not Available"}
              </p>
            </div>
            <div className="min-[564px]:flex-row min-[564px]:self-end flex-col self-start flex gap-1">
              <p className="truncate  text-gray-400  text-sm sm:text-base text-[10px] md:text-sm ">
                Year: <span className=" text-slate-900">{these.year}</span>
              </p>
              <p className="truncate  text-gray-400  text-sm sm:text-base text-[10px] md:text-sm ">
                Ord: <span className=" text-slate-900">{these.ord}</span>
              </p>
              <p className="truncate  text-gray-400  text-sm sm:text-base text-[10px] md:text-sm ">
                Language:{" "}
                <span className=" text-slate-900">
                  {these.langue.includes("(fre)") ? "Fr" : "Eng"}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default These;
