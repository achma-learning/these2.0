"use client";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import PdfRenderer from "./pdf-renderer";
import { Card, CardContent } from "./ui/card";
import { getProfName, slugify } from "@/lib/utils";
import { Fragment } from "react";

type Props = {
  these: These;
};

const TheseCard = ({ these }: Props) => {
  const params = useParams<{ theseId: string }>();
  const title = params.theseId;
  return (
    <Card className="  border-[1px] rounded-lg  overflow-hidden">
      <CardContent className="flex gap-7 p-5 flex-col lg:flex-row">
        <PdfRenderer href={"/api/get-pdf?url=" + these.href} title={title} />
        <div className="w-full   text-wrap p-4 flex-1 flex flex-col space-y-3 text-sm">
          <p className="text-gray-400 font-semibold">Title</p>
          <p className="font-medium">{these.title}</p>

          <p className="text-gray-400 font-semibold">Author</p>
          <p className="font-medium">
            {these.author || "author name not in Database"}
          </p>

          <p className="text-gray-400 font-semibold">Category</p>
          <p className="font-medium">
            {these.category
              ? these.category.map((cat, index) =>
                  index === these.category?.length! - 1 ? (
                    <Link
                      href={`/search?categ=${slugify(cat)}`}
                      className="text-blue-600 font-bold hover:underline"
                      key={index} // Add a unique key for each element in the map
                    >
                      {cat}
                    </Link>
                  ) : (
                    <span key={index}>
                      {" "}
                      {/* Add a unique key for each element in the map */}
                      {cat} {" > "}
                    </span>
                  )
                )
              : "Not Available"}
          </p>

          <p className="text-gray-400 font-semibold">President</p>
          <Link
            href={`/search?search=${getProfName(these.president)}`}
            className="text-blue-600 font-bold hover:underline"
          >
            {these.president}
          </Link>

          <p className="text-gray-400 font-semibold">Rapporteur</p>
          <Link
            href={`/search?search=${getProfName(these.rapporteur)}`}
            className="text-blue-600 font-bold hover:underline"
          >
            {these.rapporteur}
          </Link>

          <p className="text-gray-400 font-semibold">Jury</p>
          <p className="font-medium">
            {these.jury
              ? these.jury.map((prof, index) => (
                  <Fragment key={index}>
                    <Link
                      href={`/search?search=${getProfName(prof)}`}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      {prof}
                    </Link>
                    {index + 1 !== these.jury.length && (
                      <span key={`separator-${index}`}> - </span>
                    )}
                  </Fragment>
                ))
              : "Not Available"}
          </p>

          {these.membreAssocie && (
            <>
              <p className="text-gray-400 font-semibold">Associated Members</p>
              <p className="font-medium">
                {these.membreAssocie.map((mb, index) => (
                  <Fragment key={index}>
                    <Link
                      href={`/search?search=${getProfName(mb)}`}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      {mb}
                    </Link>
                    {index + 1 !== these.membreAssocie!.length && (
                      <span key={`separator-${index}`}> - </span>
                    )}
                  </Fragment>
                ))}
              </p>
            </>
          )}

          <p className="text-gray-400 font-semibold">Tags</p>
          <p className="font-medium">
            {these.tags
              ? these.tags.map((tag, index) => (
                  <Fragment key={index}>
                    <Link
                      href={`/search?search=${tag}`}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      {tag}
                    </Link>
                    {these.tags && index + 1 !== these.tags.length && (
                      <span key={`separator-${index}`}> - </span>
                    )}
                  </Fragment>
                ))
              : "Not Available"}
          </p>

          <p className="text-gray-400 font-semibold">Link</p>
          <Link
            href={these.href}
            target={"_blank"}
            className="text-primary underline-offset-4 hover:underline font-medium truncate"
          >
            {these.href}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default TheseCard;
