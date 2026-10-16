import TypeWriter from "@/components/type-writer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Facebook from "@/components/icons/facebook";
import Link from "next/link";
import Instagram from "@/components/icons/instagram";

export default function Home() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-72">
      <div className="mb-4 flex justify-center">
        <Link
          href={"mailto:akram.ammour.mail@gmail.com?subject=From%20these2.0"}
        >
          <Badge className="text-sm text-[13px] leading-6">
            🎉 Made with love 💖 by Akram Ammour
          </Badge>
        </Link>
      </div>
      <h1 className="font-semibold text-4xl md:text-6xl  lg:text-7xl text-center min-w-20">
        A <span className="text-blue-600 font-bold">Free Thesis</span>
        <br />
        app.
      </h1>
      <h2 className="mt-4 font-semibold text-xl md:text-3xl text-center text-slate-700">
        <TypeWriter />
      </h2>
      <div className="mt-8 flex justify-center">
        <Link href="/search">
          <Button className="bg-blue-600">
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" strokeWidth={3} />
          </Button>
        </Link>
      </div>
      <div className="mt-8 flex justify-center gap-4">
        <Link href="https://web.facebook.com/akram.ammour.9/" target="_blank">
          <Facebook width={35} height={35} />
        </Link>
        <Link
          href="https://www.instagram.com/akram_ammour.exe/"
          target="_blank"
        >
          <Instagram width={35} height={35} />
        </Link>
      </div>
    </div>
  );
}
