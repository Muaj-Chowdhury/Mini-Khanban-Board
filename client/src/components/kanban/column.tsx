"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, MoreVertical, Plus, Trash2, X } from "lucide-react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { deleteColumn, updateColumn } from "@/services/column.service";
import { useToast } from "@/providers/toast-provider";
import type { Column as ColumnType } from "@/types/column";
import type { Task } from "@/types/task";
import { TaskCard } from "./task-card";
import { TaskModal } from "./task-modal";

interface ColumnProps {
  boardId: string;
  column: ColumnType;
  tasks: Task[];
  isTasksLoading: boolean;
  onTaskCreated: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
  onColumnUpdated: (column: ColumnType) => void;
  onColumnDeleted: (columnId: string) => void;
  canManageColumns?: boolean;
  canManageTasks?: boolean;
  canMoveTasks?: boolean;
}

export function Column({
  boardId,
  column,
  tasks,
  isTasksLoading,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onColumnUpdated,
  onColumnDeleted,
  canManageColumns = true,
  canManageTasks = true,
  canMoveTasks = true,
}: ColumnProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [columnTitle, setColumnTitle] = useState(column.title);

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const updateColumnMutation = useMutation({
    mutationFn: () => updateColumn(boardId, column.id, columnTitle.trim()),
    onSuccess: (updatedColumn) => {
      onColumnUpdated(updatedColumn);
      setIsEditing(false);
      showToast("Column renamed successfully");
    },
    onError: () => {
      showToast("Failed to rename column", "error");
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: () => deleteColumn(boardId, column.id),
    onSuccess: () => {
      onColumnDeleted(column.id);
      showToast("Column deleted successfully");
    },
    onError: () => {
      showToast("Failed to delete column", "error");
    },
  });

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      columnId: column.id,
    },
  });

  function openEditor() {
    setColumnTitle(column.title);
    setIsEditing(true);
    setIsMenuOpen(false);
  }

  function handleDeleteColumn() {
    setIsMenuOpen(false);
    if (!window.confirm(`Delete column "${column.title}" and all its tasks?`))
      return;
    deleteColumnMutation.mutate();
  }

  return (
    <div
      ref={setNodeRef}
      className={`w-80 shrink-0 flex flex-col rounded-xl bg-gray-100/90 border p-3.5 transition-colors ${
        isOver
          ? "border-black/40 bg-gray-200/60 ring-2 ring-black/10"
          : "border-gray-200/80"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-gray-900 text-sm tracking-tight">
            {column.title}
          </h2>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[11px] font-bold text-gray-700">
            {tasks.length}
          </span>
        </div>

        <div className="relative flex items-center gap-1">
          {canManageTasks && (
            <button
              type="button"
              onClick={() => setIsAddTaskOpen(true)}
              className="rounded p-1 text-xs font-semibold text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
              title="Add task"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add
            </button>
          )}

          {canManageColumns && (
            <button
              type="button"
              aria-label="Column actions"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="rounded p-1 text-xs font-bold text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
            >
              <MoreVertical className="h-4 w-4" aria-hidden="true" />
            </button>
          )}

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-7 z-20 w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg text-xs">
                <button
                  type="button"
                  onClick={openEditor}
                  className="block w-full px-3 py-1.5 text-left text-gray-700 hover:bg-gray-50 font-medium"
                >
                  <Edit
                    className="mr-2 inline-block h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  Rename
                </button>
                <button
                  type="button"
                  onClick={handleDeleteColumn}
                  disabled={deleteColumnMutation.isPending}
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
      </div>

      {/* Task List Container */}
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 min-h-[100px] space-y-2.5 overflow-y-auto max-h-[calc(100vh-250px)] pr-0.5">
          {isTasksLoading && (
            <div className="space-y-2 py-2">
              <div className="h-20 animate-pulse rounded-lg bg-gray-200/60" />
              <div className="h-20 animate-pulse rounded-lg bg-gray-200/60" />
            </div>
          )}

          {!isTasksLoading && tasks.length === 0 && (
            <div className="flex h-24 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-4 text-center">
              <p className="text-xs font-medium text-gray-400">Empty column</p>
              {canManageTasks && (
                <button
                  type="button"
                  onClick={() => setIsAddTaskOpen(true)}
                  className="mt-1 text-xs font-semibold text-black hover:underline"
                >
                  <Plus
                    className="mr-1 inline-block h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  Add a task
                </button>
              )}
            </div>
          )}

          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              boardId={boardId}
              task={task}
              onTaskUpdated={onTaskUpdated}
              onTaskDeleted={onTaskDeleted}
              canManageTasks={canManageTasks}
              canMoveTasks={canMoveTasks}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add Task Modal */}
      {isAddTaskOpen && (
        <TaskModal
          boardId={boardId}
          columnId={column.id}
          isOpen={isAddTaskOpen}
          onClose={() => setIsAddTaskOpen(false)}
          onTaskCreated={(newTask) => {
            onTaskCreated(newTask);
            queryClient.invalidateQueries({
              queryKey: ["board-summary", boardId],
            });
          }}
        />
      )}

      {/* Rename Column Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!columnTitle.trim()) return;
              updateColumnMutation.mutate();
            }}
            className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-2xl border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                Rename Column
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Column title
              </label>
              <input
                value={columnTitle}
                onChange={(event) => setColumnTitle(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                autoFocus
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateColumnMutation.isPending || !columnTitle.trim()}
                className="rounded-lg bg-black px-3.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
              >
                {updateColumnMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
