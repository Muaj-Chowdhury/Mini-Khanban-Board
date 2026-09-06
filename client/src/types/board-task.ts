import type { Task } from "@/types/task";

export interface BoardTasks {
  [columnId: string]: Task[];
}
