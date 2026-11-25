import { Suspense } from "react";
import { getCourseLevels } from "@/lib/typing/texts";
import LessonPage from "./lesson";

export function generateStaticParams() {
  return (["ru", "en"] as const).flatMap((layout) =>
    getCourseLevels(layout).map(({ level }) => ({ layout, level: String(level) }))
  );
}

export default function Page({ params }: { params: Promise<{ layout: string; level: string }> }) {
  return <Suspense fallback={null}><LessonPage params={params} /></Suspense>;
}
