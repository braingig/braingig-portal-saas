import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useDeviceActivity(projectId: string | null, taskId: string | null) {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(true);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActiveRef = useRef<number>(Date.now());
  
  const IDLE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

  useEffect(() => {
    if (!user) return;

    const logActivity = async (status: 'active' | 'idle', duration: number) => {
      if (duration < 5) return; // ignore sub-5 second sessions to avoid spam
      
      await supabase.from("device_activity").insert({
        user_id: user.id,
        project_id: projectId,
        task_id: taskId,
        status,
        duration_seconds: Math.floor(duration / 1000)
      });
    };

    const handleActivity = () => {
      if (!isActive) {
        // Was idle, now active. Log the idle time.
        const now = Date.now();
        const idleDuration = now - lastActiveRef.current;
        logActivity('idle', idleDuration);
        lastActiveRef.current = now;
        setIsActive(true);
      } else {
        lastActiveRef.current = Date.now();
      }

      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }

      idleTimeoutRef.current = setTimeout(() => {
        // Became idle. Log the active time.
        const now = Date.now();
        const activeDuration = now - lastActiveRef.current;
        logActivity('active', activeDuration);
        lastActiveRef.current = now;
        setIsActive(false);
      }, IDLE_THRESHOLD_MS);
    };

    // Initialize first timeout
    handleActivity();

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("click", handleActivity);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("click", handleActivity);
      
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      
      // Log final session on unmount
      const now = Date.now();
      const duration = now - lastActiveRef.current;
      logActivity(isActive ? 'active' : 'idle', duration);
    };
  }, [user, projectId, taskId, isActive]);

  return { isActive };
}
