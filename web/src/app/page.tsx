"use client";

import { useEffect, useState } from "react";
import Intro, { INTRO_END_MS } from "@/components/intro";
import HomeView from "@/components/home-view";
import StudyView from "@/components/study-view";

type Phase = "intro" | "home" | "study";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intro");

  useEffect(() => {
    const t = setTimeout(() => setPhase("home"), INTRO_END_MS);
    return () => clearTimeout(t);
  }, []);

  if (phase === "intro") return <Intro />;
  if (phase === "home") return <HomeView onLearn={() => setPhase("study")} />;
  return <StudyView onBack={() => setPhase("home")} />;
}
