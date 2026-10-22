export const STATUSES = ['todo', 'in_progress', 'done'] as const
export const PRIORITIES = ['low', 'medium', 'high'] as const

export type Status = (typeof STATUSES)[number]
export type Priority = (typeof PRIORITIES)[number]

export type TaskItem = {
  id: number
  title: string
  description: string
  status: string
  priority: string
  dueDate: string | null
  position: number
  createdAt: string
  updatedAt: string
}

export const STATUS_LABELS: Record<Status, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}
