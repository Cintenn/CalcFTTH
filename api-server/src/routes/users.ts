import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { CreateUserBody } from "@workspace/api-zod";
import { authMiddleware, adminMiddleware } from "./auth.js";

const router: IRouter = Router();

router.get("/", authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const users = await db.select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    }).from(usersTable);

    res.json({
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to fetch users" });
  }
});

router.post("/", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const parseResult = CreateUserBody.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Bad Request", message: "Invalid input" });
      return;
    }

    const { username, email, password, role } = parseResult.data;
    const passwordHash = await bcrypt.hash(password, 10);

    const [user] = await db
      .insert(usersTable)
      .values({ username, email, passwordHash, role })
      .returning();

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err: any) {
    // Check for unique constraint violation
    if (err.code === "23505") {
      res.status(409).json({ error: "Conflict", message: "Username already exists" });
    } else {
      res.status(500).json({ error: "Internal Server Error", message: "Failed to create user" });
    }
  }
});

router.delete("/:id", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Bad Request", message: "Invalid user ID" });
      return;
    }
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to delete user" });
  }
});

router.post("/:id/reset-device", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Bad Request", message: "Invalid user ID" });
      return;
    }
    await db.update(usersTable).set({ deviceFingerprint: null }).where(eq(usersTable.id, id));
    res.json({ message: "Device fingerprint reset successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to reset device" });
  }
});

export default router;
