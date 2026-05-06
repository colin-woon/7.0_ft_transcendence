"use client";

import type { ReactNode } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function LabLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
        {children}
      </>
    </ProtectedRoute>
  );
}
