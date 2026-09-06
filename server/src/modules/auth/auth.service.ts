import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { ILoginUser, RegisterUserPayload } from "./auth.interface";
import { JwtPayload, SignOptions } from "jsonwebtoken";
import config from "../../config";
import { generateToken } from "../../utils/jwt";
import { AppError } from "../../errors/AppError";
export class AuthService {
  async register(payload: RegisterUserPayload) {
    // Business logic for user registration
    const { name, email, password } = payload;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const createUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: createUser.id },
      omit: { passwordHash: true },
    });

    return user;
  }

  async login(credentials: ILoginUser) {
    // Business logic for user login
    const { email, password } = credentials;
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    const jwtPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
    } as JwtPayload;

    const accessToken = generateToken(
      jwtPayload,
      config.jwt_access_secret,
      config.jwt_access_expires_in as SignOptions["expiresIn"],
    );

    const refreshToken = generateToken(
      jwtPayload,
      config.jwt_refresh_secret,
      config.jwt_refresh_expires_in as SignOptions["expiresIn"],
    );

    return { accessToken, refreshToken };
  }

  async getProfile(userId: string) {
    // Business logic for getting user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      omit: { passwordHash: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }
}
