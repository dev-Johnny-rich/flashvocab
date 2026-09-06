"use client";

import { useEffect, useState } from "react";
import Intro, { INTRO_END_MS } from "@/components/intro";
import HomeView from "@/components/home-view";
import StudyView from "@/components/study-view";
import ReviewView from "@/components/review-view";

type Phase = "intro" | "home" | "study" | "review";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intro");

  useEffect(() => {
    const t = setTimeout(() => setPhase("home"), INTRO_END_MS);
    return () => clearTimeout(t);
  }, []);

  const goHome = () => setPhase("home");
  const goStudy = () => setPhase("study");

  if (phase === "intro") return <Intro />;
  if (phase === "home")
    return (
      <HomeView onLearn={goStudy} onReview={() => setPhase("review")} />
    );
  if (phase === "study") return <StudyView onBack={goHome} />;
  return <ReviewView onBack={goHome} onLearn={goStudy} />;
}
