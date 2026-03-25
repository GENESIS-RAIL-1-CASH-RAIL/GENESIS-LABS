// ═══════════════════════════════════════════════════════════════════════
// GENESIS LABS — The Weapons Forge
// Port 8845 | Under DARPA | Zero Copy Gate via SOP-101
// "Their apple, our X. We NEVER copy."
// ═══════════════════════════════════════════════════════════════════════

import express from "express";
import { LabsService } from "./services/labs.service";
import type { DarpaWorkOrderPayload, DefensiveThreatPayload } from "./types";

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || "8845", 10);
const LABS_ENABLED = process.env.LABS_ENABLED !== "false";

// ── Env Vars ──────────────────────────────────────────────────────────
const DARPA_URL = process.env.DARPA_URL || "http://genesis-darpa:8840";
const SKUNKWORKS_URL = process.env.SKUNKWORKS_URL || "http://genesis-skunkworks:8841";
const CIA_URL = process.env.CIA_URL || "http://genesis-cia:8797";
const WHITEBOARD_URL = process.env.WHITEBOARD_URL || "http://genesis-whiteboard:8710";
const SOP101_URL = process.env.SOP101_URL || "http://genesis-sop-101-kernel:8800";
const GTC_URL = process.env.GTC_URL || "http://genesis-gtc:8650";
const RED_TEAM_URL = process.env.RED_TEAM_URL || "http://genesis-red-aggressor:8801";
const ACADEMY_URL = process.env.ACADEMY_URL || "http://genesis-academy:8730";

const labs = new LabsService();

// ═══════════════════════════════════════════════════════════════════════
// ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════

// ── Health & State ────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    service: "genesis-labs",
    status: LABS_ENABLED ? "OPERATIONAL" : "DISABLED",
    mode: "SIMULATION",
    port: PORT,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/state", (_req, res) => {
  res.json(labs.getState());
});

// ── Task Intake ───────────────────────────────────────────────────────

app.post("/work-order/receive", (req, res) => {
  if (!LABS_ENABLED) return res.status(503).json({ error: "Labs disabled" });
  const payload = req.body as DarpaWorkOrderPayload;
  if (!payload.title || !payload.description) {
    return res.status(400).json({ error: "Missing title or description" });
  }
  const task = labs.receiveWorkOrder(payload);
  console.log(`[LABS] Work order received: ${task.taskId} — ${task.title} [${task.killChainGrade}/${task.sourceGrade}]`);

  // Notify GTC
  fire(GTC_URL, "/ingest", { source: "GENESIS_LABS", type: "LABS_TASK_RECEIVED", data: { taskId: task.taskId, title: task.title, grade: task.killChainGrade } });

  res.status(201).json(task);
});

app.post("/threat/receive", (req, res) => {
  if (!LABS_ENABLED) return res.status(503).json({ error: "Labs disabled" });
  const payload = req.body as DefensiveThreatPayload;
  if (!payload.title || !payload.description) {
    return res.status(400).json({ error: "Missing title or description" });
  }
  const task = labs.receiveDefensiveTask(payload);
  console.log(`[LABS] Defensive threat received: ${task.taskId} — ${task.title} [${task.killChainGrade}]`);

  fire(GTC_URL, "/ingest", { source: "GENESIS_LABS", type: "LABS_TASK_RECEIVED", data: { taskId: task.taskId, title: task.title, mode: "DEFENSIVE" } });

  res.status(201).json(task);
});

// ── Task Queries ──────────────────────────────────────────────────────

app.get("/tasks", (req, res) => {
  const { status, mode, grade } = req.query as { status?: string; mode?: string; grade?: string };
  res.json(labs.getTasks({ status, mode, grade }));
});

