import { api } from "@/lib/axios";
import type { Task, TaskPriority } from "@/types/task";

export async function getTasks(
  boardId: string,
  columnId: string,
): Promise<Task[]> {
  const response = await api.get(
    `/boards/${boardId}/columns/${columnId}/tasks`,
  );
console.log("getTasks response:", response.data.data);
  return response.data.data;
}

export interface MoveTaskPayload {
  targetColumnId: string;
  position: number;
}

export async function moveTask(
  boardId: string,
  taskId: string,
  payload: MoveTaskPayload,
): Promise<Task> {
  const response = await api.patch(
    `/boards/${boardId}/tasks/${taskId}/move`,
    payload,
  );

  return response.data.data;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export async function createTask(
  boardId: string,
  columnId: string,
  payload: CreateTaskPayload,
): Promise<Task> {
  const response = await api.post(
    `/boards/${boardId}/columns/${columnId}/tasks`,
    payload,
  );

  return response.data.data;
}

export async function updateTask(
  boardId: string,
  columnId: string,
  taskId: string,
  payload: UpdateTaskPayload,
): Promise<Task> {
  const response = await api.patch(
    `/boards/${boardId}/columns/${columnId}/tasks/${taskId}`,
    payload,
  );

  return response.data.data;
}

export async function deleteTask(
  boardId: string,
  taskId: string,
): Promise<void> {
  await api.delete(`/boards/${boardId}/tasks/${taskId}`);
}

export async function getBoardTasks(
  boardId: string,
  columnIds: string[],
): Promise<Task[]> {
  const results = await Promise.all(
    columnIds.map((columnId) => getTasks(boardId, columnId)),
  );

  return results.flat();
}
