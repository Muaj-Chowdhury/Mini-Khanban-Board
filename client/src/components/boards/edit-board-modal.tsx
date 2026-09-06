"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBoard } from "@/services/board.service";
import { useToast } from "@/providers/toast-provider";

interface EditBoardModalProps {
  boardId: string;
  initialTitle: string;
  initialDescription?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditBoardModal({
  boardId,
  initialTitle,
  initialDescription,
  isOpen,
  onClose,
}: EditBoardModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription || "");
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const updateMutation = useMutation({
    mutationFn: () =>
      updateBoard(boardId, {
        title: title.trim(),
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      showToast("Board updated successfully");
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      queryClient.invalidateQueries({ queryKey: ["board-summary", boardId] });
      queryClient.invalidateQueries({ queryKey: ["board-details", boardId] });
      onClose();
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to update board";
      showToast(message, "error");
    },
  });

  if (!isOpen) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    updateMutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-xl bg-white p-6 shadow-2xl border border-gray-100"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Edit Board
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
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Board title"
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
              placeholder="What is this board for?"
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
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
            disabled={updateMutation.isPending || !title.trim()}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
