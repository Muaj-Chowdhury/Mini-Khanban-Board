import type { Request, Response } from "express";
import { BoardService } from "./board.service.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import {
  validateCreateBoard,
  validateShareBoard,
  validateUpdateBoard,
} from "./board.validation.js";
import httpStatus from "http-status";

const boardService = new BoardService();

export class BoardController {
  addMember = catchAsync(async (req: Request, res: Response) => {
    const boardId = req.params.boardId as string;
    const payload = validateShareBoard(req.body);
    const member = await boardService.addMember(boardId, req.user!.id, payload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Board member added successfully",
      data: member,
    });
  });

  removeMember = catchAsync(async (req: Request, res: Response) => {
    const boardId = req.params.boardId as string;
    const userId = req.params.userId as string;

    await boardService.removeMember(boardId, userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Board member removed successfully",
      data: null,
    });
  });

  create = catchAsync(async (req: Request, res: Response) => {
    const payload = validateCreateBoard(req.body);
    const userId = req.user!.id;

    const board = await boardService.createBoard(userId, payload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Board created successfully",
      data: board,
    });
  });

  getAll = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const boards = await boardService.getUserBoards(userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Boards fetched successfully",
      data: boards,
    });
  });

  getOne = catchAsync(async (req: Request, res: Response) => {
    const boardId = req.params.boardId as string;

    const board = await boardService.getBoardById(boardId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Board fetched successfully",
      data: board,
    });
  });

  summary = catchAsync(async (req: Request, res: Response) => {
    const boardId = req.params.boardId as string;

    const summary = await boardService.getBoardSummary(boardId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Board summary fetched successfully",
      data: summary,
    });
  });

  getMembers = catchAsync(async (req: Request, res: Response) => {
    const boardId = req.params.boardId as string;

    const members = await boardService.getMembers(boardId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Board members fetched successfully",
      data: members,
    });
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const boardId = req.params.boardId as string;
    const payload = validateUpdateBoard(req.body);

    const board = await boardService.updateBoard(boardId, payload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Board updated successfully",
      data: board,
    });
  });

  remove = catchAsync(async (req: Request, res: Response) => {
    const boardId = req.params.boardId as string;

    await boardService.deleteBoard(boardId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Board deleted successfully",
      data: null,
    });
  });
}
