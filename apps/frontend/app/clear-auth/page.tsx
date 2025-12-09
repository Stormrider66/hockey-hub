"use client";

import { useEffect } from "react";
import { clearAuthTokens } from "@/utils/auth";

export default function ClearAuthPage() {
  useEffect(() => {
    clearAuthTokens();
    window.location.href = "/login";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Clearing authentication...</p>
    </div>
  );
}