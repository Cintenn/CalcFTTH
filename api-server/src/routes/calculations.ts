import { Router, type IRouter, type Request, type Response } from "express";
import {
  CalculateFindRatioBody,
  CalculateSplitterRatioBody,
  CalculateJalurLurusBody,
  CalculateJalurPercabanganBody,
  CalculateMixRatioBody,
} from "@workspace/api-zod";
import {
  calcFindRatio,
  calcSplitterRatio,
  calcJalurLurus,
  calcJalurPercabangan,
  calcMixRatio,
} from "../lib/ftth-calc.js";
import { authMiddleware } from "./auth.js";

const router: IRouter = Router();

router.post("/find-ratio", authMiddleware, (req: Request, res: Response) => {
  try {
    const parseResult = CalculateFindRatioBody.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Bad Request", message: "Invalid input" });
      return;
    }
    const { laserPower, connector, splicing, cableLength, odpType, ratioSmall } = parseResult.data;
    const result = calcFindRatio(laserPower, connector, splicing, cableLength, odpType, ratioSmall);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Calculation failed" });
  }
});

router.post("/splitter-ratio", authMiddleware, (req: Request, res: Response) => {
  try {
    const parseResult = CalculateSplitterRatioBody.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Bad Request", message: "Invalid input" });
      return;
    }
    const { laserPower, connector, splicing, cableLength, odpType, targetPower } = parseResult.data;
    const result = calcSplitterRatio(laserPower, connector, splicing, cableLength, odpType, targetPower ?? -28);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Calculation failed" });
  }
});

router.post("/jalur-lurus", authMiddleware, (req: Request, res: Response) => {
  try {
    const parseResult = CalculateJalurLurusBody.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Bad Request", message: "Invalid input" });
      return;
    }
    const { laserPower, rows } = parseResult.data;
    const result = calcJalurLurus(laserPower, rows);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Calculation failed" });
  }
});

router.post("/jalur-percabangan", authMiddleware, (req: Request, res: Response) => {
  try {
    const parseResult = CalculateJalurPercabanganBody.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Bad Request", message: "Invalid input" });
      return;
    }
    const { laserPower, connector, splicing, cable, cableOdp, odpType, kebOdp } = parseResult.data;
    const result = calcJalurPercabangan(laserPower, connector, splicing, cable, cableOdp, odpType, kebOdp ?? 3);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Calculation failed" });
  }
});

router.post("/mix-ratio", authMiddleware, (req: Request, res: Response) => {
  try {
    const parseResult = CalculateMixRatioBody.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Bad Request", message: "Invalid input" });
      return;
    }
    const { laserPower, connector, splicing, cableLength, customRatio, odc1Ratio, odc2Ratio, odc3Ratio, odpType } =
      parseResult.data;
    const result = calcMixRatio(
      laserPower,
      connector,
      splicing,
      cableLength,
      customRatio ?? "50:50",
      odc1Ratio ?? "50:50",
      odc2Ratio ?? "50:50",
      odc3Ratio ?? "50:50",
      odpType
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Calculation failed" });
  }
});

export default router;
