import {
  ArrowRight,
  CalendarDays,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  type Priority,
  type Status,
  type TaskItem,
} from '@/lib/tasks'
import { cn } from '@/lib/utils'

const PRIORITY_STYLES: Record<Priority, string> = {
  high: 'bg-vermilion/12 text-vermilion',
  medium: 'bg-marigold/20 text-[oklch(0.5_0.12_60)]',
  low: 'bg-teal/12 text-teal',
}

const PRIORITY_BAR: Record<Priority, string> = {
  high: 'bg-vermilion',
  medium: 'bg-marigold',
  low: 'bg-teal',
}

function formatDue(dueDate: string) {
  const [y, m, d] = dueDate.split('-').map(Number)
  const due = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  const label =
    days === 0
      ? 'Today'
      : days === 1
        ? 'Tomorrow'
        : days === -1
          ? 'Yesterday'
          : due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return { label, overdue: days < 0, soon: days >= 0 && days <= 2 }
}

type Props = {
  task: TaskItem
  isDragging: boolean
  onDragStart: (id: number) => void
  onDragEnd: () => void
  onDropBefore: (id: number) => void
  onEdit: (task: TaskItem) => void
  onMove: (task: TaskItem, status: Status) => void
  onDelete: (task: TaskItem) => void
}

export function TaskCard({
  task,
  isDragging,
  onDragStart,
  onDragEnd,
  onDropBefore,
  onEdit,
  onMove,
  onDelete,
}: Props) {
  const priority = task.priority as Priority
  const done = task.status === 'done'
  const due = task.dueDate ? formatDue(task.dueDate) : null

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(task.id))
        onDragStart(task.id)
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onDropBefore(task.id)
      }}
      className={cn(
        'group relative cursor-grab overflow-hidden rounded-lg border bg-card p-4 pl-5 shadow-[0_1px_0_oklch(0.88_0.02_75)] transition-[box-shadow,transform,opacity] hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        isDragging && 'opacity-40',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-0 left-0 w-1',
          PRIORITY_BAR[priority],
          done && 'opacity-40',
        )}
      />
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className={cn(
            'flex-1 text-left font-medium leading-snug outline-none focus-visible:underline',
            done && 'text-muted-foreground line-through decoration-1',
          )}
        >
          {task.title}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Actions for ${task.title}`}
              className="-mt-0.5 -mr-1 text-muted-foreground opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => onEdit(task)}>
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Move to
            </DropdownMenuLabel>
            {STATUSES.filter((s) => s !== task.status).map((s) => (
              <DropdownMenuItem key={s} onSelect={() => onMove(task, s)}>
                <ArrowRight /> {STATUS_LABELS[s]}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onDelete(task)}
            >
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
          {task.description}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={cn(
            'rounded-full px-2 py-0.5 font-medium',
            PRIORITY_STYLES[priority],
          )}
        >
          {PRIORITY_LABELS[priority]}
        </span>
        {due && (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-muted-foreground',
              !done && due.overdue && 'font-medium text-vermilion',
              !done && due.soon && 'text-foreground',
            )}
          >
            <CalendarDays className="size-3.5" aria-hidden />
            {!done && due.overdue ? `Overdue · ${due.label}` : due.label}
          </span>
        )}
      </div>
    </article>
  )
}
