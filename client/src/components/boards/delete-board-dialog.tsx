"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { deleteBoard } from "@/services/board.service";
import { useToast } from "@/providers/toast-provider";

interface DeleteBoardDialogProps {
  boardId: string;
  boardTitle: string;
  isOpen: boolean;
  onClose: () => void;
  redirectToBoards?: boolean;
}

export function DeleteBoardDialog({
  boardId,
  boardTitle,
  isOpen,
  onClose,
  redirectToBoards = false,
}: DeleteBoardDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: () => deleteBoard(boardId),
    onSuccess: () => {
      showToast("Board deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      onClose();
      if (redirectToBoards) {
        router.push("/boards");
      }
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to delete board";
      showToast(message, "error");
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-2xl border border-gray-100">
        <div className="flex items-center gap-3 text-red-600">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 font-bold">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Delete Board
          </h2>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          Are you sure you want to delete{" "}
          <strong className="text-gray-900">&quot;{boardTitle}&quot;</strong>?
          This action cannot be undone and will permanently remove all
          associated columns and tasks.
        </p>

        <div className="flex justify-end gap-2.5 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Board"}
          </button>
        </div>
      </div>
    </div>
  );
}
