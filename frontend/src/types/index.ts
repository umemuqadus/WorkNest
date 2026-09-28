
export type RemoteType = "remote" | "hybrid" | "onsite";
export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "freelance";
export type JobStatus =
  | "saved"
  | "applying"
  | "applied"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";
export type Priority = "low" | "medium" | "high";
export type ApplicationStatus =
  | "saved"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";
export type InterviewType = "phone" | "video" | "onsite" | "technical" | "behavioral";
export type InterviewResult = "pending" | "selected" | "rejected" | "cancelled";
export type NoteEntityType = "job" | "company" | "application" | "contact" | "interview";

export interface User {
  id: number;
  name: string;
  email: string;
  location: string | null;
  phone: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface PageMeta {
  total: number;
  limit: number;
  offset: number;
  page: number;
  pages: number;
}

export interface Page<T> {
  items: T[];
  page_meta: PageMeta;
}

export interface ApiError {
  detail: string;
  code: string;
  field: string | null;
  errors?: string[];
}

export interface CompanyBrief {
  id: number;
  name: string;
  logo_url: string | null;
  industry: string | null;
  location: string | null;
}

export interface Company extends CompanyBrief {
  user_id: number;
  website: string | null;
  description: string | null;
  job_count: number;
  contact_count: number;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: number;
  user_id: number;
  company_id: number | null;
  company: CompanyBrief | null;
  name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  linkedin_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: number;
  user_id: number;
  company_id: number | null;
  company: CompanyBrief | null;
  title: string;
  description: string | null;
  location: string | null;
  remote_type: RemoteType | null;
  employment_type: EmploymentType | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  job_url: string | null;
  source: string | null;
  status: JobStatus;
  priority: Priority;
  date_posted: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  has_analysis: boolean;
  application_status: ApplicationStatus | null;
  application_id: number | null;
  match_score: number | null;
  matched_resume_id: number | null;
  upcoming_interview_at: string | null;
}

export interface JobPayload {
  title: string;
  description?: string | null;
  location?: string | null;
  remote_type?: RemoteType | null;
  employment_type?: EmploymentType | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
  job_url?: string | null;
  source?: string | null;
  status?: JobStatus;
  priority?: Priority;
  date_posted?: string | null;
  deadline?: string | null;
  company_id?: number | null;
}

export interface JobBrief {
  id: number;
  title: string;
  location: string | null;
  status: JobStatus;
  priority: Priority;
  job_url: string | null;
  company: CompanyBrief | null;
}

export interface StatusHistoryItem {
  id: number;
  old_status: ApplicationStatus | null;
  new_status: ApplicationStatus;
  changed_at: string;
}

export interface Application {
  id: number;
  user_id: number;
  job_id: number;
  job: JobBrief | null;
  applied_at: string | null;
  status: ApplicationStatus;
  source: string | null;
  cover_letter: string | null;
  referral: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationDetail extends Application {
  history: StatusHistoryItem[];
  interviews: Interview[];
}

export interface Resume {
  id: number;
  user_id: number;
  name: string;
  content: string;
  file_url: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResumeSummary {
  id: number;
  name: string;
  is_default: boolean;
  file_url: string | null;
  preview: string;
  created_at: string;
  updated_at: string;
}

export interface Interview {
  id: number;
  application_id: number;
  job_id: number | null;
  job_title: string | null;
  company_name: string | null;
  type: InterviewType;
  scheduled_at: string;
  duration: number | null;
  interviewer: string | null;
  meeting_url: string | null;
  location: string | null;
  notes: string | null;
  result: InterviewResult;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  user_id: number;
  job_id: number | null;
  application_id: number | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: Priority;
  completed: boolean;
  job_title: string | null;
  company: CompanyBrief | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  user_id: number;
  entity_type: NoteEntityType;
  entity_id: number;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface JobAnalysis {
  id: number;
  job_id: number;
  summary: string | null;
  required_skills: string[];
  preferred_skills: string[];
  responsibilities: string[];
  technologies: string[];
  keywords: string[];
  soft_skills: string[];
  seniority: string | null;
  experience_required: string | null;
  education_required: string | null;
  employment_type: string | null;
  remote_type: string | null;
  provider: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobMatch {
  id: number;
  job_id: number;
  resume_id: number;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  weaknesses: string[];
  experience_match: string | null;
  recommendations: string[];
  summary: string | null;
  provider: string | null;
  created_at: string;
  updated_at: string;
}

export interface InterviewPrep {
  id: number;
  job_id: number;
  resume_id: number | null;
  technical_questions: string[];
  behavioral_questions: string[];
  role_specific_questions: string[];
  suggested_answer_points: string[];
  questions_to_ask: string[];
  provider: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationSuggestion {
  id: number;
  job_id: number;
  resume_id: number | null;
  resume_customization: string[];
  keywords_to_include: string[];
  cover_letter_outline: string[];
  skills_to_highlight: string[];
  potential_gaps: string[];
  application_strategy: string | null;
  provider: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIStatus {
  provider: string;
  configured: boolean;
  fallback: boolean;
}

export interface StatBlock {
  total_jobs: number;
  total_applications: number;
  interviews: number;
  upcoming_interviews: number;
  offers: number;
  rejected: number;
  overdue_tasks: number;
  response_rate: number;
  interview_rate: number;
  offer_rate: number;
  avg_applications_per_week: number;
}

export interface SeriesPoint {
  key: string;
  count: number;
}

export interface BreakdownItem {
  key: string;
  label: string;
  count: number;
}

export interface RecentApplicationItem {
  id: number;
  job_id: number;
  status: ApplicationStatus;
  applied_at: string | null;
  created_at: string;
  job_title: string;
  company_name: string | null;
}

export interface UpcomingInterviewItem {
  id: number;
  application_id: number;
  job_title: string;
  company_name: string | null;
  type: string;
  scheduled_at: string;
  duration: number | null;
  interviewer: string | null;
  meeting_url: string | null;
}

export interface HighPriorityJobItem {
  id: number;
  title: string;
  status: JobStatus;
  priority: Priority;
  company_name: string | null;
  deadline: string | null;
}

export interface DashboardTaskItem {
  id: number;
  title: string;
  due_date: string | null;
  priority: Priority;
  completed: boolean;
  overdue: boolean;
  job_title: string | null;
}

export interface DashboardData {
  stats: StatBlock;
  applications_over_time: SeriesPoint[];
  applications_by_status: BreakdownItem[];
  jobs_by_source: BreakdownItem[];
  jobs_by_company: BreakdownItem[];
  interview_conversion: BreakdownItem[];
  activity: SeriesPoint[];
  recent_applications: RecentApplicationItem[];
  upcoming_interviews: UpcomingInterviewItem[];
  follow_up_tasks: DashboardTaskItem[];
  high_priority_jobs: HighPriorityJobItem[];
}

export interface AnalyticsOverview {
  stats: StatBlock;
  applications_per_week: SeriesPoint[];
  applications_per_month: SeriesPoint[];
  status_breakdown: BreakdownItem[];
  source_breakdown: BreakdownItem[];
  location_breakdown: BreakdownItem[];
  job_type_breakdown: BreakdownItem[];
  avg_days_to_interview: number | null;
  rejection_rate: number;
  response_rate: number;
  interview_conversion_rate: number;
  offer_conversion_rate: number;
}

export interface SearchHit {
  type: string;
  id: number;
  title: string;
  subtitle: string;
  url: string;
}

export interface SearchResults {
  jobs: SearchHit[];
  companies: SearchHit[];
  contacts: SearchHit[];
  applications: SearchHit[];
}
