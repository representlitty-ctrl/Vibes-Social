import { useEffect } from "react";
import { useAuth } from "./use-auth";
import { apiRequest } from "@/lib/queryClient";

const HEARTBEAT_INTERVAL = 60000; // Send heartbeat every 60 seconds

export function useHeartbeat() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const sendHeartbeat = async () => {
      try {
        await apiRequest("POST", "/api/users/heartbeat");
      } catch {
        // Silently fail - heartbeat is not critical
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval for periodic heartbeats
    const intervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [user]);
}
