"use client";

import { formatTitle } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Loader from "./loader";
import PdfFullScreen from "./pdf-full-screen";

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import { useResizeDetector } from "react-resize-detector";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

type Props = {
  href: string;
  title: string;
};

const PdfRenderer = ({ title, href }: Props) => {
  const { width, ref, height } = useResizeDetector();
  return (
    <div className="min-w-[280px] h-[540px]  sm:min-w-[350px]">
      <div className="flex flex-col gap-2 w-full h-full">
        <div className="p-2 shadow-sm border-[1px] rounded-md flex items-center justify-between">
          <p className="font-semibold text-neutral-800">{formatTitle(title)}</p>
          <PdfFullScreen href={href} title={title} />
        </div>
        <div className="w-full overflow-hidden rounded-lg border-[1px]">
          <div ref={ref} className="h-full w-full  ">
            <Document
              loading={
                <div className="min-h-[420px] w-full flex items-center justify-center">
                  <Loader className="h-12 w-12" />
                </div>
              }
              onLoadError={(e) => {
                toast.error("Missing pdf", {
                  description:
                    "Couldn't locate pdf file in server. check your wifi.",
                });
                // console.log(e);
              }}
              error={
                <div className="min-h-[420px] w-full flex flex-col items-center justify-center">
                  <Loader className="h-12 w-12 animate-none" />
                  <p>pdf error :(</p>
                  {/* <p>pdf not found :(</p> */}
                </div>
              }
              file={href}
              className="max-h-full"
            >
              <Page pageNumber={1} width={width ? width : 1} />
            </Document>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfRenderer;
