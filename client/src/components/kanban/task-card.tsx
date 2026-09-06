"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CalendarDays, Edit, MoreVertical, Trash2 } from "lucide-react";
import { deleteTask } from "@/services/task.service";
import { useToast } from "@/providers/toast-provider";
import type { Task } from "@/types/task";
import { TaskModal } from "./task-modal";

interface TaskCardProps {
  boardId: string;
  task: Task;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
  canManageTasks?: boolean;
  canMoveTasks?: boolean;
}

export function TaskCard({
  boardId,
  task,
  onTaskUpdated,
  onTaskDeleted,
  canManageTasks = true,
  canMoveTasks = true,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { showToast } = useToast();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: !canMoveTasks,
    data: {
      type: "task",
      columnId: task.columnId,
      position: task.position,
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => deleteTask(boardId, task.id),
    onSuccess: () => {
      onTaskDeleted(task.id);
      showToast("Task deleted successfully");
    },
    onError: () => {
      showToast("Failed to delete task", "error");
    },
  });

  function handleDelete() {
    setIsMenuOpen(false);
    if (!window.confirm(`Are you sure you want to delete "${task.title}"?`))
      return;
    deleteTaskMutation.mutate();
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityStyles = {
    HIGH: "bg-red-50 text-red-700 border-red-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm transition-all hover:border-gray-300 hover:shadow ${
        canMoveTasks ? "cursor-grab active:cursor-grabbing" : ""
      } ${isDragging ? "opacity-30 border-dashed border-gray-400" : ""}`}
    >
      <div {...(canMoveTasks ? { ...attributes, ...listeners } : {})}>
        <div className="pr-6">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug">
            {task.title}
          </h3>

          {task.description && (
            <p className="mt-1 text-xs text-gray-600 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-50 pt-2.5">
          <span
            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
              priorityStyles[task.priority] || priorityStyles.MEDIUM
            }`}
          >
            {task.priority}
          </span>

          {formattedDueDate && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              {formattedDueDate}
            </span>
          )}
        </div>
      </div>

      {canManageTasks && (
        <div className="absolute right-2 top-2">
          <button
            type="button"
            aria-label="Task actions"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((open) => !open);
            }}
            className="rounded p-1 text-xs font-bold text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-700 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" aria-hidden="true" />
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-1 w-28 rounded-lg border border-gray-200 bg-white py-1 shadow-lg text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setIsMenuOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-gray-700 hover:bg-gray-50 font-medium"
                >
                  <Edit
                    className="mr-2 inline-block h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteTaskMutation.isPending}
                  className="block w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 font-medium disabled:opacity-50"
                >
                  <Trash2
                    className="mr-2 inline-block h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {isEditing && (
        <TaskModal
          boardId={boardId}
          columnId={task.columnId}
          taskToEdit={task}
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          onTaskUpdated={onTaskUpdated}
        />
      )}
    </div>
  );
}
