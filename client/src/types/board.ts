import type { Column } from "./column";

export interface Board {
  id: string;
  title: string;
  description: string | null;
  ownerId?: string;
}

export interface BoardListItem extends Board {
  ownerId: string;
  owner?: {
    id: string;
    name?: string | null;
    email: string;
  };
  _count?: {
    members: number;
    columns: number;
  };
}

export interface BoardSummary {
  board: Board;
  columns: Column[];
}
