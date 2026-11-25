import type { ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  return <><div className="route-pulse" aria-hidden="true" />{children}</>;
}
