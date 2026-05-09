"use client";

import { useState } from "react";
import {
  requestGoogleToken,
  revokeToken,
  hasToken,
  type GoogleScope,
} from "@/lib/api/google-auth";

export function useGoogleAuth(scope: GoogleScope) {
  const [isConnected, setIsConnected] = useState(() => hasToken(scope));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setIsLoading(true);
    setError(null);
    try {
      await requestGoogleToken(scope);
      setIsConnected(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Google認証に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  }

  function disconnect() {
    revokeToken(scope);
    setIsConnected(false);
  }

  return { isConnected, isLoading, error, connect, disconnect };
}
