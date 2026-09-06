"use client";

import { useEffect, useState } from "react";
import Intro, { INTRO_END_MS } from "@/components/intro";
import StudyView from "@/components/study-view";

export default function Home() {
  const [phase, setPhase] = useState<"intro" | "study">("intro");

  useEffect(() => {
    const t = setTimeout(() => setPhase("study"), INTRO_END_MS);
    return () => clearTimeout(t);
  }, []);

  return phase === "intro" ? <Intro /> : <StudyView />;
}
