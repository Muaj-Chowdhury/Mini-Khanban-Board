import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

export const generateToken = (
  payload: JwtPayload,
  secret: string,
  expiresIn: SignOptions["expiresIn"],
) => {
  return jwt.sign(payload, secret, {
    expiresIn,
  } as SignOptions);
};

export const verifyToken = (token: string, secret: string) => {
  try {
    const verifiedToken = jwt.verify(token, secret);
    return {
      success: true,
      data: verifiedToken,
    };
  } catch (error: any) {
    // Token verification failed - could be expired or tampered
    console.log("Token verification failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
