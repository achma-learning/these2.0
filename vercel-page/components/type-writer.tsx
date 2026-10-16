"use client";
import Typewriter from "typewriter-effect";

type Props = {};

const TypeWriter = (props: Props) => {
  return (
    <Typewriter
      options={{
        loop: true,
        cursor: "_",
      }}
      onInit={(typewriter) => {
        typewriter
          .typeString("Explore theses 💫")
          .pauseFor(1000)
          .deleteAll()
          .typeString("Combined searching 🌟")
          .pauseFor(1000)
          .deleteAll()
          .typeString("Fast results 🪄")
          .pauseFor(1000)
          .deleteAll()
          .typeString("Live updates 🔵")
          .pauseFor(1000)
          .deleteAll()
          .typeString("2000+ theses 📑")
          .pauseFor(1000)
          .deleteAll()
          .start();
      }}
    />
  );
};

export default TypeWriter;
