"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { createTask, updateTask } from "@/services/task.service";
import { useToast } from "@/providers/toast-provider";
import type { Task, TaskPriority } from "@/types/task";

interface TaskModalProps {
  boardId: string;
  columnId: string;
  taskToEdit?: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
}

export function TaskModal({
  boardId,
  columnId,
  taskToEdit,
  isOpen,
  onClose,
  onTaskCreated,
  onTaskUpdated,
}: TaskModalProps) {
  const isEditing = Boolean(taskToEdit);
  const { showToast } = useToast();

  const [title, setTitle] = useState(taskToEdit?.title || "");
  const [description, setDescription] = useState(taskToEdit?.description || "");
  const [priority, setPriority] = useState<TaskPriority>(
    taskToEdit?.priority || "MEDIUM",
  );
  const [dueDate, setDueDate] = useState(
    taskToEdit?.dueDate
      ? new Date(taskToEdit.dueDate).toISOString().split("T")[0]
      : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      if (isEditing && taskToEdit) {
        const updated = await updateTask(boardId, columnId, taskToEdit.id, {
          title: title.trim(),
          description: description.trim() || null,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        });
        showToast("Task updated successfully");
        onTaskUpdated?.(updated);
      } else {
        const created = await createTask(boardId, columnId, {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        });
        showToast("Task created successfully");
        onTaskCreated?.(created);
      }
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to save task";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-xl bg-white p-6 shadow-2xl border border-gray-100"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {isEditing ? "Edit Task" : "Create Task"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design landing page hero"
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details or context for this task..."
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {isSubmitting
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
                ? "Save Changes"
                : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
}
