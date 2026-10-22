import { integer, pgTable, serial, text, timestamp, date } from 'drizzle-orm/pg-core'

export const tasks = pgTable('tasks', {
  id: serial().primaryKey(),
  title: text().notNull(),
  description: text().notNull().default(''),
  // 'todo' | 'in_progress' | 'done'
  status: text().notNull().default('todo'),
  // 'low' | 'medium' | 'high'
  priority: text().notNull().default('medium'),
  dueDate: date('due_date'),
  position: integer().notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Task = typeof tasks.$inferSelect
