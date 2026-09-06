import { Prisma } from "../../../generated/prisma/client.js";
import { AppError } from "../../errors/AppError.js";
import { prisma } from "../../lib/prisma.js";
import type { CreateColumnPayload } from "./column.interface.js";
import type { ValidUpdateColumnPayload } from "./column.validation.js";

const MAX_SERIALIZATION_RETRIES = 3;

export class ColumnService {
  async getColumns(boardId: string) {
    return prisma.column.findMany({
      where: { boardId },
      orderBy: { position: "asc" },
    });
  }

  async createColumn(boardId: string, payload: CreateColumnPayload) {
    for (let attempt = 0; attempt < MAX_SERIALIZATION_RETRIES; attempt += 1) {
      try {
        return await prisma.$transaction(
          async (transaction) => {
            const lastColumn = await transaction.column.findFirst({
              where: { boardId },
              orderBy: { position: "desc" },
              select: { position: true },
            });

            return transaction.column.create({
              data: {
                boardId,
                title: payload.title,
                position: (lastColumn?.position ?? -1) + 1,
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

    throw new Error("Column creation failed after serialization retries");
  }

  async updateColumn(
    boardId: string,
    columnId: string,
    payload: ValidUpdateColumnPayload,
  ) {
    return prisma.$transaction(async (transaction) => {
      const result = await transaction.column.updateMany({
        where: { id: columnId, boardId },
        data: payload,
      });

      if (result.count === 0) {
        throw new AppError("Column not found", 404);
      }

      return transaction.column.findFirstOrThrow({
        where: { id: columnId, boardId },
      });
    });
  }

  async deleteColumn(boardId: string, columnId: string) {
    const result = await prisma.column.deleteMany({
      where: { id: columnId, boardId },
    });

    if (result.count === 0) {
      throw new AppError("Column not found", 404);
    }
  }
}
