"use client";

import { ReactNode } from "react";
import ForumRouteTransition from "./ForumRouteTransition";

export default function MainLayout({ children }: { children: ReactNode }) {
  return <ForumRouteTransition>{children}</ForumRouteTransition>;
}
