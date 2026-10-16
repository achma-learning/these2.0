import { cn } from "@/lib/utils";
import Image from "next/image";

type Props = {
  width?: number;
  height?: number;
  className?: string | undefined;
};

const Loader = ({ width = 70, height = 70, className }: Props) => {
  return (
    <Image
      src={"/loader.svg"}
      priority
      width={width}
      height={height}
      alt="logo loading"
      className={cn("animate-spin select-none", className)}
    />
  );
};

export default Loader;
