import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Circle, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { PriorityBadge } from '@/components/ui/StatusBadges'
import Textarea from '@/components/ui/Textarea'
import { useDebounce } from '@/hooks/useDebounce'
import { useToast } from '@/hooks/useToast'
import { PRIORITY_CHOICES } from '@/lib/labels'
import { formatDate, isOverdue } from '@/lib/utils'
import { jobsApi } from '@/services/jobs'
import { tasksApi, type TaskPayload } from '@/services/tasks'
import type { Task } from '@/types'

export default function TasksPage() {
  const queryClient = useQueryClient()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 300)
  const [view, setView] = useState<'open' | 'done' | 'all'>('open')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)

  const [form, setForm] = useState<TaskPayload>({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    job_id: null,
  })

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeysFor(view, debounced),
    queryFn: () =>
      tasksApi.list({
        completed: view === 'all' ? undefined : view === 'done',
        q: debounced || undefined,
        limit: 100,
      }),
  })

  const jobsQuery = useQuery({
    queryKey: ['jobs', 'all'],
    queryFn: () => jobsApi.list({ limit: 100 }),
  })

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['tasks'] })

  const saveTask = useMutation({
    mutationFn: (payload: TaskPayload) =>
      editing ? tasksApi.update(editing.id, payload) : tasksApi.create(payload),
    onSuccess: () => {
      toast.success(editing ? 'Task updated' : 'Task created')
      setModalOpen(false)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const toggleTask = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      tasksApi.update(id, { completed }),
    onSuccess: invalidate,
    onError: (e) => toast.error((e as Error).message),
  })

  const removeTask = useMutation({
    mutationFn: (id: number) => tasksApi.remove(id),
    onSuccess: () => {
      toast.success('Task deleted')
      setDeleting(null)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  function openCreate() {
    setEditing(null)
    setForm({ title: '', description: '', due_date: '', priority: 'medium', job_id: null })
    setModalOpen(true)
  }

  function openEdit(task: Task) {
    setEditing(task)
    setForm({
      title: task.title,
      description: task.description ?? '',
      due_date: task.due_date ?? '',
      priority: task.priority,
      job_id: task.job_id,
    })
    setModalOpen(true)
  }

  const items = data?.items ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">Follow-ups, deadlines and reminders.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add task
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[16rem]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            aria-label="Search tasks"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-700/15"
          />
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {(['open', 'done', 'all'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                view === v
                  ? 'bg-gradient-to-b from-blue-800 to-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <ListSkeleton count={5} />}
      {isError && <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          title={view === 'done' ? 'No completed tasks yet' : 'Nothing on your list'}
          description="Capture your follow-ups so nothing slips through."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add task
            </Button>
          }
        />
      )}

      <div className="space-y-2">
        {items.map((task) => {
          const overdue = !task.completed && isOverdue(task.due_date)
          return (
            <article
              key={task.id}
              className="card card-hover flex items-start gap-3 px-4 py-3"
            >
              <button
                type="button"
                aria-label={task.completed ? 'Mark as open' : 'Mark as complete'}
                onClick={() => toggleTask.mutate({ id: task.id, completed: !task.completed })}
                className="mt-0.5 text-slate-400 hover:text-emerald-600"
              >
                {task.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    task.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                  }`}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{task.description}</p>
                )}
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  {task.due_date && (
                    <span className={overdue ? 'font-medium text-red-600' : ''}>
                      Due {formatDate(task.due_date)}
                      {overdue ? ' · overdue' : ''}
                    </span>
                  )}
                  {task.job_title && (
                    <span>
                      {task.job_title}
                      {task.company ? ` · ${task.company.name}` : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <PriorityBadge priority={task.priority} />
                <button
                  type="button"
                  className="text-xs font-medium text-blue-900 hover:text-blue-800"
                  onClick={() => openEdit(task)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-xs font-medium text-red-500 hover:text-red-600"
                  onClick={() => setDeleting(task)}
                >
                  Delete
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit task' : 'New task'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saveTask.isPending}
              disabled={!form.title.trim()}
              onClick={() => saveTask.mutate({ ...form, title: form.title.trim() })}
            >
              {editing ? 'Save changes' : 'Create task'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Textarea
            label="Description"
            rows={3}
            value={form.description ?? ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Due date"
              type="date"
              value={form.due_date ?? ''}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
            <Select
              label="Priority"
              value={form.priority ?? 'medium'}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              options={PRIORITY_CHOICES.map((c) => ({ value: c.value, label: c.label }))}
            />
          </div>
          <Select
            label="Linked job"
            value={form.job_id ? String(form.job_id) : ''}
            onChange={(e) =>
              setForm({ ...form, job_id: e.target.value ? Number(e.target.value) : null })
            }
            placeholder="No job"
            options={(jobsQuery.data?.items ?? []).map((j) => ({
              value: String(j.id),
              label: j.title,
            }))}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete task?"
        message="This task will be permanently removed."
        loading={removeTask.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && removeTask.mutate(deleting.id)}
      />
    </div>
  )
}

function queryKeysFor(view: string, q: string) {
  return ['tasks', { view, q }]
}
