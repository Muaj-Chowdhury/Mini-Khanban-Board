"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, X } from "lucide-react";
import {
  addBoardMember,
  getBoardMembers,
  removeBoardMember,
} from "@/services/board.service";
import { useToast } from "@/providers/toast-provider";
import { useAuth } from "@/providers/auth-provider";

interface MembersModalProps {
  boardId: string;
  ownerId: string;
  isOpen: boolean;
  onClose: () => void;
  canManageMembers: boolean;
}

export function MembersModal({
  boardId,
  isOpen,
  onClose,
  canManageMembers,
}: MembersModalProps) {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [userIdInput, setUserIdInput] = useState("");
  const [roleInput, setRoleInput] = useState<"VIEWER" | "EDITOR">("EDITOR");

  const membersQuery = useQuery({
    queryKey: ["board-members", boardId],
    queryFn: () => getBoardMembers(boardId),
    enabled: isOpen,
  });

  const addMemberMutation = useMutation({
    mutationFn: () =>
      addBoardMember(boardId, {
        userId: userIdInput.trim(),
        role: roleInput,
      }),
    onSuccess: () => {
      showToast("Board member added successfully");
      setUserIdInput("");
      queryClient.invalidateQueries({ queryKey: ["board-members", boardId] });
      queryClient.invalidateQueries({ queryKey: ["board-details", boardId] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to add member";
      showToast(message, "error");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeBoardMember(boardId, userId),
    onSuccess: () => {
      showToast("Member removed successfully");
      queryClient.invalidateQueries({ queryKey: ["board-members", boardId] });
      queryClient.invalidateQueries({ queryKey: ["board-details", boardId] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to remove member";
      showToast(message, "error");
    },
  });

  if (!isOpen) return null;

  function handleAddMember(e: FormEvent) {
    e.preventDefault();
    if (!userIdInput.trim()) return;
    addMemberMutation.mutate();
  }

  const members = membersQuery.data || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg space-y-5 rounded-xl bg-white p-6 shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Board Members
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage user roles and access to this board.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {canManageMembers && (
          <form
            onSubmit={handleAddMember}
            className="rounded-lg bg-gray-50 p-3.5 border border-gray-200 space-y-3"
          >
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Add Member
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="User ID (UUID)"
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                required
              />
              <select
                value={roleInput}
                onChange={(e) =>
                  setRoleInput(e.target.value as "VIEWER" | "EDITOR")
                }
                className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm bg-white focus:border-black focus:outline-none"
              >
                <option value="EDITOR">EDITOR</option>
                <option value="VIEWER">VIEWER</option>
              </select>
              <button
                type="submit"
                disabled={addMemberMutation.isPending || !userIdInput.trim()}
                className="rounded-lg bg-black px-3.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
              >
                {addMemberMutation.isPending ? "Adding..." : "Add"}
              </button>
            </div>
          </form>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {membersQuery.isLoading ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Loading members...
            </div>
          ) : (
            <>
              {members.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">
                  No explicit members added yet.
                </div>
              ) : (
                members.map((member) => {
                  const isCurrent = currentUser?.id === member.user.id;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                          {(member.user.name || member.user.email)
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {member.user.name || member.user.email}
                            {isCurrent && (
                              <span className="ml-2 text-xs font-normal text-gray-500">
                                (You)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {member.user.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                            member.role === "EDITOR"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {member.role}
                        </span>

                        {canManageMembers && (
                          <button
                            type="button"
                            onClick={() =>
                              removeMemberMutation.mutate(member.user.id)
                            }
                            disabled={removeMemberMutation.isPending}
                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Remove member"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
