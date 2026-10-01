"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export interface BackendStatusState {
  isConnected: boolean;
  serviceName?: string;
  error?: string;
  isLoading: boolean;
}

export function useBackendStatus() {
  const [status, setStatus] = useState<BackendStatusState>({
    isConnected: false,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      try {
        const response = await api.getHealth();
        if (isMounted) {
          setStatus({
            isConnected: response.status === "ok",
            serviceName: response.service,
            isLoading: false,
          });
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to connect to backend";
          setStatus({
            isConnected: false,
            error: message,
            isLoading: false,
          });
        }
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return status;
}
