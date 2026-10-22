import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

import { TaskCard } from '@/components/board/task-card'
import { TaskDialog, type TaskDraft } from '@/components/board/task-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  type Priority,
  type Status,
  type TaskItem,
} from '@/lib/tasks'
import {
  createTask,
  deleteTask,
  listTasks,
  moveTask,
  updateTask,
} from '@/lib/tasks.functions'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  loader: () => listTasks(),
  pendingComponent: BoardSkeleton,
  component: Board,
})

const COLUMN_HINTS: Record<Status, string> = {
  todo: 'Nothing queued. Add what’s next.',
  in_progress: 'Drag a task here when you start it.',
  done: 'Finished work lands here.',
}

const COLUMN_DOT: Record<Status, string> = {
  todo: 'bg-muted-foreground/50',
  in_progress: 'bg-marigold',
  done: 'bg-teal',
}

function byPosition(a: TaskItem, b: TaskItem) {
  return a.position - b.position || a.id - b.id
}

function todayISO() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function Board() {
  const initial = Route.useLoaderData()
  const [tasks, setTasks] = useState<TaskItem[]>(initial)
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TaskItem | null>(null)
  const [dialogStatus, setDialogStatus] = useState<Status>('todo')
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [overColumn, setOverColumn] = useState<Status | null>(null)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tasks.filter(
      (t) =>
        (priorityFilter === 'all' || t.priority === priorityFilter) &&
        (!q ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)),
    )
  }, [tasks, query, priorityFilter])

  const stats = useMemo(() => {
    const today = todayISO()
    const done = tasks.filter((t) => t.status === 'done').length
    const overdue = tasks.filter(
      (t) => t.status !== 'done' && t.dueDate && t.dueDate < today,
    ).length
    return {
      total: tasks.length,
      done,
      open: tasks.length - done,
      overdue,
      pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    }
  }, [tasks])

  function replace(row: TaskItem) {
    setTasks((prev) => prev.map((t) => (t.id === row.id ? row : t)))
  }

  function openNew(status: Status = 'todo') {
    setEditing(null)
    setDialogStatus(status)
    setDialogOpen(true)
  }

  function openEdit(task: TaskItem) {
    setEditing(task)
    setDialogOpen(true)
  }

  async function handleSubmit(draft: TaskDraft) {
    if (editing) {
      const row = await updateTask({ data: { id: editing.id, ...draft } })
      replace(row)
      toast.success('Task updated')
    } else {
      const row = await createTask({ data: draft })
      setTasks((prev) => [...prev, row])
      toast.success('Task added')
    }
  }

  async function applyMove(task: TaskItem, status: Status, position: number) {
    const snapshot = tasks
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status, position } : t)),
    )
    try {
      replace(await moveTask({ data: { id: task.id, status, position } }))
    } catch {
      setTasks(snapshot)
      toast.error('Could not move the task')
    }
  }

  function columnTasks(status: Status, excludeId?: number) {
    return tasks
      .filter((t) => t.status === status && t.id !== excludeId)
      .sort(byPosition)
  }

  function endPosition(status: Status, excludeId?: number) {
    const col = columnTasks(status, excludeId)
    return (col.at(-1)?.position ?? 0) + 1024
  }

  function moveToColumn(task: TaskItem, status: Status) {
    void applyMove(task, status, endPosition(status, task.id))
    toast(`Moved to ${STATUS_LABELS[status]}`)
  }

  function dropOnColumn(status: Status) {
    const task = tasks.find((t) => t.id === draggingId)
    setDraggingId(null)
    setOverColumn(null)
    if (!task) return
    void applyMove(task, status, endPosition(status, task.id))
  }

  function dropBefore(targetId: number) {
    const task = tasks.find((t) => t.id === draggingId)
    const target = tasks.find((t) => t.id === targetId)
    setDraggingId(null)
    setOverColumn(null)
    if (!task || !target || task.id === target.id) return
    const status = target.status as Status
    const col = columnTasks(status, task.id)
    const idx = col.findIndex((t) => t.id === target.id)
    const prev = idx > 0 ? col[idx - 1].position : 0
    const position = Math.max(0, Math.floor((prev + target.position) / 2))
    void applyMove(task, status, position)
  }

  async function handleDelete(task: TaskItem) {
    const snapshot = tasks
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    try {
      await deleteTask({ data: { id: task.id } })
      toast('Task deleted', { description: task.title })
    } catch {
      setTasks(snapshot)
      toast.error('Could not delete the task')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold tracking-tight">
              Kaam
            </span>
            <span
              className="font-display text-lg text-marigold"
              lang="hi"
              aria-hidden
            >
              काम
            </span>
          </div>
          <Button onClick={() => openNew()}>
            <Plus /> New task
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-content px-4 py-8 sm:px-6 sm:py-10">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Your board
            </h1>
            <p className="mt-2 max-w-reading text-muted-foreground">
              {stats.total === 0
                ? 'A clean slate. Add a task and start moving.'
                : `${stats.open} open · ${stats.done} done${
                    stats.overdue ? ` · ${stats.overdue} overdue` : ''
                  }`}
            </p>
          </div>
          <div className="w-full max-w-xs" aria-label="Progress">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-display text-2xl font-bold">
                {stats.pct}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-teal transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: `${stats.pct}%` }}
              />
            </div>
          </div>
        </section>

        <section className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks"
              aria-label="Search tasks"
              className="bg-card pl-9"
            />
          </div>
          <div
            role="group"
            aria-label="Filter by priority"
            className="flex flex-wrap gap-1.5"
          >
            {(['all', ...PRIORITIES] as const).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={priorityFilter === p}
                onClick={() => setPriorityFilter(p)}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none',
                  priorityFilter === p
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                {p === 'all' ? 'All' : PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-3">
          {STATUSES.map((status) => {
            const col = visible
              .filter((t) => t.status === status)
              .sort(byPosition)
            return (
              <div
                key={status}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (overColumn !== status) setOverColumn(status)
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node))
                    setOverColumn(null)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  dropOnColumn(status)
                }}
                className={cn(
                  'flex min-h-64 flex-col rounded-xl border border-transparent bg-muted/70 p-3 transition-colors motion-reduce:transition-none',
                  overColumn === status &&
                    draggingId !== null &&
                    'border-ring bg-accent/60',
                )}
              >
                <div className="flex items-center justify-between px-1 pb-3">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <span
                      aria-hidden
                      className={cn('size-2 rounded-full', COLUMN_DOT[status])}
                    />
                    {STATUS_LABELS[status]}
                    <span className="rounded-full bg-card px-2 text-xs font-medium text-muted-foreground">
                      {col.length}
                    </span>
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Add task to ${STATUS_LABELS[status]}`}
                    onClick={() => openNew(status)}
                  >
                    <Plus />
                  </Button>
                </div>
                <div className="flex flex-1 flex-col gap-2.5">
                  {col.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isDragging={draggingId === task.id}
                      onDragStart={setDraggingId}
                      onDragEnd={() => {
                        setDraggingId(null)
                        setOverColumn(null)
                      }}
                      onDropBefore={dropBefore}
                      onEdit={openEdit}
                      onMove={moveToColumn}
                      onDelete={handleDelete}
                    />
                  ))}
                  {col.length === 0 && (
                    <button
                      type="button"
                      onClick={() => openNew(status)}
                      className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground transition-colors outline-none hover:border-ring hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
                    >
                      {query || priorityFilter !== 'all'
                        ? 'No matching tasks'
                        : COLUMN_HINTS[status]}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </section>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Tip: drag cards between columns, or use the ··· menu to move them.
        </p>
      </main>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        defaultStatus={dialogStatus}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div className="mx-auto max-w-content px-4 py-24 sm:px-6" role="status">
      <span className="sr-only">Loading your board…</span>
      <Skeleton className="h-12 w-64" />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {STATUSES.map((s) => (
          <div key={s} className="space-y-2.5 rounded-xl bg-muted/70 p-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
