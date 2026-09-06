"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Edit,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { createBoard, getBoards } from "@/services/board.service";
import { useToast } from "@/providers/toast-provider";
import { useAuth } from "@/providers/auth-provider";
import type { BoardListItem } from "@/types/board";
import { EditBoardModal } from "@/components/boards/edit-board-modal";
import { DeleteBoardDialog } from "@/components/boards/delete-board-dialog";

export default function BoardsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [editingBoard, setEditingBoard] = useState<{
    id: string;
    title: string;
    description?: string | null;
  } | null>(null);

  const [deletingBoard, setDeletingBoard] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login");
    }
  }, [user, isAuthLoading, router]);

  const boardsQuery = useQuery({
    queryKey: ["boards"],
    queryFn: getBoards,
    enabled: Boolean(user),
  });

  const createBoardMutation = useMutation({
    mutationFn: () =>
      createBoard({
        title: title.trim(),
        description: description.trim() || undefined,
      }),
    onSuccess: (board) => {
      queryClient.setQueryData<BoardListItem[]>(["boards"], (boards = []) => [
        board,
        ...boards,
      ]);
      setTitle("");
      setDescription("");
      setIsCreateOpen(false);
      showToast("Board created successfully");
    },
    onError: () => {
      showToast("Failed to create board", "error");
    },
  });

  function openCreateModal() {
    setTitle("");
    setDescription("");
    setIsCreateOpen(true);
  }

  const allBoards = boardsQuery.data ?? [];
  const filteredBoards = allBoards.filter(
    (board) =>
      board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (board.description &&
        board.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  if (isAuthLoading || !user) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-gray-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-xl border border-gray-200 bg-white"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-black/5 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                Workspace
              </span>
            </div>
            <h1 className="mt-1.5 text-3xl font-extrabold text-gray-900 tracking-tight">
              Your Boards
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your projects, columns, and tasks in one place.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {allBoards.length > 0 && (
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search boards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 pl-9 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black shadow-sm"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <Search className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition-colors"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Board
            </button>
          </div>
        </header>

        {boardsQuery.isLoading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-xl border border-gray-200 bg-white p-5 space-y-4"
              >
                <div className="h-5 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-100" />
                <div className="h-4 w-1/2 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        )}

        {boardsQuery.isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-semibold">Unable to load boards</p>
              <p className="text-sm text-red-600 mt-0.5">
                Please check your network connection or try refreshing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => boardsQuery.refetch()}
              className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {!boardsQuery.isLoading &&
          !boardsQuery.isError &&
          filteredBoards.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500 mb-3">
                <ClipboardList className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                {searchQuery ? "No matching boards found" : "No boards yet"}
              </h2>
              <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No board title or description matched "${searchQuery}".`
                  : "Create your first board to start organizing tasks and collaborating."}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
                >
                  Create your first board
                </button>
              )}
            </div>
          )}

        {!boardsQuery.isLoading &&
          !boardsQuery.isError &&
          filteredBoards.length > 0 && (
            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBoards.map((board) => {
                const isOwner = board.ownerId === user.id;

                return (
                  <div
                    key={board.id}
                    className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h2
                          onClick={() => router.push(`/boards/${board.id}`)}
                          className="text-lg font-bold text-gray-900 cursor-pointer group-hover:text-black hover:underline tracking-tight"
                        >
                          {board.title}
                        </h2>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isOwner && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingBoard({
                                    id: board.id,
                                    title: board.title,
                                    description: board.description,
                                  });
                                }}
                                className="rounded p-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                title="Edit board"
                              >
                                <Edit
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingBoard({
                                    id: board.id,
                                    title: board.title,
                                  });
                                }}
                                className="rounded p-1 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600"
                                title="Delete board"
                              >
                                <Trash2
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <p
                        onClick={() => router.push(`/boards/${board.id}`)}
                        className="mt-2 text-sm text-gray-600 line-clamp-2 cursor-pointer min-h-[2.5rem]"
                      >
                        {board.description || "No description provided."}
                      </p>
                    </div>

                    <div
                      onClick={() => router.push(`/boards/${board.id}`)}
                      className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          <ClipboardList
                            className="mr-1 inline-block h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          {board._count?.columns ?? 0} columns
                        </span>
                        <span className="font-medium">
                          <Users
                            className="mr-1 inline-block h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          {board._count?.members ?? 0} members
                        </span>
                      </div>

                      {isOwner ? (
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                          Owner
                        </span>
                      ) : (
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 border border-gray-200">
                          Member
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          )}
      </div>

      {/* Create Board Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!title.trim()) return;
              createBoardMutation.mutate();
            }}
            className="w-full max-w-md space-y-5 rounded-xl bg-white p-6 shadow-2xl border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Create Board
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
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
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Website Redesign, Sprint 14..."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What is the goal of this project board?"
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createBoardMutation.isPending || !title.trim()}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {createBoardMutation.isPending ? "Creating..." : "Create Board"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Board Modal */}
      {editingBoard && (
        <EditBoardModal
          boardId={editingBoard.id}
          initialTitle={editingBoard.title}
          initialDescription={editingBoard.description}
          isOpen={Boolean(editingBoard)}
          onClose={() => setEditingBoard(null)}
        />
      )}

      {/* Delete Board Dialog */}
      {deletingBoard && (
        <DeleteBoardDialog
          boardId={deletingBoard.id}
          boardTitle={deletingBoard.title}
          isOpen={Boolean(deletingBoard)}
          onClose={() => setDeletingBoard(null)}
        />
      )}
    </main>
  );
}
