import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const authService = new AuthService();

export class AuthController {
  register = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const user = await authService.register(payload);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User created successfully",
      data: user,
    });
  });

  login = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    const { accessToken, refreshToken } = result;
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User logged in successfully",
      data: result,
    });
  });

  getProfile = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.getProfile(req.user?.id as string);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User profile fetched successfully",
      data: result,
    });
  });
}
