import type {
  ApplicationStatus,
  EmploymentType,
  InterviewType,
  JobStatus,
  Priority,
  RemoteType,
} from "@/types";

export interface Choice<T extends string> {
  value: T;
  label: string;
  /** tailwind classes for badges */
  badge: string;
  /** tailwind classes for dots/chips */
  dot: string;
}

export const JOB_STATUS_CHOICES: Choice<JobStatus>[] = [
  { value: "saved", label: "Saved", badge: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
  { value: "applying", label: "Applying", badge: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500" },
  { value: "applied", label: "Applied", badge: "bg-slate-200 text-slate-700 ring-slate-300", dot: "bg-slate-500" },
  { value: "interview", label: "Interview", badge: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500" },
  { value: "offer", label: "Offer", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  { value: "rejected", label: "Rejected", badge: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
  { value: "withdrawn", label: "Withdrawn", badge: "bg-slate-100 text-slate-500 ring-slate-200", dot: "bg-slate-400" },
];

export const APPLICATION_STATUS_CHOICES: Choice<ApplicationStatus>[] = [
  { value: "saved", label: "Saved", badge: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
  { value: "applied", label: "Applied", badge: "bg-slate-200 text-slate-700 ring-slate-300", dot: "bg-slate-500" },
  { value: "screening", label: "Screening", badge: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500" },
  { value: "interview", label: "Interview", badge: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500" },
  { value: "offer", label: "Offer", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  { value: "rejected", label: "Rejected", badge: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
  { value: "withdrawn", label: "Withdrawn", badge: "bg-slate-100 text-slate-500 ring-slate-200", dot: "bg-slate-400" },
];

/** Columns shown on the application Kanban board (saved -> rejected flow). */
export const KANBAN_COLUMNS: ApplicationStatus[] = [
  "saved",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
];

export const PRIORITY_CHOICES: Choice<Priority>[] = [
  { value: "low", label: "Low", badge: "bg-slate-100 text-slate-600 ring-slate-200", dot: "bg-slate-400" },
  { value: "medium", label: "Medium", badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  { value: "high", label: "High", badge: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
];

export const REMOTE_CHOICES: { value: RemoteType; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

export const EMPLOYMENT_CHOICES: { value: EmploymentType; label: string }[] = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
];

export const INTERVIEW_TYPE_CHOICES: { value: InterviewType; label: string }[] = [
  { value: "phone", label: "Phone" },
  { value: "video", label: "Video" },
  { value: "onsite", label: "On-site" },
  { value: "technical", label: "Technical" },
  { value: "behavioral", label: "Behavioral" },
];

export const INTERVIEW_RESULT_CHOICES: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export const JOB_SOURCES = [
  "LinkedIn",
  "Referral",
  "Company Site",
  "Job Board",
  "Indeed",
  "Glassdoor",
  "Other",
];

export function statusChoice<T extends string>(
  value: T | null | undefined,
  choices: Choice<string>[],
): Choice<string> {
  const found = choices.find((choice) => choice.value === value);
  return found ?? { value: String(value ?? ""), label: "Unknown", badge: "bg-slate-100 text-slate-600 ring-slate-200", dot: "bg-slate-400" };
}
