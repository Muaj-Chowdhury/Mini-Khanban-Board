import { api } from "@/lib/axios";
import type { Column } from "@/types/column";

export async function getColumns(boardId: string): Promise<Column[]> {
  const response = await api.get(`/boards/${boardId}/columns`);

  return response.data.data;
}

export async function createColumn(
  boardId: string,
  title: string,
): Promise<Column> {
  const response = await api.post(`/boards/${boardId}/columns`, {
    title,
  });

  return response.data.data;
}

export async function updateColumn(
  boardId: string,
  columnId: string,
  title: string,
): Promise<Column> {
  const response = await api.patch(`/boards/${boardId}/columns/${columnId}`, {
    title,
  });

  return response.data.data;
}

export async function deleteColumn(
  boardId: string,
  columnId: string,
): Promise<void> {
  await api.delete(`/boards/${boardId}/columns/${columnId}`);
}
