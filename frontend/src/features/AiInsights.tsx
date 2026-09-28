import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  FileCheck2,
  RefreshCw,
  Sparkles,
  Target,
  Wand2,
  XCircle,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import Button from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { MatchScore } from '@/components/ui/StatusBadges'
import Tabs from '@/components/ui/Tabs'
import { useToast } from '@/hooks/useToast'
import { queryKeys } from '@/lib/queryClient'
import { aiApi } from '@/services/ai'
import type { ResumeSummary } from '@/types'

function ChipList({ items, tone }: { items: string[]; tone: 'green' | 'red' | 'cyan' | 'amber' }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    cyan: 'bg-sky-50 text-sky-700 ring-sky-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  }
  if (!items.length) return <p className="text-sm text-slate-500">None identified.</p>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      {children}
    </div>
  )
}

function Bullets({ items, icon }: { items: string[]; icon?: ReactNode }) {
  if (!items.length) return <p className="text-sm text-slate-500">Nothing yet.</p>
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm text-slate-700">
          <span className="mt-1.5 shrink-0">{icon ?? <span className="block h-1.5 w-1.5 rounded-full bg-sky-500" />}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function AiInsights({
  jobId,
  resumes,
}: {
  jobId: number
  resumes: ResumeSummary[]
}) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [resumeId, setResumeId] = useState<number | undefined>(undefined)

  const analysis = useQuery({
    queryKey: queryKeys.analysis(jobId),
    queryFn: () => aiApi.getAnalysis(jobId),
  })
  const match = useQuery({
    queryKey: queryKeys.match(jobId, resumeId),
    queryFn: () => aiApi.getMatch(jobId, resumeId),
  })
  const prep = useQuery({
    queryKey: queryKeys.prep(jobId),
    queryFn: () => aiApi.getPrep(jobId),
  })
  const suggestions = useQuery({
    queryKey: queryKeys.suggestions(jobId),
    queryFn: () => aiApi.getSuggestions(jobId),
  })

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['ai'] })
    void queryClient.invalidateQueries({ queryKey: queryKeys.job(jobId) })
  }

  const analyze = useMutation({
    mutationFn: (refresh: boolean) => aiApi.analyze(jobId, refresh),
    onSuccess: () => {
      toast.success('Job analyzed')
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })
  const runMatch = useMutation({
    mutationFn: ({ refresh }: { refresh: boolean }) => aiApi.match(jobId, resumeId, refresh),
    onSuccess: () => {
      toast.success('Match computed')
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })
  const runPrep = useMutation({
    mutationFn: (refresh: boolean) => aiApi.prep(jobId, resumeId, refresh),
    onSuccess: () => {
      toast.success('Interview prep generated')
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })
  const runSuggest = useMutation({
    mutationFn: (refresh: boolean) => aiApi.suggest(jobId, resumeId, refresh),
    onSuccess: () => {
      toast.success('Application suggestions generated')
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const resumePicker = (
    <select
      value={resumeId ?? ''}
      onChange={(e) => setResumeId(e.target.value ? Number(e.target.value) : undefined)}
      aria-label="Select resume"
      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
    >
      <option value="">Default resume</option>
      {resumes.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name}
          {r.is_default ? ' (default)' : ''}
        </option>
      ))}
    </select>
  )

  const analysisTab = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            loading={analyze.isPending}
            onClick={() => analyze.mutate(!!analysis.data)}
            disabled={!analysis.data}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Regenerate
          </Button>
          <Button size="sm" loading={analyze.isPending} onClick={() => analyze.mutate(false)}>
            <Sparkles className="h-3.5 w-3.5" /> {analysis.data ? 'Loaded' : 'Analyze job'}
          </Button>
        </div>
      </div>

      {analysis.isLoading && <Skeleton className="h-24 w-full" />}

      {analysis.data ? (
        <div className="space-y-4">
          {analysis.data.summary && (
            <p className="rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
              {analysis.data.summary}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Section title="Required skills">
              <ChipList items={analysis.data.required_skills} tone="cyan" />
            </Section>
            <Section title="Preferred skills">
              <ChipList items={analysis.data.preferred_skills} tone="amber" />
            </Section>
            <Section title="Technologies">
              <ChipList items={analysis.data.technologies} tone="green" />
            </Section>
            <Section title="Keywords">
              <ChipList items={analysis.data.keywords} tone="cyan" />
            </Section>
            <Section title="Soft skills">
              <ChipList items={analysis.data.soft_skills} tone="amber" />
            </Section>
            <Section title="Role details">
              <ul className="space-y-1 text-sm text-slate-700">
                <li>Seniority: {analysis.data.seniority ?? '—'}</li>
                <li>Experience: {analysis.data.experience_required ?? '—'}</li>
                <li>Education: {analysis.data.education_required ?? '—'}</li>
                <li>Type: {analysis.data.employment_type ?? '—'}</li>
                <li>Work mode: {analysis.data.remote_type ?? '—'}</li>
              </ul>
            </Section>
          </div>
          <Section title="Responsibilities">
            <Bullets items={analysis.data.responsibilities} />
          </Section>
        </div>
      ) : (
        !analysis.isLoading && (
          <p className="text-sm text-slate-500">
            No analysis yet. Run an analysis to extract skills, keywords and responsibilities.
          </p>
        )
      )}
    </div>
  )

  const matchTab = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">{resumePicker}</div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            loading={runMatch.isPending}
            disabled={!match.data}
            onClick={() => runMatch.mutate({ refresh: true })}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Recompute
          </Button>
          <Button
            size="sm"
            loading={runMatch.isPending}
            onClick={() => runMatch.mutate({ refresh: false })}
          >
            <Target className="h-3.5 w-3.5" /> {match.data ? 'Loaded' : 'Compute match'}
          </Button>
        </div>
      </div>

      {match.isLoading && <Skeleton className="h-24 w-full" />}

      {match.data ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <MatchScore score={match.data.match_score} />
            {match.data.summary && <p className="text-sm text-slate-600">{match.data.summary}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Section title="Matched skills">
              <ChipList items={match.data.matched_skills} tone="green" />
            </Section>
            <Section title="Missing skills">
              <ChipList items={match.data.missing_skills} tone="red" />
            </Section>
            <Section title="Strengths">
              <Bullets items={match.data.strengths} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} />
            </Section>
            <Section title="Weaknesses">
              <Bullets items={match.data.weaknesses} icon={<XCircle className="h-4 w-4 text-red-500" />} />
            </Section>
          </div>
          <Section title="Recommendations">
            <Bullets items={match.data.recommendations} />
          </Section>
        </div>
      ) : (
        !match.isLoading && (
          <p className="text-sm text-slate-500">
            Compare this job against one of your resumes to get a match score and gap analysis.
          </p>
        )
      )}
    </div>
  )

  const prepTab = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">{resumePicker}</div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            loading={runPrep.isPending}
            disabled={!prep.data}
            onClick={() => runPrep.mutate(true)}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Regenerate
          </Button>
          <Button size="sm" loading={runPrep.isPending} onClick={() => runPrep.mutate(false)}>
            <Wand2 className="h-3.5 w-3.5" /> {prep.data ? 'Loaded' : 'Generate prep'}
          </Button>
        </div>
      </div>

      {prep.isLoading && <Skeleton className="h-24 w-full" />}

      {prep.data ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Technical questions">
            <Bullets items={prep.data.technical_questions} />
          </Section>
          <Section title="Behavioral questions">
            <Bullets items={prep.data.behavioral_questions} />
          </Section>
          <Section title="Role-specific questions">
            <Bullets items={prep.data.role_specific_questions} />
          </Section>
          <Section title="Questions to ask them">
            <Bullets items={prep.data.questions_to_ask} />
          </Section>
          <div className="lg:col-span-2">
            <Section title="Suggested answer points">
              <Bullets items={prep.data.suggested_answer_points} />
            </Section>
          </div>
        </div>
      ) : (
        !prep.isLoading && (
          <p className="text-sm text-slate-500">
            Generate tailored interview questions and talking points for this role.
          </p>
        )
      )}
    </div>
  )

  const suggestionsTab = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">{resumePicker}</div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            loading={runSuggest.isPending}
            disabled={!suggestions.data}
            onClick={() => runSuggest.mutate(true)}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Regenerate
          </Button>
          <Button size="sm" loading={runSuggest.isPending} onClick={() => runSuggest.mutate(false)}>
            <FileCheck2 className="h-3.5 w-3.5" /> {suggestions.data ? 'Loaded' : 'Get suggestions'}
          </Button>
        </div>
      </div>

      {suggestions.isLoading && <Skeleton className="h-24 w-full" />}

      {suggestions.data ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Resume customization">
            <Bullets items={suggestions.data.resume_customization} />
          </Section>
          <Section title="Keywords to include">
            <ChipList items={suggestions.data.keywords_to_include} tone="cyan" />
          </Section>
          <Section title="Skills to highlight">
            <ChipList items={suggestions.data.skills_to_highlight} tone="green" />
          </Section>
          <Section title="Potential gaps">
            <Bullets items={suggestions.data.potential_gaps} />
          </Section>
          <div className="lg:col-span-2">
            <Section title="Cover letter outline">
              <Bullets items={suggestions.data.cover_letter_outline} />
            </Section>
          </div>
          {suggestions.data.application_strategy && (
            <div className="lg:col-span-2">
              <Section title="Application strategy">
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                  {suggestions.data.application_strategy}
                </p>
              </Section>
            </div>
          )}
        </div>
      ) : (
        !suggestions.isLoading && (
          <p className="text-sm text-slate-500">
            Get a cover letter outline, keyword gaps and a tailored application strategy.
          </p>
        )
      )}
    </div>
  )

  return (
    <Tabs
      tabs={[
        { id: 'analysis', label: 'Job analysis', content: analysisTab },
        { id: 'match', label: 'Resume match', content: matchTab },
        { id: 'prep', label: 'Interview prep', content: prepTab },
        { id: 'suggestions', label: 'Application tips', content: suggestionsTab },
      ]}
    />
  )
}
