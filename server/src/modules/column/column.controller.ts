import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { ColumnService } from "./column.service.js";
import {
  validateCreateColumn,
  validateUpdateColumn,
} from "./column.validation.js";

const columnService = new ColumnService();

export class ColumnController {
  get = catchAsync(async (req: Request, res: Response) => {
    const boardId = req.params.boardId as string;
    const columns = await columnService.getColumns(boardId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Columns fetched successfully",
      data: columns,
    });
  });

  create = catchAsync(async (req: Request, res: Response) => {
    const boardId = req.params.boardId as string;
    const payload = validateCreateColumn(req.body);
    const column = await columnService.createColumn(boardId, payload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Column created successfully",
      data: column,
    });
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const boardId = req.params.boardId as string;
    const columnId = req.params.columnId as string;
    const payload = validateUpdateColumn(req.body);
    const column = await columnService.updateColumn(boardId, columnId, payload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Column updated successfully",
      data: column,
    });
  });

  remove = catchAsync(async (req: Request, res: Response) => {
    const boardId = req.params.boardId as string;
    const columnId = req.params.columnId as string;

    await columnService.deleteColumn(boardId, columnId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Column deleted successfully",
      data: null,
    });
  });
}
