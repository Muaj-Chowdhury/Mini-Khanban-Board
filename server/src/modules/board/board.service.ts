import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError.js";
import type { ShareBoardPayload } from "./board.interface.js";
import type {
  ValidCreateBoardPayload,
  ValidUpdateBoardPayload,
} from "./board.validation.js";

export class BoardService {
  async createBoard(userId: string, payload: ValidCreateBoardPayload) {
    const board = await prisma.board.create({
      data: {
        title: payload.title,
        description: payload.description ?? null,
        ownerId: userId,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return board;
  }

  async getUserBoards(userId: string) {
    const boards = await prisma.board.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { members: true, columns: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return boards;
  }

  async getBoardById(boardId: string) {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        columns: {
          orderBy: { position: "asc" },
          include: {
            _count: {
              select: { tasks: true },
            },
          },
        },
      },
    });

    if (!board) {
      throw new AppError("Board not found", 404);
    }

    return board;
  }

  async getBoardSummary(boardId: string) {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: {
        id: true,
        title: true,
        description: true,
        columns: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            position: true,
            _count: {
              select: {
                tasks: true,
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw new AppError("Board not found", 404);
    }

    return {
      board: {
        id: board.id,
        title: board.title,
        description: board.description,
      },
      columns: board.columns.map((column) => ({
        id: column.id,
        title: column.title,
        position: column.position,
        taskCount: column._count.tasks,
      })),
    };
  }

  async getMembers(boardId: string) {
    return prisma.boardMember.findMany({
      where: { boardId },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async updateBoard(boardId: string, payload: ValidUpdateBoardPayload) {
    const board = await prisma.board.update({
      where: { id: boardId },
      data: {
        ...(payload.title !== undefined && { title: payload.title }),
        ...(payload.description !== undefined && {
          description: payload.description,
        }),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return board;
  }

  async deleteBoard(boardId: string) {
    await prisma.board.delete({
      where: { id: boardId },
    });
  }

  async addMember(
    boardId: string,
    ownerId: string,
    payload: ShareBoardPayload,
  ) {
    if (payload.userId === ownerId) {
      throw new AppError("The board owner cannot be added as a member", 400);
    }

    return prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        throw new AppError("Target user not found", 404);
      }

      const existingMember = await transaction.boardMember.findUnique({
        where: { boardId_userId: { boardId, userId: payload.userId } },
      });

      if (existingMember) {
        throw new AppError("User is already a member of this board", 409);
      }

      return transaction.boardMember.create({
        data: {
          boardId,
          userId: payload.userId,
          role: payload.role === "VIEWER" ? "VIEWER" : "EDITOR",
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });
    });
  }

  async removeMember(boardId: string, userId: string) {
    await prisma.$transaction(async (transaction) => {
      const board = await transaction.board.findUnique({
        where: { id: boardId },
        select: { ownerId: true },
      });

      if (!board) {
        throw new AppError("Board not found", 404);
      }

      if (board.ownerId === userId) {
        throw new AppError("The board owner cannot be removed", 400);
      }

      const member = await transaction.boardMember.findUnique({
        where: { boardId_userId: { boardId, userId } },
      });

      if (!member) {
        throw new AppError("Board member not found", 404);
      }

      await transaction.boardMember.delete({
        where: { id: member.id },
      });
    });
  }
}
