"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft, Edit, Plus, Trash2, Users, X } from "lucide-react";
import { getBoardDetails, getBoardSummary } from "@/services/board.service";
import { Column } from "@/components/kanban/column";
import { TaskPreview } from "@/components/kanban/task-preview";
import { createColumn } from "@/services/column.service";
import { getBoardTasks, moveTask } from "@/services/task.service";
import type { BoardTasks } from "@/types/board-task";
import type { BoardSummary } from "@/types/board";
import type { Column as ColumnType } from "@/types/column";
import type { Task } from "@/types/task";
import { useBoardPermissions } from "@/hooks/use-board-permissions";
import { EditBoardModal } from "@/components/boards/edit-board-modal";
import { DeleteBoardDialog } from "@/components/boards/delete-board-dialog";
import { MembersModal } from "@/components/members/members-modal";
import { useToast } from "@/providers/toast-provider";

interface BoardPageProps {
  params: Promise<{
    boardId: string;
  }>;
}

const EMPTY_TASKS: Task[] = [];

export default function BoardPage({ params }: BoardPageProps) {
  const { boardId } = use(params);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [isEditBoardOpen, setIsEditBoardOpen] = useState(false);
  const [isDeleteBoardOpen, setIsDeleteBoardOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Fetch full board details for ownerId and member list
  const { data: boardDetails } = useQuery({
    queryKey: ["board-details", boardId],
    queryFn: () => getBoardDetails(boardId),
  });

  const permissions = useBoardPermissions({
    ownerId: boardDetails?.ownerId,
    members: boardDetails?.members,
  });

  const createColumnMutation = useMutation({
    mutationFn: (title: string) => createColumn(boardId, title),
    onSuccess: () => {
      setNewColumnTitle("");
      setIsAddColumnOpen(false);
      showToast("Column created successfully");
      queryClient.invalidateQueries({
        queryKey: ["board-summary", boardId],
      });
      queryClient.invalidateQueries({
        queryKey: ["board-details", boardId],
      });
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      showToast(message || "Failed to create column", "error");
    },
  });

  function handleDragOver(event: DragOverEvent) {
    if (!permissions.canMoveTasks) return;
    const { active, over } = event;

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    updateKanbanTasks((current) => {
      if (!current) return current;

      let activeColumnId: string | null = null;

      for (const [columnId, tasks] of Object.entries(current)) {
        if (tasks.some((task) => task.id === activeId)) {
          activeColumnId = columnId;
          break;
        }
      }

      if (!activeColumnId) return current;

      const overColumnId =
        over.data.current?.type === "column"
          ? over.data.current.columnId
          : over.data.current?.columnId;

      if (typeof overColumnId !== "string") {
        return current;
      }

      const sourceTasks = current[activeColumnId] ?? [];
      const targetTasks = current[overColumnId] ?? [];
      const activeIndex = sourceTasks.findIndex((task) => task.id === activeId);

      if (activeIndex === -1) return current;

      if (activeColumnId === overColumnId) {
        const overIndex = targetTasks.findIndex((task) => task.id === overId);

        if (overIndex === -1 || activeIndex === overIndex) {
          return current;
        }

        return {
          ...current,
          [activeColumnId]: arrayMove(sourceTasks, activeIndex, overIndex),
        };
      }

      const draggedTask = sourceTasks[activeIndex];
      const newSourceTasks = sourceTasks.filter((task) => task.id !== activeId);
      const newTargetTasks = [...targetTasks];
      const overIndex = newTargetTasks.findIndex((task) => task.id === overId);
      const updatedTask = {
        ...draggedTask,
        columnId: overColumnId,
      };

      if (overIndex === -1) {
        newTargetTasks.push(updatedTask);
      } else {
        newTargetTasks.splice(overIndex, 0, updatedTask);
      }

      return {
        ...current,
        [activeColumnId]: newSourceTasks,
        [overColumnId]: newTargetTasks,
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!permissions.canMoveTasks) {
      setActiveTaskId(null);
      return;
    }
    const { active, over } = event;

    if (!over) {
      setActiveTaskId(null);
      return;
    }

    const taskId = String(active.id);
    let targetColumnId: string | null = null;

    if (over.data.current?.type === "column") {
      targetColumnId = over.data.current.columnId;
    } else {
      targetColumnId = over.data.current?.columnId ?? null;
    }

    if (typeof targetColumnId !== "string") {
      setActiveTaskId(null);
      return;
    }

    queueMoveTask(taskId, targetColumnId);

    setActiveTaskId(null);
  }

  function handleDragCancel() {
    setActiveTaskId(null);
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ["board-summary", boardId],
    queryFn: () => getBoardSummary(boardId),
  });

  const columnIds = useMemo(
    () => data?.columns.map((column) => column.id) ?? [],
    [data?.columns],
  );
  const {
    data: boardTasks = EMPTY_TASKS,
    isLoading: isTasksLoading,
    isError: isTasksError,
    isFetched: isTasksFetched,
  } = useQuery({
    queryKey: ["board-tasks", boardId, columnIds],
    queryFn: () => getBoardTasks(boardId, columnIds),
    enabled: columnIds.length > 0,
  });

  const [kanbanTasks, setKanbanTasks] = useState<BoardTasks | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const kanbanTasksRef = useRef<BoardTasks | null>(null);
  const moveQueueRef = useRef(Promise.resolve());

  function updateKanbanTasks(
    updater: (current: BoardTasks | null) => BoardTasks | null,
  ) {
    const current = kanbanTasksRef.current;
    const next = updater(current);

    kanbanTasksRef.current = next;
    setKanbanTasks(next);
  }

  useEffect(() => {
    const hasNoColumns = columnIds.length === 0;

    if (!hasNoColumns && !isTasksFetched) {
      return;
    }

    const grouped: BoardTasks = {};

    for (const column of data?.columns ?? []) {
      grouped[column.id] = [];
    }

    for (const task of boardTasks) {
      if (!grouped[task.columnId]) {
        grouped[task.columnId] = [];
      }

      grouped[task.columnId].push(task);
    }

    for (const columnId of Object.keys(grouped)) {
      grouped[columnId].sort((a, b) => a.position - b.position);
    }

    kanbanTasksRef.current = grouped;
    queueMicrotask(() => {
      setKanbanTasks(grouped);
    });
  }, [boardTasks, columnIds.length, data?.columns, isTasksFetched]);

  function calculatePosition(tasks: Task[], taskId: string): number | null {
    const index = tasks.findIndex((task) => task.id === taskId);

    if (index === -1) {
      return null;
    }

    const previousTask = tasks[index - 1];
    const nextTask = tasks[index + 1];

    if (!previousTask && !nextTask) {
      return 1000;
    }

    if (!previousTask) {
      return nextTask.position / 2;
    }

    if (!nextTask) {
      return previousTask.position + 1000;
    }

    return (previousTask.position + nextTask.position) / 2;
  }

  function queueMoveTask(taskId: string, targetColumnId: string) {
    moveQueueRef.current = moveQueueRef.current
      .catch(() => {})
      .then(async () => {
        const current = kanbanTasksRef.current;

        if (!current) return;

        const targetTasks = current[targetColumnId] ?? [];
        const position = calculatePosition(targetTasks, taskId);

        if (position === null) return;

        const updatedTask = await moveTask(boardId, taskId, {
          targetColumnId,
          position,
        });

        updateKanbanTasks((state) => {
          if (!state) return state;

          return {
            ...state,
            [targetColumnId]: (state[targetColumnId] ?? []).map((task) =>
              task.id === taskId ? updatedTask : task,
            ),
          };
        });

        queryClient.setQueryData<Task[]>(
          ["board-tasks", boardId, columnIds],
          (tasks = []) =>
            tasks.map((task) => (task.id === taskId ? updatedTask : task)),
        );
      });
  }

  function handleTaskCreated(task: Task) {
    updateKanbanTasks((current) => {
      if (!current) return current;

      return {
        ...current,
        [task.columnId]: [...(current[task.columnId] ?? []), task],
      };
    });

    queryClient.setQueryData<Task[]>(
      ["board-tasks", boardId, columnIds],
      (tasks = []) =>
        tasks.some((item) => item.id === task.id) ? tasks : [...tasks, task],
    );
  }

  function handleTaskDeleted(taskId: string) {
    updateKanbanTasks((current) => {
      if (!current) return current;

      return Object.fromEntries(
        Object.entries(current).map(([columnId, tasks]) => [
          columnId,
          tasks.filter((task) => task.id !== taskId),
        ]),
      );
    });

    queryClient.setQueryData<Task[]>(
      ["board-tasks", boardId, columnIds],
      (tasks = []) => tasks.filter((task) => task.id !== taskId),
    );
  }

  function handleTaskUpdated(updatedTask: Task) {
    updateKanbanTasks((current) => {
      if (!current) return current;

      return {
        ...current,
        [updatedTask.columnId]: (current[updatedTask.columnId] ?? []).map(
          (task) => (task.id === updatedTask.id ? updatedTask : task),
        ),
      };
    });

    queryClient.setQueryData<Task[]>(
      ["board-tasks", boardId, columnIds],
      (tasks = []) =>
        tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    );
  }

  function handleColumnUpdated(updatedColumn: ColumnType) {
    queryClient.setQueryData<BoardSummary>(
      ["board-summary", boardId],
      (current) =>
        current
          ? {
              ...current,
              columns: current.columns.map((column) =>
                column.id === updatedColumn.id ? updatedColumn : column,
              ),
            }
          : current,
    );
  }

  function handleColumnDeleted(columnId: string) {
    updateKanbanTasks((current) => {
      if (!current) return current;

      const remainingColumns = { ...current };
      delete remainingColumns[columnId];
      return remainingColumns;
    });

    queryClient.setQueryData<BoardSummary>(
      ["board-summary", boardId],
      (current) =>
        current
          ? {
              ...current,
              columns: current.columns.filter(
                (column) => column.id !== columnId,
              ),
            }
          : current,
    );

    queryClient.setQueryData<Task[]>(
      ["board-tasks", boardId, columnIds],
      (tasks = []) => tasks.filter((task) => task.columnId !== columnId),
    );
  }

  function handleDragStart(event: DragStartEvent) {
    if (!permissions.canMoveTasks) return;
    setActiveTaskId(String(event.active.id));
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 sm:p-8 space-y-6">
        <div className="h-6 w-32 animate-pulse bg-gray-200 rounded" />
        <div className="h-10 w-64 animate-pulse bg-gray-200 rounded" />
        <div className="flex gap-4 overflow-x-auto pt-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-80 shrink-0 h-96 animate-pulse rounded-xl bg-gray-200/70"
            />
          ))}
        </div>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center text-center">
        <div className="rounded-xl bg-red-50 p-6 border border-red-200 max-w-md">
          <h2 className="text-lg font-bold text-red-700">
            Failed to load board
          </h2>
          <p className="text-sm text-red-600 mt-1">
            This board may have been deleted or you may not have access
            permission.
          </p>
          <Link
            href="/boards"
            className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white"
          >
            <ArrowLeft
              className="mr-1.5 inline-block h-3.5 w-3.5"
              aria-hidden="true"
            />
            Back to Boards
          </Link>
        </div>
      </main>
    );
  }

  if (isTasksError) {
    return (
      <main className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center text-center">
        <div className="rounded-xl bg-red-50 p-6 border border-red-200 max-w-md">
          <h2 className="text-lg font-bold text-red-700">
            Failed to load tasks
          </h2>
          <p className="text-sm text-red-600 mt-1">
            An error occurred while loading board tasks.
          </p>
          <button
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["board-tasks", boardId],
              })
            }
            className="mt-4 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  const effectiveTasks = kanbanTasks || {};

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Workspace Subheader / Breadcrumbs */}
      <header className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
            <Link
              href="/boards"
              className="hover:text-gray-900 transition-colors"
            >
              Boards
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-semibold truncate max-w-xs">
              {data.board.title}
            </span>
          </nav>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  {data.board.title}
                </h1>

                {permissions.isOwner ? (
                  <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                    Owner
                  </span>
                ) : permissions.isEditor ? (
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                    Editor
                  </span>
                ) : (
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 border border-gray-200">
                    Viewer (Read Only)
                  </span>
                )}
              </div>

              {data.board.description && (
                <p className="mt-1 text-sm text-gray-600 max-w-2xl">
                  {data.board.description}
                </p>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsMembersOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                Members ({boardDetails?.members.length ?? 0})
              </button>

              {permissions.canEditBoard && (
                <button
                  type="button"
                  onClick={() => setIsEditBoardOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <Edit className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit Board
                </button>
              )}

              {permissions.canDeleteBoard && (
                <button
                  type="button"
                  onClick={() => setIsDeleteBoardOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete Board
                </button>
              )}

              {permissions.canManageColumns && (
                <button
                  type="button"
                  onClick={() => setIsAddColumnOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Add Column
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Add Column Inline Modal */}
      {isAddColumnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const title = newColumnTitle.trim();
              if (!title) return;
              createColumnMutation.mutate(title);
            }}
            className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-2xl border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                Add New Column
              </h2>
              <button
                type="button"
                onClick={() => setIsAddColumnOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Column Title
              </label>
              <input
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="e.g. Backlog, Review, Done..."
                className="mt-1 w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                autoFocus
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddColumnOpen(false)}
                className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  createColumnMutation.isPending || !newColumnTitle.trim()
                }
                className="rounded-lg bg-black px-3.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
              >
                {createColumnMutation.isPending
                  ? "Creating..."
                  : "Create Column"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban Board Columns Area */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-auto">
        <DndContext
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex items-start gap-5 pb-6">
            {data.columns.map((column) => (
              <Column
                key={column.id}
                boardId={boardId}
                column={column}
                tasks={effectiveTasks[column.id] ?? []}
                isTasksLoading={isTasksLoading}
                onTaskCreated={handleTaskCreated}
                onTaskUpdated={handleTaskUpdated}
                onTaskDeleted={handleTaskDeleted}
                onColumnUpdated={handleColumnUpdated}
                onColumnDeleted={handleColumnDeleted}
                canManageColumns={permissions.canManageColumns}
                canManageTasks={permissions.canManageTasks}
                canMoveTasks={permissions.canMoveTasks}
              />
            ))}

            {data.columns.length === 0 && (
              <div className="w-full rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm max-w-lg mx-auto mt-6">
                <h3 className="text-base font-bold text-gray-900">
                  No columns on this board yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {permissions.canManageColumns
                    ? "Add your first column (e.g., To Do, In Progress, Done) to start creating tasks."
                    : "The board owner hasn't added any columns yet."}
                </p>
                {permissions.canManageColumns && (
                  <button
                    type="button"
                    onClick={() => setIsAddColumnOpen(true)}
                    className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800"
                  >
                    <Plus
                      className="mr-1.5 inline-block h-4 w-4"
                      aria-hidden="true"
                    />
                    Add your first column
                  </button>
                )}
              </div>
            )}
          </div>

          <DragOverlay>
            {activeTaskId ? (
              <TaskPreview
                task={Object.values(effectiveTasks)
                  .flat()
                  .find((task) => task.id === activeTaskId)}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Edit Board Modal */}
      {isEditBoardOpen && (
        <EditBoardModal
          boardId={boardId}
          initialTitle={data.board.title}
          initialDescription={data.board.description}
          isOpen={isEditBoardOpen}
          onClose={() => setIsEditBoardOpen(false)}
        />
      )}

      {/* Delete Board Dialog */}
      {isDeleteBoardOpen && (
        <DeleteBoardDialog
          boardId={boardId}
          boardTitle={data.board.title}
          isOpen={isDeleteBoardOpen}
          onClose={() => setIsDeleteBoardOpen(false)}
          redirectToBoards={true}
        />
      )}

      {/* Members Modal */}
      {isMembersOpen && (
        <MembersModal
          boardId={boardId}
          ownerId={boardDetails?.ownerId || ""}
          isOpen={isMembersOpen}
          onClose={() => setIsMembersOpen(false)}
          canManageMembers={permissions.canManageMembers}
        />
      )}
    </main>
  );
}
