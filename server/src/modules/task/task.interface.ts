import type { TaskPriority } from "../../../generated/prisma/enums.js";

export interface CreateTaskPayload {
  title: string;
  description?: string | null;
  priority: TaskPriority;
  dueDate?: Date | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: Date | null;
}

export interface MoveTaskPayload {
  targetColumnId: string;
  position: number;
}
