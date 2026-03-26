// ═══════════════════════════════════════════════════════════════════════
// BACKLOG SERVICE — Weapons Development Monitor
// Mirrors WEAPONS_DEVELOPMENT.md — the persistent backlog of ideas that
// cannot be built today due to tech, capital, or regulatory constraints.
//
// Labs permanently monitors this backlog. When constraints lift, entries
// move to FORGE_READY and enter the forge pipeline. When a weapon
// graduates and matches a backlog entry, it moves to DEPLOYED.
//
// "The spark never dies. It waits in the backlog until the world is ready."
// ═══════════════════════════════════════════════════════════════════════

import type { BacklogEntry, BacklogPriority, BacklogStatus, DeploymentClass, WeaponRecord } from "../types";

const SEED_ENTRIES: Omit<BacklogEntry, "lastCheckedAt">[] = [
  {
    id: "WD-001",
    title: "Self-Supervised Sentry Classifier (ML-Driven)",
    origin: "Lattice Phantom Round 2 (Grok, 2026-03-25)",
    concept: "Replace heuristic-based rival classification with ML models retrained daily on live classified data. Self-supervised + reinforcement learning.",
    blocker: "NVIDIA Phase 2B — requires T4/A10G GPU tier (~£50-200/mo). Phase 2A pipes already laid.",
    prerequisites: ["Sentry (8846)", "NVIDIA Grind pipeline"],
    priority: "HIGH",
    status: "BACKLOG",
    deploymentClasses: ["RECON", "DEFENCE"],
    estimatedLift: "When GPU tier provisioned. Models train on accumulated Sentry corpus.",
    addedAt: "2026-03-25T00:00:00.000Z",
    deployedAt: null,
    deployedWeaponId: null,
  },
  {
    id: "WD-002",
    title: "Cross-Domain Sensor Fusion",
    origin: "Lattice Phantom Round 2 (Grok, 2026-03-25)",
    concept: "Sentry correlates rival bot behaviour across equities, futures, FX, AND crypto simultaneously.",
    blocker: "Rail 1 is crypto-only. Requires Rail 2 (Forex) and/or equities feeds.",
    prerequisites: ["Sentry (8846)", "Rail 2 infrastructure", "multi-asset Ingestion Gate"],
    priority: "MEDIUM",
    status: "BACKLOG",
    deploymentClasses: ["RECON"],
    estimatedLift: "Rail 2 launch + exchange feed integration.",
    addedAt: "2026-03-25T00:00:00.000Z",
    deployedAt: null,
    deployedWeaponId: null,
  },
  {
    id: "WD-003",
    title: "Post-Quantum Cryptography Transport (Kyber + Dilithium)",
    origin: "Lattice Phantom Round 1 (Grok, 2026-03-25)",
    concept: "CRYSTALS-Kyber for key exchange, CRYSTALS-Dilithium for signatures on all inter-service communication.",
    blocker: "Requires shared transport library across all 77+ services. Significant refactor.",
    prerequisites: ["All services (shared middleware)"],
    priority: "LOW",
    status: "BACKLOG",
    deploymentClasses: ["DEFENCE", "STEALTH"],
    estimatedLift: "Shared middleware library + service-by-service rollout.",
    addedAt: "2026-03-25T00:00:00.000Z",
    deployedAt: null,
    deployedWeaponId: null,
  },
  {
    id: "WD-004",
    title: "Phantom Swarming (Coordinated Synthetic Volume)",
    origin: "Lattice Phantom Round 1 (Grok, 2026-03-25)",
    concept: "Coordinated phantom agents creating synthetic volume patterns across venues.",
    blocker: "SOP-101 returned CAUTION. Requires legal review for market manipulation compliance.",
    prerequisites: ["Klingon V2 (identity + noise)", "Sentry", "SOP-101 legal opinion"],
    priority: "HIGH",
    status: "BACKLOG",
    deploymentClasses: ["STEALTH", "STRIKE"],
    estimatedLift: "Legal review completion + SOP-101 LAWFUL clearance.",
    addedAt: "2026-03-25T00:00:00.000Z",
    deployedAt: null,
    deployedWeaponId: null,
  },
  {
    id: "WD-005",
    title: "Fury Dynamic Re-Tasking (Executor-Level)",
    origin: "Lattice Phantom Round 2 (Grok, 2026-03-25)",
    concept: "When one FURY leg liquidity evaporates mid-mission, autonomously re-route to correlated substitute venue.",
    blocker: "Requires Beachhead V2 executor with real-time venue substitution logic.",
    prerequisites: ["Beachhead Executor V2", "Ingestion Gate (venue correlation)", "ARIS (risk check)"],
    priority: "HIGH",
    status: "BACKLOG",
    deploymentClasses: ["STRIKE"],
    estimatedLift: "Beachhead V2 build + venue correlation engine.",
    addedAt: "2026-03-25T00:00:00.000Z",
    deployedAt: null,
    deployedWeaponId: null,
  },
  {
    id: "WD-006",
    title: "FPGA-Accelerated Order Routing",
    origin: "Lattice Phantom Round 2 (Grok, 2026-03-25)",
    concept: "COTS FPGA cards for sub-200ns tick-to-trade latency.",
    blocker: "Requires colocation infrastructure + FPGA hardware + HDL expertise.",
    prerequisites: ["Colocation lease", "FPGA development pipeline"],
    priority: "LOW",
    status: "BACKLOG",
    deploymentClasses: ["STRIKE", "SUPPORT"],
    estimatedLift: "Rail 2 + colocation budget + FPGA engineering hire.",
    addedAt: "2026-03-25T00:00:00.000Z",
    deployedAt: null,
    deployedWeaponId: null,
  },
  {
    id: "WD-007",
    title: "1000+ Sentry Tower Mesh (Global Deployment)",
    origin: "Lattice Phantom Round 2 (Grok, 2026-03-25)",
    concept: "1,000+ Sentry instances feeding the full Phantom swarm. Models retrain daily.",
    blocker: "Scale requires multi-region infrastructure (10 Stadiums doctrine).",
    prerequisites: ["Multi-region deployment", "GPU tier for model retraining"],
    priority: "MEDIUM",
    status: "BACKLOG",
    deploymentClasses: ["RECON", "DEFENCE"],
    estimatedLift: "Post-revenue scaling. £10K investor round → multi-region EC2.",
    addedAt: "2026-03-25T00:00:00.000Z",
    deployedAt: null,
    deployedWeaponId: null,
  },
  {
    id: "WD-008",
    title: "Reinforcement Learning on Loiter-to-Strike Sequences",
    origin: "Lattice Phantom Round 2 (Grok, 2026-03-25)",
    concept: "Train RL model on proprietary corpus of successful loiter-to-strike sequences.",
    blocker: "Requires GPU tier + accumulated ALTIUS mission data (corpus doesn't exist yet).",
    prerequisites: ["NVIDIA Phase 2B", "ALTIUS operational data", "Sentry corpus"],
    priority: "HIGH",
    status: "BACKLOG",
    deploymentClasses: ["STRIKE", "INTEL"],
    estimatedLift: "Post-First Blood + 3-6 months of operational data + GPU tier.",
    addedAt: "2026-03-25T00:00:00.000Z",
    deployedAt: null,
    deployedWeaponId: null,
  },
  // --- Phantom Orion Eclipse Fulfillment Command (Spark #001, Grok, 2026-03-26) ---
  // 4 CEO lenses × 2 levels (Special Forces + Galactic) = 8 weapons
  {
    id: "WD-009",
    title: "Unified Cross-Exchange State Model (Simons SF)",
    origin: "Phantom Orion SF — Simons lens (Grok, 2026-03-26). Spark SPARK-001.",
    concept: "Treat all 2,034 feeds as one unified probability surface. Single Bayesian master model ingests every feed, searching for repeatable conditional probability tilts across 17+ dimensions. Medallion Causal Extractor pattern.",
    blocker: "Unified feature extraction layer across all exchange feeds. Compute-intensive — requires GPU tier for real-time inference across full feed universe.",
    prerequisites: ["All 2,034 ingestion feeds", "NVIDIA Phase 2B (GPU tier)", "Unified feature schema"],
    priority: "HIGH",
    status: "BACKLOG",
    deploymentClasses: ["RECON", "STRIKE"],
    estimatedLift: "GPU tier provisioned + unified feature pipeline built.",
    addedAt: "2026-03-26T00:00:00.000Z",
    deployedAt: null,
    deployedWeaponId: null,
  },
  {
    id: "WD-010",
    title: "Causal Graph Engine (Karp SF)",
    origin: "Phantom Orion SF — Karp lens (Grok, 2026-03-26). Spark SPARK-001.",
    concept: "Formal causal DAG connecting events to market outcomes. Not just correlation — causal arrows with explicit provenance. Orion Sovereign Causal Graph pattern. Every trade auditable via graph traversal.",
    blocker: "Requires formal DAG library integration (DoWhy/CausalML or equivalent TS port). New architectural pattern for Whiteboard + CIA.",
    prerequisites: ["Whiteboard (8710)", "CIA (8797)", "Causal inference library"],
    priority: "HIGH",
    status: "BACKLOG",
    deploymentClasses: ["INTEL", "RECON"],
    estimatedLift: "Causal inference library evaluation + Whiteboard graph mode.",
    addedAt: "2026-03-26T00:00:00.000Z",
    deployedAt: null,
    deployedWeaponId: null,
  },
  {
    id: "WD-011",
    title: "Predictive Spread Engine (Musk SF)",
    origin: "Phantom Orion SF — Musk lens (Grok, 2026-03-26). Spark SPARK-001.",
    concept: "Predict WHERE and WHEN the next high-conviction spread will open 300-800ms before it forms. Digital twins of top 14 venues simulate cross-venue divergences forward. Neural Latency Flywheel pattern.",
    blocker: "Requires venue order book simulators (digital twins) + forward prediction model. GPU tier for real-time simulation. Warp Simulation Spec (8795) is the hook.",
    prerequisites: ["Warp Simulation Spec (8795)", "NVIDIA Phase 2B", "Venue order book history"],
    priority: "HIGH",
    status: "BACKLOG",
    deploymentClasses: ["STRIKE"],
    estimatedLift: "GPU tier + venue simulator build + 3-6 months order book history.",
    addedAt: "2026-03-26T00:00:00.000Z",
    deployedAt: null,
    deployedWeaponId: null,
  },
  {
    id: "WD-012",
    title: "Alpha Route Optimizer (Bezos SF)",
    origin: "Phantom Orion SF — Bezos lens (Grok, 2026-03-26). Spark SPARK-001.",
    concept: "Multi-hop, multi-venue routing via integer linear programming. Treat every edge as inventory in a logistics network. Optimal venue path, size fragmentation, timing offset. Alpha Distribution Flywheel pattern. cuOpt Route Problem Spec (8793) is the hook.",
    blocker: "cuOpt Route Problem Spec (8793) ready as schema. Needs Gurobi/OR-Tools integration + multi-hop routing logic in executor layer.",
    prerequisites: ["cuOpt Route Problem Spec (8793)", "Gurobi or OR-Tools", "Beachhead Executor V2"],
    priority: "MEDIUM",
    status: "BACKLOG",
    deploymentClasses: ["STRIKE", "SUPPORT"],
    estimatedLift: "OR-Tools integration (free) + multi-hop executor routing.",
    addedAt: "2026-03-26T00:00:00.000Z",
    deployedAt: null,
    deployedWeaponId: null,
  },
  {
    id: "WD-013",
    title: "The Mirror Feed — Self-Referential Execution Stream (Simons Galactic)",
    origin: "Phantom Orion Galactic — Simons lens (Grok, 2026-03-26). Spark SPARK-001.",
    concept: "Feed Genesis's OWN execution patterns back as a live input stream to Arb Detector. System learns how its own trades move spreads, predicts own market impact, then exploits that knowledge. Galactic Medallion Oracle golden nugget: self-referential meta-model.",
    blocker: "CLEARED — Built as GENESIS-MIRROR-FEED (port 8850). Execution telemetry pipeline from CEX/Beachhead executors → Mirror Feed → IG + Arb Detector + CIA.",
    prerequisites: ["CEX Executor (8410)", "Beachhead Executor (8411)", "Ingestion Gate (8700)", "Arb Detector (8750)"],
    priority: "HIGH",
    status: "DEPLOYED",
    deploymentClasses: ["RECON"],
    estimatedLift: "Execution telemetry pipeline + feedback loop to IG.",
    addedAt: "2026-03-26T00:00:00.000Z",
    deployedAt: "2026-03-26T00:00:00.000Z",
    deployedWeaponId: "GENESIS-MIRROR-FEED",
  },
  {
    id: "WD-014",
    title: "Self-Ontology Loop — CIA Self-Observation (Karp Galactic)",
    origin: "Phantom Orion Galactic — Karp lens (Grok, 2026-03-26). Spark SPARK-001.",
    concept: "CIA watches Genesis watching the market. Recursive self-ontology: ingest own execution logs as first-class intel objects, re-weave causal graph to discover WHY high-conviction trades succeeded. Detects regime shifts 11-14 days early from own participation patterns. Galactic Orion Nexus golden nugget.",
    blocker: "CLEARED — Built as GENESIS-SELF-ONTOLOGY (port 8851). Recursive self-ontology: observations → causal links → insight synthesis → CIA/Whiteboard/DARPA.",
    prerequisites: ["CIA (8797)", "Whiteboard (8710)", "Execution logs from all executors"],
    priority: "HIGH",
    status: "DEPLOYED",
    deploymentClasses: ["RECON", "INTEL"],
    estimatedLift: "CIA V2 with self-observation mode + executor log pipeline.",
    addedAt: "2026-03-26T00:00:00.000Z",
    deployedAt: "2026-03-26T00:00:00.000Z",
    deployedWeaponId: "GENESIS-SELF-ONTOLOGY",
  },
  {
    id: "WD-015",
    title: "Infrastructure Critic — Toolkit Self-Optimization (Musk Galactic)",
    origin: "Phantom Orion Galactic — Musk lens (Grok, 2026-03-26). Spark SPARK-001.",
    concept: "Toolkit profiles performance patterns across the stack and proposes optimisation. Which services bottleneck execution latency? Which feed combinations produce most alpha per compute cycle? Hardware-aware self-optimization. Galactic Neural Eclipse golden nugget.",
    blocker: "Needs performance telemetry collection across all services + pattern analysis. Toolkit currently monitors health, not performance profiles.",
    prerequisites: ["Toolkit (8820)", "GTC (8600)", "Performance telemetry from all services"],
    priority: "MEDIUM",
    status: "BACKLOG",
    deploymentClasses: ["SUPPORT"],
    estimatedLift: "Performance telemetry collection + Toolkit V2 profiling mode.",
    addedAt: "2026-03-26T00:00:00.000Z",
    deployedAt: null,
    deployedWeaponId: null,
  },
  {
    id: "WD-016",
    title: "Liquidity Improver Flywheel (Bezos Galactic)",
    origin: "Phantom Orion Galactic — Bezos lens (Grok, 2026-03-26). Spark SPARK-001.",
    concept: "Our participation measurably tightens micro-structure at venues. Route trades to IMPROVE venue quality, creating cleaner data for our next cycle. Virtuous compounding loop: better venue → better data → better signals → better routes. Galactic Alpha Fulfillment golden nugget: infinite inventory virtualization.",
    blocker: "Requires market impact measurement + intelligent routing that optimises for venue quality improvement. Post-revenue scale needed for measurable impact.",
    prerequisites: ["cuOpt Route Problem Spec (8793)", "Market impact measurement", "Post-revenue trading volume"],
    priority: "MEDIUM",
    status: "BACKLOG",
    deploymentClasses: ["STRIKE", "SUPPORT"],
    estimatedLift: "Post-revenue + sufficient trading volume to measure venue impact.",
    addedAt: "2026-03-26T00:00:00.000Z",
    deployedAt: null,
    deployedWeaponId: null,
  },
];

