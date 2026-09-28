import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import ErrorState from '@/components/ui/ErrorState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { queryKeys } from '@/lib/queryClient'
import { analyticsApi } from '@/services/analytics'

const COLORS = ['#1e3a8a', '#0284c7', '#64748B', '#EF4444', '#3b82f6', '#38BDF8', '#94A3B8']

function RateRow({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value)
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-3">
        <div className="h-2 w-32 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-blue-700 to-sky-600"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <span className="w-10 text-right text-sm font-semibold text-slate-800">{pct}%</span>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  accent = 'brand',
}: {
  label: string
  value: string | number
  accent?: 'brand' | 'alert'
}) {
  const bar =
    accent === 'alert'
      ? 'from-red-400 to-red-500'
      : 'from-blue-700 to-sky-600'
  return (
    <Card className="card-hover relative overflow-hidden p-5">
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${bar} opacity-70`}
      />
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-[1.75rem] font-semibold leading-none tracking-tight text-slate-900">
        {value}
      </p>
    </Card>
  )
}

export default function AnalyticsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.analytics,
    queryFn: analyticsApi.overview,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <CardSkeleton lines={6} />
          <CardSkeleton lines={6} />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />
  }

  const statusData = data.status_breakdown.map((i) => ({ name: i.label, value: i.count }))
  const sourceData = data.source_breakdown.map((i) => ({ name: i.label, value: i.count }))
  const weekly = data.applications_per_week.map((p) => ({ week: p.key, applications: p.count }))
  const monthly = data.applications_per_month.map((m) => ({ month: m.key, applications: m.count }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Funnel performance and trends across your entire search.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Applications', value: data.stats.total_applications },
          { label: 'Response rate', value: `${Math.round(data.response_rate)}%` },
          { label: 'Interview conversion', value: `${Math.round(data.interview_conversion_rate)}%` },
          { label: 'Offer conversion', value: `${Math.round(data.offer_conversion_rate)}%` },
        ].map((s) => (
          <Metric key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Avg days to interview"
          value={data.avg_days_to_interview != null ? `${data.avg_days_to_interview}` : '—'}
        />
        <Metric
          label="Rejection rate"
          value={`${Math.round(data.rejection_rate)}%`}
          accent="alert"
        />
        <Metric label="Interviews" value={data.stats.interviews} />
        <Metric label="Offers" value={data.stats.offers} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Conversion funnel" subtitle="From application to offer" />
          <CardBody>
            <RateRow label="Response rate" value={data.response_rate} />
            <RateRow label="Interview conversion" value={data.interview_conversion_rate} />
            <RateRow label="Offer conversion" value={data.offer_conversion_rate} />
            <RateRow label="Rejection rate" value={data.rejection_rate} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Applications by status" />
          <CardBody className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {statusData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Applications per week" subtitle="Last 12 weeks" />
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="applications" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Applications per month" />
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="applications" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Applications by source" />
          <CardBody className="h-72">
            {sourceData.length === 0 ? (
              <p className="text-sm text-slate-500">No source data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Jobs by location" />
          <CardBody className="h-72">
            {data.location_breakdown.length === 0 ? (
              <p className="text-sm text-slate-500">No location data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.location_breakdown.map((i) => ({ name: i.label, value: i.count }))}
                  margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
