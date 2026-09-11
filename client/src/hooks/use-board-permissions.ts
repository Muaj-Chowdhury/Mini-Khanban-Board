import { useMemo } from "react";
import { useAuth } from "@/providers/auth-provider";

export type BoardRole = "OWNER" | "EDITOR" | "VIEWER" | "NONE";

export interface BoardMemberItem {
  id: string;
  role: "VIEWER" | "EDITOR";
  user: {
    id: string;
    name?: string | null;
    email: string;
  };
}

export interface BoardPermissionContext {
  ownerId?: string;
  members?: BoardMemberItem[];
}

export function useBoardPermissions(context?: BoardPermissionContext) {
  const { user } = useAuth();
  const ownerId = context?.ownerId;
  const members = context?.members;

  return useMemo(() => {
    if (!user) {
      return {
        role: "NONE" as BoardRole,
        isOwner: false,
        isEditor: false,
        isViewer: false,
        canEditBoard: false,
        canDeleteBoard: false,
        canManageMembers: false,
        canManageColumns: false,
        canManageTasks: false,
        canMoveTasks: false,
      };
    }

    const isOwner = Boolean(ownerId && user.id === ownerId);

    let memberRole: "VIEWER" | "EDITOR" | null = null;
    if (members) {
      const currentMember = members.find((m) => m.user.id === user.id);
      if (currentMember) {
        memberRole = currentMember.role;
      }
    }

    const role: BoardRole = isOwner
      ? "OWNER"
      : memberRole === "EDITOR"
      ? "EDITOR"
      : memberRole === "VIEWER"
      ? "VIEWER"
      : "NONE";

    const canEditBoard = isOwner;
    const canDeleteBoard = isOwner;
    const canManageMembers = isOwner;
    const canManageColumns = isOwner || role === "EDITOR";
    const canManageTasks = isOwner || role === "EDITOR";
    const canMoveTasks = isOwner || role === "EDITOR";

    return {
      role,
      isOwner,
      isEditor: role === "EDITOR",
      isViewer: role === "VIEWER",
      canEditBoard,
      canDeleteBoard,
      canManageMembers,
      canManageColumns,
      canManageTasks,
      canMoveTasks,
    };
  // members array: compare by identity only — callers must stabilize it (e.g. from useQuery data)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, ownerId, members]);
}
