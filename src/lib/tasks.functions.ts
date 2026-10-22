import { createServerFn } from '@tanstack/react-start'
import { asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '../../db/index.js'
import { tasks } from '../../db/schema.js'
import { PRIORITIES, STATUSES } from './tasks'

const taskFields = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000),
  status: z.enum(STATUSES),
  priority: z.enum(PRIORITIES),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
})

const idInput = z.object({ id: z.number().int().positive() })

function serialize(row: typeof tasks.$inferSelect) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export const listTasks = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await db
    .select()
    .from(tasks)
    .orderBy(asc(tasks.position), asc(tasks.id))
  return rows.map(serialize)
})

export const createTask = createServerFn({ method: 'POST' })
  .validator(taskFields)
  .handler(async ({ data }) => {
    // New tasks land at the bottom of their column.
    const [{ max }] = await db
      .select({ max: sql<number>`coalesce(max(${tasks.position}), 0)::int` })
      .from(tasks)
      .where(eq(tasks.status, data.status))
    const [row] = await db
      .insert(tasks)
      .values({ ...data, position: Number(max) + 1024 })
      .returning()
    return serialize(row)
  })

export const updateTask = createServerFn({ method: 'POST' })
  .validator(idInput.extend(taskFields.partial().shape))
  .handler(async ({ data: { id, ...fields } }) => {
    const [row] = await db
      .update(tasks)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning()
    if (!row) throw new Error('Task not found')
    return serialize(row)
  })

export const moveTask = createServerFn({ method: 'POST' })
  .validator(
    idInput.extend({
      status: z.enum(STATUSES),
      position: z.number().int().min(0).max(2_147_483_647),
    }),
  )
  .handler(async ({ data: { id, status, position } }) => {
    const [row] = await db
      .update(tasks)
      .set({ status, position, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning()
    if (!row) throw new Error('Task not found')
    return serialize(row)
  })

export const deleteTask = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }) => {
    await db.delete(tasks).where(eq(tasks.id, data.id))
    return { id: data.id }
  })
