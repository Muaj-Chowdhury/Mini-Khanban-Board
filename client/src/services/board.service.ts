import { api } from "@/lib/axios";
import type { BoardListItem, BoardSummary } from "@/types/board";
import type { BoardMemberItem } from "@/hooks/use-board-permissions";

export interface CreateBoardPayload {
  title: string;
  description?: string;
}

export interface UpdateBoardPayload {
  title?: string;
  description?: string;
}

export interface ShareBoardPayload {
  userId: string;
  role?: "VIEWER" | "EDITOR";
}

export interface FullBoardDetails extends Omit<BoardListItem, "owner"> {
  owner: { id: string; name?: string | null; email: string };
  members: BoardMemberItem[];
  columns: Array<{ id: string; title: string; position: number; _count?: { tasks: number } }>;
}

export async function getBoards(): Promise<BoardListItem[]> {
  const response = await api.get("/boards");
  return response.data.data;
}

export async function createBoard(
  payload: CreateBoardPayload,
): Promise<BoardListItem> {
  const response = await api.post("/boards", payload);
  return response.data.data;
}

export async function getBoardSummary(boardId: string): Promise<BoardSummary> {
  const response = await api.get(`/boards/${boardId}/summary`);
  return response.data.data;
}

export async function getBoardDetails(boardId: string): Promise<FullBoardDetails> {
  const response = await api.get(`/boards/${boardId}`);
  return response.data.data;
}

export async function updateBoard(
  boardId: string,
  payload: UpdateBoardPayload,
): Promise<BoardListItem> {
  const response = await api.patch(`/boards/${boardId}`, payload);
  return response.data.data;
}

export async function deleteBoard(boardId: string): Promise<void> {
  await api.delete(`/boards/${boardId}`);
}

export async function getBoardMembers(
  boardId: string,
): Promise<BoardMemberItem[]> {
  const response = await api.get(`/boards/${boardId}/members`);
  return response.data.data;
}

export async function addBoardMember(
  boardId: string,
  payload: ShareBoardPayload,
): Promise<BoardMemberItem> {
  const response = await api.post(`/boards/${boardId}/members`, payload);
  return response.data.data;
}

export async function removeBoardMember(
  boardId: string,
  userId: string,
): Promise<void> {
  await api.delete(`/boards/${boardId}/members/${userId}`);
}
