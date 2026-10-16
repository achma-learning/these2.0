import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { slugify } from "@/lib/utils";

import Image from "next/image";
import Link from "next/link";

import { getBase64 } from "@/actions/get-base64";

type Props = {
  category: Category;
  priority:boolean
};

const CategoryCard = async ({ category,priority }: Props) => {
  const slug = slugify(category.category);
  const myBlurDataUrl = await getBase64(category.image as string)

  return (
    <Link href={`/search?categ=${slug}`}>
      <Card className="bg-transparent border-none hover:border hover:bg-blue-600/10 transition-colors duration-300">
        <CardContent className="p-2">
          <AspectRatio ratio={4 / 3} className="bg-muted rounded-md">
            <Image
              src={category.image!}
              alt={category.category}
              fill
              className="rounded-md object-cover"
              placeholder="blur"
              blurDataURL={myBlurDataUrl}
              priority={priority}
            />
          </AspectRatio>
        </CardContent>
        <CardFooter>
          <h1 className="text-base font-medium">{category.category}</h1>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default CategoryCard;
