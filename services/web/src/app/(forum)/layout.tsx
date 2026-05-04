"use client";

import { ReactNode } from "react";
import ForumRouteTransition from "./ForumRouteTransition";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function ForumLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <ForumRouteTransition>{children}</ForumRouteTransition>
    </ProtectedRoute>
  );
}
