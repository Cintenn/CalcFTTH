import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { LoginBody } from "@workspace/api-zod";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

// SESSION_SECRET is required for production
const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET environment variable is not set. Required for JWT token generation.");
}

export function authMiddleware(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized", message: "No token provided" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    (req as any).userId = decoded.userId;
    (req as any).userRole = decoded.role;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized", message: "Invalid token" });
  }
}

export function adminMiddleware(req: Request, res: Response, next: Function) {
  if ((req as any).userRole !== "super_admin") {
    res.status(403).json({ error: "Forbidden", message: "Admin access required" });
    return;
  }
  next();
}

router.post("/login", async (req: Request, res: Response) => {
  try {
    logger.debug({ body: req.body }, "Login request received");
    
    const parseResult = LoginBody.safeParse(req.body);
    if (!parseResult.success) {
      logger.warn({ errors: parseResult.error.errors }, "Login validation failed");
      res.status(400).json({ error: "Bad Request", message: "Invalid input" });
      return;
    }

    const { username, password, deviceFingerprint } = parseResult.data;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);

    if (!user) {
      logger.debug({ username }, "User not found");
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!validPassword) {
      logger.debug({ username }, "Invalid password");
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }

    if (user.deviceFingerprint && user.deviceFingerprint !== deviceFingerprint && user.role !== "super_admin") {
      res.status(401).json({
        error: "DeviceBlocked",
        message: "This account is bound to a different device. Please contact admin to reset.",
      });
      return;
    }

    if (!user.deviceFingerprint) {
      await db.update(usersTable)
        .set({ deviceFingerprint })
        .where(eq(usersTable.id, user.id));
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Login failed" });
  }
});

router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    if (!user) {
      res.status(404).json({ error: "Not Found", message: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to fetch user data" });
  }
});

router.post("/logout", authMiddleware, (_req: Request, res: Response) => {
  res.json({ message: "Logged out successfully" });
});

export default router;
