"use client";

import { DirectoryPage } from "@/features/directory";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function Home() {
  return (
    <ProtectedRoute>
      <DirectoryPage />
    </ProtectedRoute>
  );
}
