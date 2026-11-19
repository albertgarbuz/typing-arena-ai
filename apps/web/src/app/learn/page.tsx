"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CourseMap } from "@/components/typing/course-map";
import type { Layout } from "@/lib/typing/types";

export default function LearnPage() {
  const [layout, setLayout] = useState<Layout>("ru");

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="learn-page-main">
        <div className="layout-container learn-page-shell">
          <CourseMap layout={layout} onLayoutChange={setLayout} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