export class BacklogService {
  private entries: Map<string, BacklogEntry> = new Map();
  private entryCounter = 16; // Start after WD-016
  private lastScanAt: string | null = null;

  constructor() {
    const now = new Date().toISOString();
    for (const seed of SEED_ENTRIES) {
      this.entries.set(seed.id, { ...seed, lastCheckedAt: now });
    }
    console.log(`[LABS][BACKLOG] Seeded ${SEED_ENTRIES.length} backlog entries from WEAPONS_DEVELOPMENT.md`);
  }

  /** Scan all backlog entries for constraint changes */
  scan(): { total: number; backlog: number; forgeReady: number; deployed: number } {
    const now = new Date().toISOString();
    let backlog = 0;
    let forgeReady = 0;
    let deployed = 0;

    for (const entry of this.entries.values()) {
      entry.lastCheckedAt = now;
      if (entry.status === "DEPLOYED") { deployed++; continue; }
      if (entry.status === "FORGE_READY") { forgeReady++; continue; }
      backlog++;
    }

    this.lastScanAt = now;
    return { total: this.entries.size, backlog, forgeReady, deployed };
  }

  /** Check if a released weapon matches a backlog entry — if so, mark DEPLOYED */
  checkWeaponMatch(weapon: WeaponRecord): BacklogEntry | null {
    const weaponText = `${weapon.name} ${weapon.description} ${weapon.mechanism}`.toLowerCase();

    for (const entry of this.entries.values()) {
      if (entry.status === "DEPLOYED") continue;

      // Keyword matching against backlog concept
      const conceptWords = entry.concept.toLowerCase().split(/\s+/);
      const titleWords = entry.title.toLowerCase().split(/\s+/);
      const keywords = [...conceptWords, ...titleWords].filter(w => w.length > 4);
      const matchCount = keywords.filter(k => weaponText.includes(k)).length;
      const matchRatio = keywords.length > 0 ? matchCount / keywords.length : 0;

      if (matchRatio > 0.3) {
        entry.status = "DEPLOYED";
        entry.deployedAt = new Date().toISOString();
        entry.deployedWeaponId = weapon.weaponId;
        console.log(`[LABS][BACKLOG] ★ GRADUATED: ${entry.id} (${entry.title}) → weapon ${weapon.weaponId}`);
        return entry;
      }
    }
    return null;
  }

