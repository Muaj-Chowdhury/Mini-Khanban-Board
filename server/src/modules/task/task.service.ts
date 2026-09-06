import { Prisma } from "../../../generated/prisma/client.js";
import { AppError } from "../../errors/AppError.js";
import { prisma } from "../../lib/prisma.js";
import type {
  CreateTaskPayload,
  MoveTaskPayload,
  UpdateTaskPayload,
} from "./task.interface.js";

const MAX_SERIALIZATION_RETRIES = 3;

export class TaskService {
  async createTask(
    boardId: string,
    columnId: string,
    payload: CreateTaskPayload,
  ) {
    for (let attempt = 0; attempt < MAX_SERIALIZATION_RETRIES; attempt += 1) {
      try {
        return await prisma.$transaction(
          async (transaction) => {
            const column = await transaction.column.findFirst({
              where: { id: columnId, boardId },
              select: { id: true },
            });

            if (!column) {
              throw new AppError("Column not found", 404);
            }

            const lastTask = await transaction.task.findFirst({
              where: { columnId },
              orderBy: { position: "desc" },
              select: { position: true },
            });

            return transaction.task.create({
              data: {
                boardId,
                columnId,
                title: payload.title,
                description: payload.description ?? null,
                priority: payload.priority,
                dueDate: payload.dueDate ?? null,
                position: (lastTask?.position ?? -1) + 1,
              },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== "P2034" ||
          attempt === MAX_SERIALIZATION_RETRIES - 1
        ) {
          throw error;
        }
      }
    }

    throw new Error("Task creation failed after serialization retries");
  }

  async getTasks(boardId: string, columnId: string) {
    const column = await prisma.column.findFirst({
      where: { id: columnId, boardId },
      select: { id: true },
    });

    if (!column) {
      throw new AppError("Column not found", 404);
    }

    return prisma.task.findMany({
      where: { columnId },
      orderBy: { position: "asc" },
    });
  }

  async updateTask(
    boardId: string,
    columnId: string,
    taskId: string,
    payload: UpdateTaskPayload,
  ) {
    return prisma.$transaction(async (transaction) => {
      const column = await transaction.column.findFirst({
        where: { id: columnId, boardId },
        select: { id: true },
      });

      if (!column) {
        throw new AppError("Column not found", 404);
      }

      const result = await transaction.task.updateMany({
        where: { id: taskId, columnId },
        data: payload,
      });

      if (result.count === 0) {
        throw new AppError("Task not found", 404);
      }

      return transaction.task.findFirstOrThrow({
        where: { id: taskId, columnId },
      });
    });
  }

  async moveTask(
    boardId: string,
    taskId: string,
    targetColumnId: string,
    position: number,
  ) {
    return prisma.$transaction(async (transaction) => {
      const task = await transaction.task.findUnique({
        where: { id: taskId },
        select: { id: true, column: { select: { boardId: true } } },
      });

      if (!task) {
        throw new AppError("Task not found", 404);
      }

      if (task.column.boardId !== boardId) {
        throw new AppError("Task not found", 404);
      }

      const targetColumn = await transaction.column.findUnique({
        where: { id: targetColumnId },
        select: { id: true, boardId: true },
      });

      if (!targetColumn || targetColumn.boardId !== boardId) {
        throw new AppError("Target column not found", 404);
      }

      return transaction.task.update({
        where: { id: taskId },
        data: {
          columnId: targetColumnId,
          position,
        },
      });
    });
  }

  async deleteTask(boardId: string, taskId: string) {
    const result = await prisma.task.deleteMany({
      where: {
        id: taskId,
        column: { boardId },
      },
    });

    if (result.count === 0) {
      throw new AppError("Task not found", 404);
    }
  }
}
