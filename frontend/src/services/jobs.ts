import { api } from "@/lib/api";
import type { Job, JobPayload, Page } from "@/types";

export interface JobQuery {
  q?: string;
  status?: string[];
  priority?: string[];
  remote_type?: string[];
  employment_type?: string[];
  company_id?: number;
  date_from?: string;
  date_to?: string;
  sort?: string;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export const jobsApi = {
  async list(query: JobQuery = {}): Promise<Page<Job>> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) value.forEach((item) => params.append(key, String(item)));
      else params.set(key, String(value));
    });
    const { data } = await api.get<Page<Job>>(`/jobs?${params.toString()}`);
    return data;
  },

  async get(id: number): Promise<Job> {
    const { data } = await api.get<Job>(`/jobs/${id}`);
    return data;
  },

  async create(payload: JobPayload): Promise<Job> {
    const { data } = await api.post<Job>("/jobs", payload);
    return data;
  },

  async update(id: number, payload: Partial<JobPayload>): Promise<Job> {
    const { data } = await api.patch<Job>(`/jobs/${id}`, payload);
    return data;
  },

  async updateStatus(id: number, status: string): Promise<Job> {
    const { data } = await api.patch<Job>(`/jobs/${id}/status`, { status });
    return data;
  },

  async updatePriority(id: number, priority: string): Promise<Job> {
    const { data } = await api.patch<Job>(`/jobs/${id}/priority`, { priority });
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/jobs/${id}`);
  },
};