  /** Manually promote an entry to FORGE_READY (constraint lifted externally) */
  promote(entryId: string): BacklogEntry | null {
    const entry = this.entries.get(entryId);
    if (!entry || entry.status === "DEPLOYED") return null;
    entry.status = "FORGE_READY";
    entry.lastCheckedAt = new Date().toISOString();
    console.log(`[LABS][BACKLOG] PROMOTED: ${entry.id} (${entry.title}) → FORGE_READY`);
    return entry;
  }

  /** Add a new backlog entry */
  add(data: { title: string; origin: string; concept: string; blocker: string; prerequisites: string[]; priority: BacklogPriority; estimatedLift: string; deploymentClasses?: DeploymentClass[] }): BacklogEntry {
    this.entryCounter++;
    const id = `WD-${String(this.entryCounter).padStart(3, "0")}`;
    const now = new Date().toISOString();
    const entry: BacklogEntry = {
      id,
      title: data.title,
      origin: data.origin,
      concept: data.concept,
      blocker: data.blocker,
      prerequisites: data.prerequisites,
      priority: data.priority,
      status: "BACKLOG",
      deploymentClasses: data.deploymentClasses || ["STRIKE"],
      estimatedLift: data.estimatedLift,
      addedAt: now,
      lastCheckedAt: now,
      deployedAt: null,
      deployedWeaponId: null,
    };
    this.entries.set(id, entry);
    console.log(`[LABS][BACKLOG] Added: ${id} — ${data.title}`);
    return entry;
  }

  /** Get all entries */
  getAll(): BacklogEntry[] {
    return [...this.entries.values()].sort((a, b) => {
      const statusOrder: Record<BacklogStatus, number> = { FORGE_READY: 0, CONSTRAINT_LIFTING: 1, BACKLOG: 2, DEPLOYED: 3 };
      const priOrder: Record<BacklogPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const s = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
      if (s !== 0) return s;
      return (priOrder[a.priority] ?? 9) - (priOrder[b.priority] ?? 9);
    });
  }

  /** Get a single entry */
  get(id: string): BacklogEntry | null {
    return this.entries.get(id) ?? null;
  }

  /** Get stats */
  getStats(): { total: number; byStatus: Partial<Record<BacklogStatus, number>>; byPriority: Partial<Record<BacklogPriority, number>>; lastScanAt: string | null } {
    const byStatus: Partial<Record<BacklogStatus, number>> = {};
    const byPriority: Partial<Record<BacklogPriority, number>> = {};
    for (const e of this.entries.values()) {
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
      byPriority[e.priority] = (byPriority[e.priority] || 0) + 1;
    }
    return { total: this.entries.size, byStatus, byPriority, lastScanAt: this.lastScanAt };
  }
}
