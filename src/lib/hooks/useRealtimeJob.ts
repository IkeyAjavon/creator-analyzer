"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Job } from "@/types/database";

export function useRealtimeJob(jobId: string | null) {
  const [job, setJob] = useState<Job | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }

    const supabase = createClient();

    // Fetch job status
    const fetchJob = async () => {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();
      if (data) setJob(data as Job);
    };

    // Initial fetch
    fetchJob();

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

    // Polling fallback every 3 seconds in case realtime drops
    intervalRef.current = setInterval(() => {
      fetchJob();
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [jobId]);

  // Stop polling once job is complete or failed
  useEffect(() => {
    if (job && (job.status === "complete" || job.status === "failed")) {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [job?.status]);

  return job;
}
