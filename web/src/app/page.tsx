"use client";

import { useEffect, useState } from "react";
import Intro, { INTRO_END_MS } from "@/components/intro";
import HomeView from "@/components/home-view";
import StudyView from "@/components/study-view";
import ReviewView from "@/components/review-view";
import AboutView from "@/components/about-view";
import { loadCurrentBook, saveCurrentBook } from "@/lib/storage";
import type { BookId } from "@/lib/books";

type Phase = "intro" | "home" | "study" | "review" | "about";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [book, setBook] = useState<BookId>(() => loadCurrentBook());

  useEffect(() => {
    const t = setTimeout(() => setPhase("home"), INTRO_END_MS);
    return () => clearTimeout(t);
  }, []);

  const goHome = () => setPhase("home");
  const goStudy = (b: BookId) => {
    setBook(b);
    setPhase("study");
  };

  if (phase === "intro") return <Intro />;
  if (phase === "home")
    return (
      <HomeView
        currentBook={book}
        onLearnBook={goStudy}
        onReview={() => setPhase("review")}
        onAbout={() => setPhase("about")}
      />
    );
  if (phase === "study")
    return (
      <StudyView
        key={book}
        bookId={book}
        onBack={goHome}
        onSwitchBook={setBook}
      />
    );
  if (phase === "review")
    return (
      <ReviewView
        key={book}
        bookId={book}
        onBack={goHome}
        onLearn={() => setPhase("study")}
        onSwitchBook={setBook}
      />
    );
  return <AboutView onBack={goHome} />;
}
