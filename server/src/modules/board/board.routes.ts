import { Router } from "express";
import { BoardController } from "./board.controller.js";
import { auth } from "../../middlewares/auth.js";
import { boardAuth } from "../../middlewares/boardAuth.js";
import { requireBoardOwner } from "../../middlewares/requireBoardOwner.js";
import { MemberRole } from "../../../generated/prisma/enums.js";

const router = Router();
const boardController = new BoardController();

router.post("/", auth(), boardController.create);
router.get("/", auth(), boardController.getAll);

router.get(
  "/:boardId/summary",
  auth(),
  boardAuth(MemberRole.VIEWER),
  boardController.summary,
);

router.get(
  "/:boardId",
  auth(),
  boardAuth(MemberRole.VIEWER),
  boardController.getOne,
);

router.get(
  "/:boardId/members",
  auth(),
  boardAuth(MemberRole.VIEWER),
  boardController.getMembers,
);

router.patch(
  "/:boardId",
  auth(),
  boardAuth(MemberRole.EDITOR),
  boardController.update,
);

router.delete("/:boardId", auth(), requireBoardOwner(), boardController.remove);

router.post(
  "/:boardId/members",
  auth(),
  requireBoardOwner(),
  boardController.addMember,
);

router.delete(
  "/:boardId/members/:userId",
  auth(),
  requireBoardOwner(),
  boardController.removeMember,
);

export const boardRoutes = router;
