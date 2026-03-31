import { Router, type IRouter, type Request, type Response } from "express";
import { db, projectsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { SaveProjectBody } from "@workspace/api-zod";
import { authMiddleware } from "./auth.js";

const router: IRouter = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const projects = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.userId, userId))
      .orderBy(desc(projectsTable.createdAt));

    res.json({
      projects: projects.map((p) => ({
        id: p.id,
        projectName: p.projectName,
        calculationType: p.calculationType,
        inputs: p.inputs,
        results: p.results,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to fetch projects" });
  }
});

router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const parseResult = SaveProjectBody.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Bad Request", message: "Invalid input" });
      return;
    }

    const { projectName, calculationType, inputs, results } = parseResult.data;

    const [project] = await db
      .insert(projectsTable)
      .values({ userId, projectName, calculationType, inputs, results })
      .returning();

    res.status(201).json({
      id: project.id,
      projectName: project.projectName,
      calculationType: project.calculationType,
      inputs: project.inputs,
      results: project.results,
      createdAt: project.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to save project" });
  }
});

router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Bad Request", message: "Invalid project ID" });
      return;
    }

    const [project] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, userId)))
      .limit(1);

    if (!project) {
      res.status(404).json({ error: "Not Found", message: "Project not found" });
      return;
    }

    res.json({
      id: project.id,
      projectName: project.projectName,
      calculationType: project.calculationType,
      inputs: project.inputs,
      results: project.results,
      createdAt: project.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to fetch project" });
  }
});

router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Bad Request", message: "Invalid project ID" });
      return;
    }

    await db
      .delete(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, userId)));

    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to delete project" });
  }
});

export default router;
