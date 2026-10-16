import { cn } from "@/lib/utils";
import Link from "next/link";
import { ComponentPropsWithRef, PropsWithChildren } from "react";

type Props = {
  text: String;
} & PropsWithChildren<ComponentPropsWithRef<"p">>;

const Logo = ({ text, className, ...rest }: Props) => {
  return (
    <Link href={"/"}>
      <h1
        className={cn(
          "text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent",
          className
        )}
        {...rest}
      >
        {text}
      </h1>
    </Link>
  );
};

export default Logo;
