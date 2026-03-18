"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Job } from "@/types/database";

export function useRealtimeJob(jobId: string | null) {
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const supabase = createClient();

    // Initial fetch
    supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single()
      .then(({ data }) => {
        if (data) setJob(data as Job);
      });

    // Realtime subscription
    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          setJob(payload.new as Job);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  return job;
}