app.get("/task/:id", (req, res) => {
  const task = labs.getTask(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

// ── Stage Triggers ────────────────────────────────────────────────────

app.post("/task/:id/dissect", (req, res) => {
  if (!LABS_ENABLED) return res.status(503).json({ error: "Labs disabled" });
  const result = labs.dissect(req.params.id);
  if (!result) return res.status(400).json({ error: "Task not found or not in TRIAGED status" });
  console.log(`[LABS] Dissected: ${req.params.id} — kill=${result.killDecision}`);
  res.json(result);
});

app.post("/task/:id/reconstruct", (req, res) => {
  if (!LABS_ENABLED) return res.status(503).json({ error: "Labs disabled" });
  const result = labs.reconstruct(req.params.id);
  if (!result) return res.status(400).json({ error: "Task not found or not in DISSECTED status" });
  console.log(`[LABS] Reconstructed: ${req.params.id} — ${result.novelElements.length} novel elements`);
  res.json(result);
});

app.post("/task/:id/harden", (req, res) => {
  if (!LABS_ENABLED) return res.status(503).json({ error: "Labs disabled" });
  const result = labs.harden(req.params.id);
  if (!result) return res.status(400).json({ error: "Task not found or not in RECONSTRUCTED status" });
  console.log(`[LABS] Hardened: ${req.params.id} — survival ${result.survivalRate}%`);
  res.json(result);
});

app.post("/task/:id/gate", async (req, res) => {
  if (!LABS_ENABLED) return res.status(503).json({ error: "Labs disabled" });
  const result = await labs.runZeroCopyGate(req.params.id);
  if (!result) return res.status(400).json({ error: "Task not found or not in HARDENED status" });

  if (!result.passed) {
    fire(GTC_URL, "/ingest", { source: "GENESIS_LABS", type: "LABS_WEAPON_BLOCKED", data: { taskId: req.params.id, reason: `orig=${result.originalityRatio}%, sop=${result.sopVerdict}` } });
  }

  res.json(result);
});

app.post("/task/:id/release", (req, res) => {
  if (!LABS_ENABLED) return res.status(503).json({ error: "Labs disabled" });
  const weapon = labs.releaseWeapon(req.params.id);
  if (!weapon) return res.status(400).json({ error: "Task not found or not in CLEARED status" });

  labs.distributeWeapon(weapon);
  console.log(`[LABS] WEAPON RELEASED: ${weapon.weaponId} — ${weapon.name} [${weapon.category}]`);
  res.status(201).json(weapon);
});

app.post("/task/:id/pipeline", async (req, res) => {
  if (!LABS_ENABLED) return res.status(503).json({ error: "Labs disabled" });
  const task = await labs.processFullPipeline(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  console.log(`[LABS] Pipeline complete: ${task.taskId} — status=${task.status}`);
  res.json(task);
});

// ── Weapons Catalogue ─────────────────────────────────────────────────

app.get("/weapons", (req, res) => {
  let weapons = labs.getWeaponsCatalogue();
  const { status, category } = req.query as { status?: string; category?: string };
  if (status) weapons = weapons.filter(w => w.status === status);
  if (category) weapons = weapons.filter(w => w.category === category);
  res.json(weapons);
});

app.get("/weapon/:id", (req, res) => {
  const weapon = labs.getWeapon(req.params.id);
  if (!weapon) return res.status(404).json({ error: "Weapon not found" });
  res.json(weapon);
});

app.post("/weapon/:id/performance", (req, res) => {
  const { pnl, won } = req.body as { pnl: number; won: boolean };
  if (typeof pnl !== "number" || typeof won !== "boolean") {
    return res.status(400).json({ error: "Missing pnl (number) or won (boolean)" });
  }
  const weapon = labs.updateWeaponPerformance(req.params.id, pnl, won);
  if (!weapon) return res.status(404).json({ error: "Weapon not found" });
  res.json(weapon.livePerformance);
});

app.post("/weapon/:id/review", (req, res) => {
  const weapon = labs.reviewWeapon(req.params.id);
  if (!weapon) return res.status(404).json({ error: "Weapon not found" });
  res.json(weapon);
});

app.post("/weapon/:id/retire", (req, res) => {
  const { reason } = req.body as { reason?: string };
  const weapon = labs.retireWeapon(req.params.id, reason || "Manual retirement");
  if (!weapon) return res.status(404).json({ error: "Weapon not found" });
  res.json(weapon);
});

// ── Sources ───────────────────────────────────────────────────────────

app.get("/sources", (_req, res) => {
  res.json(labs.getSourceProfiles());
});

// ── Decay Clock ───────────────────────────────────────────────────────

app.post("/decay/check", (_req, res) => {
  const result = labs.runDecayCheck();
  console.log(`[LABS] Manual decay check: ${result.reviewed} flagged for review`);

  if (result.reviewed > 0) {
    fire(GTC_URL, "/ingest", { source: "GENESIS_LABS", type: "LABS_DECAY_TRIGGERED", data: { reviewed: result.reviewed, expired: result.expired } });
  }

  res.json(result);
});

// ── Provenance ────────────────────────────────────────────────────────

app.get("/provenance/:taskId", (req, res) => {
  const task = labs.getTask(req.params.taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const provenance = {
    taskId: task.taskId,
    title: task.title,
    mode: task.mode,
    status: task.status,
    sourceName: task.sourceName,
    sourceUrl: task.sourceUrl,
    sourceGrade: task.sourceGrade,
    killChainGrade: task.killChainGrade,
    originalAbstract: task.originalAbstract,
    coreConcept: task.coreConcept,
    dissection: task.dissection ? {
      concept: task.dissection.concept,
      mechanism: task.dissection.mechanism,
      killDecision: task.dissection.killDecision,
      dissectedAt: task.dissection.dissectedAt,
    } : null,
    reconstruction: task.reconstruction ? {
      novelElements: task.reconstruction.novelElements,
      originalDelta: task.reconstruction.originalDelta,
      combinedWith: task.reconstruction.combinedWith,
      refereeConfidence: task.reconstruction.refereeVerdict.confidence,
      contradictions: task.reconstruction.refereeVerdict.contradictions.length,
      reconstructedAt: task.reconstruction.reconstructedAt,
    } : null,
    hardening: task.hardening ? {
      survivalRate: task.hardening.survivalRate,
      assaultCount: task.hardening.redTeamAssaults.length,
      hardenedAt: task.hardening.hardenedAt,
    } : null,
    zeroCopyResult: task.zeroCopyResult,
    weapon: task.weapon ? {
      weaponId: task.weapon.weaponId,
      name: task.weapon.name,
      birthCertificate: task.weapon.birthCertificate,
      decayClock: task.weapon.decayClock,
    } : null,
  };

  res.json(provenance);
});

// ═══════════════════════════════════════════════════════════════════════
// PATROL LOOPS
// ═══════════════════════════════════════════════════════════════════════

function fire(baseUrl: string, path: string, payload: unknown): void {
  fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000),
  }).catch(() => { /* fire and forget */ });
}

// 1. Decay Clock Check — every 1 hour
setInterval(() => {
  if (!LABS_ENABLED) return;
  const result = labs.runDecayCheck();
  if (result.reviewed > 0) {
    console.log(`[LABS] Patrol: decay check — ${result.reviewed} weapons flagged for review`);
    fire(GTC_URL, "/ingest", { source: "GENESIS_LABS", type: "LABS_DECAY_TRIGGERED", data: result });
  }
}, 60 * 60 * 1000);

// 2. Task Pipeline Auto-Advance — every 5 minutes
// Auto-advances PRIORITY and ROUTINE tasks through stages
setInterval(async () => {
  if (!LABS_ENABLED) return;
  const tasks = labs.getTasks({ status: "TRIAGED" });
  const eligible = tasks.filter(t => t.killChainGrade === "PRIORITY" || t.killChainGrade === "ROUTINE");

  for (const task of eligible.slice(0, 3)) { // Max 3 per cycle
    try {
      await labs.processFullPipeline(task.taskId);
      console.log(`[LABS] Auto-pipeline: ${task.taskId} → ${labs.getTask(task.taskId)?.status}`);
    } catch (err) {
      console.error(`[LABS] Auto-pipeline error for ${task.taskId}:`, err);
    }
  }
}, 5 * 60 * 1000);

// 3. Red Team Heartbeat — every 30 minutes
// Reports Labs activity to Red Aggressor Force for monitoring
setInterval(() => {
  if (!LABS_ENABLED) return;
  const state = labs.getState();
  fire(RED_TEAM_URL, "/event", {
    source: "GENESIS_LABS",
    type: "LABS_HEARTBEAT",
    data: {
      totalReceived: state.totalTasksReceived,
      totalReleased: state.totalReleased,
      totalKilled: state.totalKilled,
      totalBlocked: state.totalBlocked,
      activeWeapons: state.activeWeapons,
      reviewDueWeapons: state.reviewDueWeapons,
      timestamp: new Date().toISOString(),
    },
  });
}, 30 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("[LABS] GENESIS LABS — The Weapons Forge");
  console.log(`[LABS] Port: ${PORT} | Mode: SIMULATION`);
  console.log("[LABS] Under DARPA | Zero Copy Gate via SOP-101");
  console.log("[LABS] Pipeline: DISSECT → RECONSTRUCT → HARDEN → GATE → RELEASE");
  console.log("[LABS] Dropbox Protocol: 5 AI slots + deterministic referee");
  console.log("[LABS] Contradiction Mining: ECHO slot (always)");
  console.log(`[LABS] Source Profiles: ${labs.getSourceProfiles().length} seeded`);
  console.log("[LABS] \"Their apple, our X. We NEVER copy.\"");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
});
