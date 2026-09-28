import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  dashboard: ["dashboard"] as const,
  analytics: ["analytics"] as const,
  jobs: (filters: unknown) => ["jobs", filters] as const,
  job: (id: number | string) => ["job", id] as const,
  applications: (filters?: unknown) => ["applications", filters] as const,
  application: (id: number | string) => ["application", id] as const,
  companies: (filters?: unknown) => ["companies", filters] as const,
  company: (id: number | string) => ["company", id] as const,
  contacts: (filters?: unknown) => ["contacts", filters] as const,
  resumes: ["resumes"] as const,
  resume: (id: number | string) => ["resume", id] as const,
  interviews: (filters?: unknown) => ["interviews", filters] as const,
  interview: (id: number | string) => ["interview", id] as const,
  tasks: (filters?: unknown) => ["tasks", filters] as const,
  notes: (type: string, id: number) => ["notes", type, id] as const,
  analysis: (jobId: number) => ["ai", "analysis", jobId] as const,
  match: (jobId: number, resumeId?: number) => ["ai", "match", jobId, resumeId ?? null] as const,
  prep: (jobId: number) => ["ai", "prep", jobId] as const,
  suggestions: (jobId: number) => ["ai", "suggestions", jobId] as const,
  aiStatus: ["ai", "status"] as const,
};
