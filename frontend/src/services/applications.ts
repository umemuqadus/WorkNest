import { api } from "@/lib/api";
import type {
  Application,
  ApplicationDetail,
  ApplicationStatus,
  Page,
} from "@/types";

export interface ApplicationPayload {
  job_id: number;
  status?: ApplicationStatus;
  source?: string | null;
  cover_letter?: string | null;
  referral?: string | null;
  notes?: string | null;
  applied_at?: string | null;
}

export const applicationsApi = {
  async list(query: { status?: string[]; job_id?: number; limit?: number } = {}): Promise<
    Page<Application>
  > {
    const params = new URLSearchParams();
    if (query.status?.length) query.status.forEach((s) => params.append("status", s));
    if (query.job_id) params.set("job_id", String(query.job_id));
    params.set("limit", String(query.limit ?? 100));
    const { data } = await api.get<Page<Application>>(`/applications?${params}`);
    return data;
  },

  async get(id: number): Promise<ApplicationDetail> {
    const { data } = await api.get<ApplicationDetail>(`/applications/${id}`);
    return data;
  },

  async create(payload: ApplicationPayload): Promise<ApplicationDetail> {
    const { data } = await api.post<ApplicationDetail>("/applications", payload);
    return data;
  },

  async update(
    id: number,
    payload: Partial<Omit<ApplicationPayload, "job_id">>,
  ): Promise<ApplicationDetail> {
    const { data } = await api.patch<ApplicationDetail>(`/applications/${id}`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/applications/${id}`);
  },
};
