"use client";

import type { Task } from "@/types/task";

interface TaskPreviewProps {
  task?: Task;
}

export function TaskPreview({ task }: TaskPreviewProps) {
  if (!task) return null;

  return (
    <div className="w-80 rounded-md bg-white p-3 shadow-lg">
      <h3 className="font-medium">{task.title}</h3>

      {task.description && (
        <p className="mt-1 text-sm text-gray-600">{task.description}</p>
      )}

      <div className="mt-2 text-xs text-gray-500">{task.priority}</div>
    </div>
  );
}
