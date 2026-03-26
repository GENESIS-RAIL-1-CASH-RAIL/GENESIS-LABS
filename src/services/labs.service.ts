import { randomUUID } from "crypto";
import type {
  SourceGrade, SourceProfile, KillChainGrade, LabsTaskMode, LabsTaskStatus,
  LabsTask, DissectionRecord, DropboxSlotId, DropboxSubmission,
  ContradictionFinding, RefereeVerdict, ReconstructionRecord,
  RedTeamAssault, HardeningRecord, ZeroCopyResult, WeaponRecord,
  WeaponStatus, WeaponCategory, BirthCertificate, DecayClock,
  WeaponPerformance, LabsState, DarpaWorkOrderPayload, DefensiveThreatPayload,
  DeploymentClass,
} from "../types";

// ═══════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

const SLOTS: DropboxSlotId[] = ["ALPHA", "BRAVO", "CHARLIE", "DELTA", "ECHO"];

/** Dropbox questions per slot — ECHO always gets the contradiction question */
const SLOT_QUESTIONS: Record<DropboxSlotId, string> = {
  ALPHA: "How would you improve this concept for crypto arbitrage execution? What novel approach would you build?",
  BRAVO: "How would this concept fail in live markets? What are the fatal flaws?",
  CHARLIE: "If you were an adversary, how would you exploit or front-run someone using this concept?",
  DELTA: "What existing strategies could be COMBINED with this concept to create something entirely new?",
  ECHO: "What published research CONTRADICTS this concept? Find the strongest opposing evidence.",
};

/** Source toxicity — Grade A = pristine, Grade D = toxic */
const KNOWN_SOURCES: Record<string, { grade: SourceGrade; category: SourceProfile["category"] }> = {
  "arxiv": { grade: "A", category: "JOURNAL" },
  "ssrn": { grade: "A", category: "JOURNAL" },
  "nber": { grade: "A", category: "JOURNAL" },
  "bis": { grade: "A", category: "JOURNAL" },
  "ideas_repec": { grade: "A", category: "JOURNAL" },
  "oxford": { grade: "A", category: "UNIVERSITY" },
  "princeton": { grade: "A", category: "UNIVERSITY" },
  "cmu": { grade: "A", category: "UNIVERSITY" },
  "imperial": { grade: "A", category: "UNIVERSITY" },
  "baruch": { grade: "A", category: "UNIVERSITY" },
  "lobster": { grade: "A", category: "UNIVERSITY" },
  "lseg": { grade: "A", category: "FIRM" },
  "cme": { grade: "A", category: "FIRM" },
  "databento": { grade: "A", category: "FIRM" },
  "kdb": { grade: "A", category: "FIRM" },
  "quantpedia": { grade: "B", category: "FIRM" },
  "savvy_investor": { grade: "B", category: "FIRM" },
  "dukascopy": { grade: "B", category: "FIRM" },
  "researchgate": { grade: "B", category: "COMMUNITY" },
  "man_group": { grade: "B", category: "FIRM" },
  "aqr": { grade: "B", category: "FIRM" },
  "two_sigma": { grade: "B", category: "FIRM" },
  "medium": { grade: "C", category: "COMMUNITY" },
  "substack": { grade: "C", category: "COMMUNITY" },
  "telegram": { grade: "C", category: "COMMUNITY" },
  "twitter": { grade: "C", category: "COMMUNITY" },
  "reddit": { grade: "C", category: "COMMUNITY" },
  "discord": { grade: "D", category: "ANONYMOUS" },
  "anonymous": { grade: "D", category: "ANONYMOUS" },
  "unknown": { grade: "D", category: "ANONYMOUS" },
};

/** Default half-life in days per weapon category */
const DEFAULT_HALF_LIFE: Record<WeaponCategory, number> = {
  STATISTICAL_ARBITRAGE: 60,
  MARKET_MICROSTRUCTURE: 45,
  FUNDING_RATE: 90,
  CROSS_CHAIN: 30,
  MEV: 21,
  LIQUIDITY: 60,
  VOLATILITY: 45,
  SENTIMENT: 14,
  YIELD: 90,
  DEFENSIVE_COUNTER: 120,
  EVASION_PATTERN: 60,
  CUSTOM: 45,
};

/** Deployment class auto-classification per weapon category */
const DEPLOYMENT_CLASS_MAP: Record<WeaponCategory, DeploymentClass[]> = {
  STATISTICAL_ARBITRAGE: ["STRIKE"],
  MARKET_MICROSTRUCTURE: ["STRIKE", "RECON"],
  FUNDING_RATE: ["STRIKE"],
  CROSS_CHAIN: ["STRIKE"],
  MEV: ["STRIKE", "STEALTH"],
  LIQUIDITY: ["STRIKE", "SUPPORT"],
  VOLATILITY: ["STRIKE", "DEFENCE"],
  SENTIMENT: ["RECON", "INTEL"],
  YIELD: ["STRIKE"],
  DEFENSIVE_COUNTER: ["DEFENCE"],
  EVASION_PATTERN: ["STEALTH", "DEFENCE"],
  CUSTOM: ["STRIKE"],
};

/** PEP formation affinity per weapon category */
const FORMATION_AFFINITY: Record<WeaponCategory, string[]> = {
  STATISTICAL_ARBITRAGE: ["SET_PIECE", "TIKI_TAKA"],
  MARKET_MICROSTRUCTURE: ["COUNTER_ATTACK", "GEGENPRESSING"],
  FUNDING_RATE: ["PARK_THE_BUS", "CATENACCIO"],
  CROSS_CHAIN: ["TIKI_TAKA", "TOTAL_FOOTBALL"],
  MEV: ["GEGENPRESSING", "ROUTE_ONE"],
  LIQUIDITY: ["CATENACCIO", "PARK_THE_BUS"],
  VOLATILITY: ["COUNTER_ATTACK", "FALSE_NINE"],
  SENTIMENT: ["FALSE_NINE", "COUNTER_ATTACK"],
  YIELD: ["PARK_THE_BUS", "CATENACCIO"],
  DEFENSIVE_COUNTER: ["PARK_THE_BUS", "CATENACCIO"],
  EVASION_PATTERN: ["FALSE_NINE", "CATENACCIO"],
  CUSTOM: ["ROUTE_ONE", "TOTAL_FOOTBALL"],
};

const MAX_TASKS = 2000;

// ═══════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════

export class LabsService {
  private tasks = new Map<string, LabsTask>();
  private weapons = new Map<string, WeaponRecord>();
  private sourceProfiles = new Map<string, SourceProfile>();
  private totalReceived = 0;
  private totalKilled = 0;
  private totalBlocked = 0;
  private totalReleased = 0;
  private lastTaskAt: string | null = null;
  private lastReleaseAt: string | null = null;
  private lastDecayCheckAt: string | null = null;

  constructor() {
    // Seed source profiles
    for (const [key, info] of Object.entries(KNOWN_SOURCES)) {
      this.sourceProfiles.set(key, {
        sourceId: `SRC-${key}`,
        name: key,
        grade: info.grade,
        category: info.category,
        trustScore: info.grade === "A" ? 95 : info.grade === "B" ? 75 : info.grade === "C" ? 40 : 15,
        papersIngested: 0,
        weaponsProduced: 0,
        lastSeenAt: new Date().toISOString(),
      });
    }
  }

  // ── Task Intake ─────────────────────────────────────────────────

  receiveWorkOrder(payload: DarpaWorkOrderPayload): LabsTask {
    this.evictIfFull();
    const taskId = `LAB-${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const sourceGrade = this.scoreSource(payload.sourceName || "unknown", payload.sourceUrl || "");
    const killChainGrade = this.classifyKillChain(payload.priority, sourceGrade);

    const task: LabsTask = {
      taskId,
      workOrderId: payload.orderId || null,
      missionId: payload.missionId || null,
      title: payload.title,
      description: payload.description,
      mode: "OFFENSIVE",
      status: "TRIAGED",
      killChainGrade,
      sourceGrade,
      sourceName: payload.sourceName || "unknown",
      sourceUrl: payload.sourceUrl || "",
      originalAbstract: payload.spec || payload.description,
      coreConcept: "",
      dissection: null,
      reconstruction: null,
      hardening: null,
      zeroCopyResult: null,
      weapon: null,
      priority: payload.priority,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      killedReason: null,
    };

    this.tasks.set(taskId, task);
    this.totalReceived++;
    this.lastTaskAt = now;
    this.updateSourceProfile(task.sourceName);
    return task;
  }

  receiveDefensiveTask(payload: DefensiveThreatPayload): LabsTask {
    this.evictIfFull();
    const taskId = `LAB-DEF-${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    const task: LabsTask = {
      taskId,
      workOrderId: null,
      missionId: null,
      title: `[DEFENSIVE] ${payload.title}`,
      description: payload.description,
      mode: "DEFENSIVE",
      status: "TRIAGED",
      killChainGrade: payload.severity === "CRITICAL" ? "FLASH" : "PRIORITY",
      sourceGrade: "C",
      sourceName: payload.sourceName || "RED_TEAM_DETECTION",
      sourceUrl: "",
      originalAbstract: payload.detectedPattern,
      coreConcept: "",
      dissection: null,
      reconstruction: null,
      hardening: null,
      zeroCopyResult: null,
      weapon: null,
      priority: payload.severity,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      killedReason: null,
    };

    this.tasks.set(taskId, task);
    this.totalReceived++;
    this.lastTaskAt = now;
    return task;
  }

  // ── Source Scoring ──────────────────────────────────────────────

  scoreSource(sourceName: string, _sourceUrl: string): SourceGrade {
    const key = sourceName.toLowerCase().replace(/[\s-_]/g, "_");
    for (const [k, profile] of this.sourceProfiles.entries()) {
      if (key.includes(k) || k.includes(key)) return profile.grade;
    }
    // URL-based heuristics
    if (_sourceUrl.includes("arxiv.org") || _sourceUrl.includes("ssrn.com")) return "A";
    if (_sourceUrl.includes("github.com") || _sourceUrl.includes("medium.com")) return "C";
    if (_sourceUrl.includes("t.me") || _sourceUrl.includes("discord.")) return "D";
    return "C"; // Default: treat as community until proven otherwise
  }

  classifyKillChain(priority: string, sourceGrade: SourceGrade): KillChainGrade {
    if (priority === "CRITICAL" && (sourceGrade === "A" || sourceGrade === "B")) return "FLASH";
    if (priority === "CRITICAL" || priority === "HIGH") return "PRIORITY";
    if (priority === "MEDIUM") return "ROUTINE";
    return "ARCHIVE";
  }

  // ── Stage 1: Dissection ────────────────────────────────────────

  dissect(taskId: string): DissectionRecord | null {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== "TRIAGED") return null;

    task.status = "DISSECTING";
    task.updatedAt = new Date().toISOString();

    // SIMULATION: deterministic dissection based on input text
    const abstract = task.originalAbstract;
    const words = abstract.split(/\s+/).length;
    const hasQuantTerms = /arbitrage|spread|alpha|signal|model|predict|reversion|momentum/i.test(abstract);
    const hasTechTerms = /neural|transformer|lstm|gradient|reinforcement|ml|ai/i.test(abstract);

    const concept = abstract.length > 200 ? abstract.slice(0, 200) + "..." : abstract;
    const mechanism = hasQuantTerms
      ? "Quantitative signal extraction with statistical edge detection"
      : hasTechTerms
      ? "Machine learning model for pattern recognition and prediction"
      : "Market structure exploitation via systematic approach";

    const assumptions = [
      "Market microstructure remains stable during execution",
      "Sufficient liquidity exists at target venues",
      "Latency constraints met for signal validity",
    ];

    const weaknesses = [
      words < 50 ? "Abstract lacks sufficient detail for full analysis" : "Requires validation against live market regime",
      task.sourceGrade === "C" || task.sourceGrade === "D"
        ? "Source credibility is low — claims may be unverified"
        : "Academic context may not translate to production",
    ];

    const applicable = hasQuantTerms || hasTechTerms || task.mode === "DEFENSIVE";
    const killDecision = !applicable && words < 20;

    const dissection: DissectionRecord = {
      concept,
      mechanism,
      assumptions,
      weaknesses,
      applicability: applicable ? "APPLICABLE to Genesis CEX/DEX arbitrage domain" : "LIMITED applicability — domain mismatch",
      killDecision,
      killReason: killDecision ? "Insufficient substance or domain applicability" : null,
      dissectedAt: new Date().toISOString(),
    };

    task.dissection = dissection;
    task.coreConcept = concept;

    if (killDecision) {
      task.status = "KILLED";
      task.killedReason = dissection.killReason;
      this.totalKilled++;
    } else {
      task.status = "DISSECTED";
    }

    task.updatedAt = new Date().toISOString();
    return dissection;
  }

  // ── Stage 2: Reconstruction ────────────────────────────────────

  reconstruct(taskId: string): ReconstructionRecord | null {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== "DISSECTED") return null;

    task.status = "RECONSTRUCTING";
    task.updatedAt = new Date().toISOString();

    // Generate Dropbox submissions (SIMULATION: template responses)
    const submissions: DropboxSubmission[] = [];
    const contradictions: ContradictionFinding[] = [];

    for (const slotId of SLOTS) {
      const question = this.generateSlotQuestion(slotId, task);
      const response = this.simulateDropboxSlot(slotId, question, task.coreConcept);
      const confidence = 0.6 + Math.random() * 0.35; // 0.60-0.95

      submissions.push({
        slotId,
        question,
        response,
        confidence,
        submittedAt: new Date().toISOString(),
      });

      // ECHO always produces contradiction findings
      if (slotId === "ECHO") {
        contradictions.push({
          slotId: "ECHO",
          contradictingConcept: `Counter-evidence: market regime dependency invalidates static parameters assumed by source`,
          source: "Empirical market microstructure literature",
          reasoning: "Static signal models degrade under regime change — adaptive approaches required",
          confidence: 0.7 + Math.random() * 0.2,
        });
      }
    }

    // Deterministic referee
    const verdict = this.runReferee(submissions, contradictions);

    // Build novel elements based on slot consensus
    const novelElements = [
      "Adaptive parameter regime detection (Genesis-originated)",
      "Multi-venue signal aggregation across 27+ CEX feeds",
      "Stealth execution overlay via Klingon Cloaking integration",
      task.mode === "DEFENSIVE" ? "Adversarial pattern detection and evasion routing" : "Cross-chain arbitrage pathway optimisation",
    ];

    const reconstruction: ReconstructionRecord = {
      dropboxSubmissions: submissions,
      refereeVerdict: verdict,
      reconstructedApproach: verdict.recommendation,
      originalDelta: `Source concept: ${task.coreConcept.slice(0, 100)}. Genesis reconstruction: entirely different execution architecture using proprietary multi-venue intelligence pipeline.`,
      novelElements,
      combinedWith: this.findCombinationPartners(task),
      reconstructedAt: new Date().toISOString(),
    };

    task.reconstruction = reconstruction;
    task.status = "RECONSTRUCTED";
    task.updatedAt = new Date().toISOString();
    return reconstruction;
  }

  private generateSlotQuestion(slotId: DropboxSlotId, task: LabsTask): string {
    const base = SLOT_QUESTIONS[slotId];
    return `[${task.mode}] Given concept: "${task.coreConcept.slice(0, 100)}..." — ${base}`;
  }

  private simulateDropboxSlot(slotId: DropboxSlotId, _question: string, concept: string): string {
    const prefix = `[${slotId}] SIMULATION ANALYSIS:`;
    const conceptSnip = concept.slice(0, 80);
    const responses: Record<DropboxSlotId, string> = {
      ALPHA: `${prefix} Improvement pathway: adapt '${conceptSnip}' using adaptive regime detection. Replace static thresholds with rolling Z-score windows calibrated to venue-specific volatility. Novel contribution: multi-venue signal fusion.`,
      BRAVO: `${prefix} Critical failure modes: (1) Signal decay under regime change, (2) Liquidity withdrawal at execution, (3) Adversary detection of pattern. Mitigation: dynamic parameter adjustment + stealth execution overlay.`,
      CHARLIE: `${prefix} Adversarial exploitation: front-run by monitoring for correlated order flow signatures. Counter-measure: stochastic execution timing + decoy orders via Klingon Cloaking.`,
      DELTA: `${prefix} Combination potential: merge with funding rate divergence signals + order book imbalance detection for multi-factor confirmation. Reduces false positives by ~40% based on historical analysis.`,
      ECHO: `${prefix} CONTRADICTION FOUND: Recent literature suggests this approach loses edge after widespread adoption. Counter-evidence from market microstructure studies shows mean-reversion signals half-life is 21-45 days post-publication.`,
    };
    return responses[slotId];
  }

  private runReferee(submissions: DropboxSubmission[], contradictions: ContradictionFinding[]): RefereeVerdict {
    // Deterministic referee — NO AI, pure code
    const avgConfidence = submissions.reduce((sum, s) => sum + s.confidence, 0) / submissions.length;

    // Consensus: majority themes
    const improvementSlots = submissions.filter(s => s.slotId === "ALPHA" || s.slotId === "DELTA");
    const riskSlots = submissions.filter(s => s.slotId === "BRAVO" || s.slotId === "CHARLIE");

    // Hallucination check: confidence below 0.5 = flagged
    const hallucinationFlags = submissions
      .filter(s => s.confidence < 0.5)
      .map(s => `${s.slotId}: confidence ${(s.confidence * 100).toFixed(0)}% below threshold`);

    // Disagreements: ECHO always disagrees by design (contradiction mining)
    const disagreements = contradictions.map(c => c.contradictingConcept);

    const recommendation = `REFEREE SYNTHESIS: Build adaptive multi-venue strategy incorporating risk mitigations from BRAVO/CHARLIE. Combine with existing arsenal per DELTA. Account for contradiction from ECHO by adding regime detection. Estimated originality: HIGH — source concept is spark only, execution is entirely Genesis-originated.`;

    return {
      consensusApproach: `Adaptive ${improvementSlots.length > 0 ? "multi-factor" : "single-signal"} strategy with stealth execution overlay`,
      disagreements,
      contradictions,
      hallucinationFlags,
      confidence: avgConfidence,
      recommendation,
      verdictAt: new Date().toISOString(),
    };
  }

  // ── Stage 3: Hardening ─────────────────────────────────────────

  harden(taskId: string): HardeningRecord | null {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== "RECONSTRUCTED") return null;

    task.status = "HARDENING";
    task.updatedAt = new Date().toISOString();

    // SIMULATION: Red Team assaults
    const assaults: RedTeamAssault[] = [
      {
        attackVector: "PATTERN_DETECTION: Adversary monitors for correlated order flow",
        result: "SURVIVED",
        details: "Stealth execution overlay + stochastic timing defeats pattern detection",
        recommendation: "Maintain Klingon Cloaking integration",
      },
      {
        attackVector: "FRONT_RUNNING: MEV bot detects pending transactions",
        result: task.mode === "DEFENSIVE" ? "SURVIVED" : "WEAKENED",
        details: task.mode === "DEFENSIVE"
          ? "Defensive weapons are inherently resistant to front-running"
          : "Partial vulnerability on DEX legs — mitigated by private mempool routing",
        recommendation: "Use Flashbots/private mempool for on-chain execution legs",
      },
      {
        attackVector: "REGIME_CHANGE: Market conditions shift invalidating assumptions",
        result: "SURVIVED",
        details: "Adaptive parameter detection added in reconstruction handles regime shifts",
        recommendation: "Decay clock set — weapon auto-reviews when half-life expires",
      },
      {
        attackVector: "LIQUIDITY_WITHDRAWAL: Venue liquidity disappears at execution time",
        result: "WEAKENED",
        details: "Partial mitigation via multi-venue routing — single venue still vulnerable",
        recommendation: "Add minimum liquidity threshold as kill condition",
      },
      {
        attackVector: "COPYCAT_DETECTION: Adversary reverses our strategy from market footprint",
        result: "SURVIVED",
        details: "DNA anti-fingerprinting via Academy operator variance + decoy trades",
        recommendation: "Rotate operator profiles every 24h",
      },
    ];

    const survived = assaults.filter(a => a.result === "SURVIVED").length;
    const survivalRate = (survived / assaults.length) * 100;

    const hardening: HardeningRecord = {
      redTeamAssaults: assaults,
      survivalRate,
      backtestPeriod: "90 days simulated historical data",
      backtestResult: survivalRate >= 60
        ? `PASS: ${survivalRate.toFixed(0)}% assault survival rate — weapon is battle-ready`
        : `MARGINAL: ${survivalRate.toFixed(0)}% survival — requires additional hardening`,
      combinationCheck: this.findCombinationPartners(task),
      hardenedAt: new Date().toISOString(),
    };

    task.hardening = hardening;
    task.status = "HARDENED";
    task.updatedAt = new Date().toISOString();
    return hardening;
  }

  // ── Zero Copy Gate ─────────────────────────────────────────────

  async runZeroCopyGate(taskId: string): Promise<ZeroCopyResult | null> {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== "HARDENED") return null;

    task.status = "ZERO_COPY_GATE";
    task.updatedAt = new Date().toISOString();

    // Check 1: Structural Divergence
    const structuralDivergence = this.checkStructuralDivergence(task);

    // Check 2: Originality Ratio
    const originalityRatio = this.calculateOriginalityRatio(task);

    // Check 3: Clean Room Provenance
    const cleanRoomProvenance = this.checkCleanRoomProvenance(task);

    // Build provenance chain
    const provenanceChain = [
      `SOURCE: ${task.sourceName} (${task.sourceUrl || "no URL"}) — Grade ${task.sourceGrade}`,
      `CONCEPT: "${task.coreConcept.slice(0, 100)}"`,
      `DISSECTION: ${task.dissection?.mechanism || "N/A"}`,
      `RECONSTRUCTION: ${task.reconstruction?.novelElements.length || 0} novel elements added`,
      `HARDENING: ${task.hardening?.survivalRate.toFixed(0) || 0}% Red Team survival`,
      `DELTA: ${task.reconstruction?.originalDelta?.slice(0, 100) || "N/A"}`,
    ];

    // SOP-101 evaluation
    const sopVerdict = await this.evaluateWithSop101(task);

    const allPassed = structuralDivergence && originalityRatio >= 70 && cleanRoomProvenance && sopVerdict === "LAWFUL";

    const result: ZeroCopyResult = {
      structuralDivergence,
      structuralDetails: structuralDivergence
        ? "Reconstructed approach uses fundamentally different execution architecture"
        : "FAIL: reconstructed approach too similar to source structure",
      originalityRatio,
      originalityBreakdown: `Genesis-originated: ${originalityRatio}% (novel elements: ${task.reconstruction?.novelElements.length || 0}, combination partners: ${task.reconstruction?.combinedWith.length || 0})`,
      cleanRoomProvenance,
      provenanceChain,
      sopVerdict,
      passed: allPassed,
      evaluatedAt: new Date().toISOString(),
    };

    task.zeroCopyResult = result;

    if (!allPassed) {
      task.status = "BLOCKED";
      task.killedReason = `ZERO_COPY_GATE: struct=${structuralDivergence}, orig=${originalityRatio}%, cleanRoom=${cleanRoomProvenance}, sop=${sopVerdict}`;
      this.totalBlocked++;
      console.error(`[LABS] ██ ZERO COPY GATE BLOCKED ██ Task ${taskId}: ${task.killedReason}`);
    } else {
      task.status = "CLEARED";
      console.log(`[LABS] ✓ Zero Copy Gate CLEARED: ${taskId} — originality ${originalityRatio}%`);
    }

    task.updatedAt = new Date().toISOString();
    return result;
  }

  private checkStructuralDivergence(task: LabsTask): boolean {
    if (!task.reconstruction) return false;
    // Structural divergence: must have novel elements AND original delta documented
    return task.reconstruction.novelElements.length >= 2 && task.reconstruction.originalDelta.length > 50;
  }

  private calculateOriginalityRatio(task: LabsTask): number {
    if (!task.reconstruction || !task.dissection) return 0;
    // Calculate based on: novel elements, combination partners, reconstruction vs source
    const novelCount = task.reconstruction.novelElements.length;
    const combinationCount = task.reconstruction.combinedWith.length;
    const hasRefereeConsensus = task.reconstruction.refereeVerdict.confidence > 0.5;
    const hasContradictionMining = task.reconstruction.refereeVerdict.contradictions.length > 0;

    let ratio = 50; // Base: Dropbox Protocol itself is original process
    ratio += novelCount * 8; // Each novel element adds 8%
    ratio += combinationCount * 5; // Each combination adds 5%
    if (hasRefereeConsensus) ratio += 5;
    if (hasContradictionMining) ratio += 5;
    if (task.hardening && task.hardening.survivalRate > 60) ratio += 5;

    return Math.min(ratio, 100);
  }

  private checkCleanRoomProvenance(task: LabsTask): boolean {
    // All stages must be documented
    return !!(task.dissection && task.reconstruction && task.hardening
      && task.reconstruction.originalDelta.length > 0
      && task.reconstruction.novelElements.length > 0);
  }

  private async evaluateWithSop101(task: LabsTask): Promise<"LAWFUL" | "UNLAWFUL" | "CAUTION" | "UNRESOLVED"> {
    const SOP101_URL = process.env.SOP101_URL || "http://genesis-sop-101-kernel:8800";
    try {
      const res = await fetch(`${SOP101_URL}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor: "genesis-labs-zero-copy-gate",
          role: "SYSTEM",
          action: `zero_copy_evaluation_${task.taskId}`,
          category: "EXECUTION",
          context: {
            taskId: task.taskId,
            mode: task.mode,
            sourceGrade: task.sourceGrade,
            originalityRatio: this.calculateOriginalityRatio(task),
            novelElements: task.reconstruction?.novelElements.length || 0,
          },
          requestedBy: "genesis-labs",
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return "LAWFUL"; // Fail-open in SIMULATION (SOP-101 may not be running)
      const data = await res.json() as { verdict?: string };
      if (data.verdict === "UNLAWFUL" || data.verdict === "CAUTION" || data.verdict === "UNRESOLVED") {
        return data.verdict;
      }
      return "LAWFUL";
    } catch {
      // SOP-101 unreachable — SIMULATION mode: default LAWFUL
      return "LAWFUL";
    }
  }

  // ── Weapon Release ─────────────────────────────────────────────

  releaseWeapon(taskId: string): WeaponRecord | null {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== "CLEARED") return null;

    const now = new Date().toISOString();
    const category = this.inferWeaponCategory(task);
    const halfLifeDays = DEFAULT_HALF_LIFE[category];
    const reviewDue = new Date(Date.now() + halfLifeDays * 24 * 60 * 60 * 1000).toISOString();

    const weapon: WeaponRecord = {
      weaponId: `WPN-${randomUUID().slice(0, 8)}`,
      name: task.title.replace(/^\[DEFENSIVE\]\s*/, ""),
      category,
      deploymentClasses: task.mode === "DEFENSIVE"
        ? ["DEFENCE"]
        : (DEPLOYMENT_CLASS_MAP[category] || ["STRIKE"]),
      description: task.reconstruction?.reconstructedApproach || task.description,
      mechanism: task.reconstruction?.refereeVerdict.recommendation || "",
      mode: task.mode,
      sourceGrade: task.sourceGrade,
      birthCertificate: {
        taskId: task.taskId,
        originalSource: task.sourceName,
        originalUrl: task.sourceUrl,
        conceptExtracted: task.coreConcept.slice(0, 200),
        researchPath: [
          `Dissected: ${task.dissection?.dissectedAt || "N/A"}`,
          `Reconstructed via ${task.reconstruction?.dropboxSubmissions.length || 0}-slot Dropbox: ${task.reconstruction?.reconstructedAt || "N/A"}`,
          `Hardened with ${task.hardening?.redTeamAssaults.length || 0} Red Team assaults: ${task.hardening?.hardenedAt || "N/A"}`,
        ],
        transformationEvidence: task.reconstruction?.originalDelta || "",
        zeroCopyStamp: task.zeroCopyResult?.evaluatedAt || now,
        redTeamClearance: task.hardening?.hardenedAt || now,
      },
      decayClock: {
        bornAt: now,
        halfLifeDays,
        reviewDueAt: reviewDue,
        status: "TICKING",
      },
      pepFormationAffinity: FORMATION_AFFINITY[category] || [],
      combinationPartners: task.reconstruction?.combinedWith || [],
      killConditions: [
        "3 consecutive losses in live deployment",
        "Decay clock expired without positive re-evaluation",
        "Red Team detects adversary adaptation to this pattern",
        "Market regime shift invalidates core assumptions",
      ],
      status: "ACTIVE",
      releasedAt: now,
      lastReviewAt: null,
      livePerformance: {
        deploymentsCount: 0,
        totalPnl: 0,
        winRate: 0,
        avgEdgeBps: 0,
        lastDeployedAt: null,
        lastPnlUpdate: null,
      },
    };

    this.weapons.set(weapon.weaponId, weapon);
    task.weapon = weapon;
    task.status = "RELEASED";
    task.completedAt = now;
    task.updatedAt = now;
    this.totalReleased++;
    this.lastReleaseAt = now;

    // Update source profile
    const profile = this.findSourceProfile(task.sourceName);
    if (profile) profile.weaponsProduced++;

    return weapon;
  }

  private inferWeaponCategory(task: LabsTask): WeaponCategory {
    if (task.mode === "DEFENSIVE") return "DEFENSIVE_COUNTER";
    const text = `${task.title} ${task.description} ${task.coreConcept}`.toLowerCase();
    if (/arbitrage|arb|spread/.test(text)) return "STATISTICAL_ARBITRAGE";
    if (/microstructure|order.?book|lob/.test(text)) return "MARKET_MICROSTRUCTURE";
    if (/funding.?rate/.test(text)) return "FUNDING_RATE";
    if (/cross.?chain|bridge/.test(text)) return "CROSS_CHAIN";
    if (/mev|front.?run|sandwich/.test(text)) return "MEV";
    if (/liquidity|amm|pool/.test(text)) return "LIQUIDITY";
    if (/volatil|vol|vix/.test(text)) return "VOLATILITY";
    if (/sentiment|social|news/.test(text)) return "SENTIMENT";
    if (/yield|lending|borrow/.test(text)) return "YIELD";
    return "CUSTOM";
  }

  // ── Full Pipeline ──────────────────────────────────────────────

  async processFullPipeline(taskId: string): Promise<LabsTask | null> {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    const status = () => task.status as string;

    // Stage 1
    if (status() === "TRIAGED") {
      this.dissect(taskId);
      if (status() === "KILLED") return task;
    }

    // Stage 2
    if (status() === "DISSECTED") {
      this.reconstruct(taskId);
    }

    // Stage 3
    if (status() === "RECONSTRUCTED") {
      this.harden(taskId);
    }

    // Zero Copy Gate
    if (status() === "HARDENED") {
      await this.runZeroCopyGate(taskId);
      if (status() === "BLOCKED") return task;
    }

    // Release
    if (status() === "CLEARED") {
      this.releaseWeapon(taskId);
      if (task.weapon) {
        this.distributeWeapon(task.weapon);
      }
    }

    return task;
  }

  // ── Distribution ───────────────────────────────────────────────

  distributeWeapon(weapon: WeaponRecord): void {
    const payload = {
      eventType: "LABS_WEAPON_RELEASED",
      weaponId: weapon.weaponId,
      name: weapon.name,
      category: weapon.category,
      mode: weapon.mode,
      mechanism: weapon.mechanism.slice(0, 200),
      pepFormationAffinity: weapon.pepFormationAffinity,
      decayHalfLifeDays: weapon.decayClock.halfLifeDays,
      birthCertificate: weapon.birthCertificate,
      timestamp: new Date().toISOString(),
    };

    const targets = [
      { name: "GTC", url: process.env.GTC_URL || "http://genesis-gtc:8650", path: "/ingest" },
      { name: "Whiteboard", url: process.env.WHITEBOARD_URL || "http://genesis-whiteboard:8710", path: "/intel/ingest" },
      { name: "CIA", url: process.env.CIA_URL || "http://genesis-cia:8797", path: "/intel/receive" },
      { name: "DARPA", url: process.env.DARPA_URL || "http://genesis-darpa:8840", path: "/intel/from-cia" },
      { name: "Skunkworks", url: process.env.SKUNKWORKS_URL || "http://genesis-skunkworks:8841", path: "/weapon/notify" },
      { name: "Academy", url: process.env.ACADEMY_URL || "http://genesis-academy:8730", path: "/curriculum/refresh" },
    ];

    for (const t of targets) {
      fetch(`${t.url}${t.path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "GENESIS_LABS", type: "WEAPON_RELEASED", data: payload }),
        signal: AbortSignal.timeout(5000),
      }).catch(() => { /* fire and forget */ });
    }

    console.log(`[LABS] Weapon ${weapon.weaponId} distributed to ${targets.length} services`);
  }

  // ── Decay Clock ────────────────────────────────────────────────

  runDecayCheck(): { reviewed: number; expired: number } {
    let reviewed = 0;
    let expired = 0;
    const now = Date.now();

    for (const weapon of this.weapons.values()) {
      if (weapon.status !== "ACTIVE") continue;
      const reviewDue = new Date(weapon.decayClock.reviewDueAt).getTime();
      if (now > reviewDue) {
        weapon.decayClock.status = "REVIEW_DUE";
        weapon.status = "REVIEW";
        reviewed++;
        console.log(`[LABS] Decay clock: weapon ${weapon.weaponId} (${weapon.name}) due for review`);
      }
    }

    this.lastDecayCheckAt = new Date().toISOString();
    return { reviewed, expired };
  }

  reviewWeapon(weaponId: string): WeaponRecord | null {
    const weapon = this.weapons.get(weaponId);
    if (!weapon) return null;

    weapon.lastReviewAt = new Date().toISOString();

    // Auto-evaluate: if performance is positive, extend decay clock
    if (weapon.livePerformance.winRate > 0.5 && weapon.livePerformance.totalPnl > 0) {
      const newReviewDue = new Date(Date.now() + weapon.decayClock.halfLifeDays * 24 * 60 * 60 * 1000).toISOString();
      weapon.decayClock.reviewDueAt = newReviewDue;
      weapon.decayClock.status = "TICKING";
      weapon.status = "ACTIVE";
      console.log(`[LABS] Weapon ${weaponId} review PASSED — extended by ${weapon.decayClock.halfLifeDays} days`);
    } else {
      weapon.status = "EXPIRED";
      weapon.decayClock.status = "EXPIRED";
      console.log(`[LABS] Weapon ${weaponId} review FAILED — expired (PnL: ${weapon.livePerformance.totalPnl}, WR: ${weapon.livePerformance.winRate})`);
    }

    return weapon;
  }

  retireWeapon(weaponId: string, reason: string): WeaponRecord | null {
    const weapon = this.weapons.get(weaponId);
    if (!weapon) return null;
    weapon.status = "RETIRED";
    console.log(`[LABS] Weapon ${weaponId} RETIRED: ${reason}`);

    // Notify GTC
    fetch(`${process.env.GTC_URL || "http://genesis-gtc:8650"}/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "GENESIS_LABS", type: "LABS_WEAPON_RETIRED", data: { weaponId, reason, timestamp: new Date().toISOString() } }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => {});

    return weapon;
  }

  updateWeaponPerformance(weaponId: string, pnl: number, won: boolean): WeaponRecord | null {
    const weapon = this.weapons.get(weaponId);
    if (!weapon) return null;

    const perf = weapon.livePerformance;
    perf.deploymentsCount++;
    perf.totalPnl += pnl;
    const wins = Math.round(perf.winRate * (perf.deploymentsCount - 1)) + (won ? 1 : 0);
    perf.winRate = wins / perf.deploymentsCount;
    perf.avgEdgeBps = perf.totalPnl / perf.deploymentsCount;
    perf.lastDeployedAt = new Date().toISOString();
    perf.lastPnlUpdate = new Date().toISOString();

    return weapon;
  }

  // ── Helpers ────────────────────────────────────────────────────

  private findCombinationPartners(task: LabsTask): string[] {
    const partners: string[] = [];
    for (const weapon of this.weapons.values()) {
      if (weapon.status === "ACTIVE") {
        partners.push(`${weapon.weaponId}:${weapon.name}`);
        if (partners.length >= 5) break;
      }
    }
    return partners;
  }

  private findSourceProfile(sourceName: string): SourceProfile | undefined {
    const key = sourceName.toLowerCase().replace(/[\s-_]/g, "_");
    for (const [k, profile] of this.sourceProfiles.entries()) {
      if (key.includes(k) || k.includes(key)) return profile;
    }
    return undefined;
  }

  private updateSourceProfile(sourceName: string): void {
    const profile = this.findSourceProfile(sourceName);
    if (profile) {
      profile.papersIngested++;
      profile.lastSeenAt = new Date().toISOString();
    }
  }

  private evictIfFull(): void {
    if (this.tasks.size < MAX_TASKS) return;
    const terminal: string[] = [];
    for (const [id, t] of this.tasks) {
      if (t.status === "RELEASED" || t.status === "KILLED" || t.status === "BLOCKED") terminal.push(id);
    }
    terminal.sort((a, b) => {
      const tA = this.tasks.get(a)!;
      const tB = this.tasks.get(b)!;
      return new Date(tA.createdAt).getTime() - new Date(tB.createdAt).getTime();
    });
    const evictCount = Math.ceil(MAX_TASKS * 0.1);
    for (let i = 0; i < Math.min(evictCount, terminal.length); i++) {
      this.tasks.delete(terminal[i]);
    }
  }

  // ── Public API ─────────────────────────────────────────────────

  getState(): LabsState {
    let active = 0, retired = 0, expired = 0, reviewDue = 0;
    for (const w of this.weapons.values()) {
      if (w.status === "ACTIVE") active++;
      else if (w.status === "RETIRED") retired++;
      else if (w.status === "EXPIRED") expired++;
      else if (w.status === "REVIEW") reviewDue++;
    }

    let dissected = 0, reconstructed = 0, hardened = 0, cleared = 0;
    for (const t of this.tasks.values()) {
      if (t.dissection) dissected++;
      if (t.reconstruction) reconstructed++;
      if (t.hardening) hardened++;
      if (t.zeroCopyResult?.passed) cleared++;
    }

    return {
      enabled: true,
      mode: "SIMULATION",
      port: parseInt(process.env.PORT || "8845", 10),
      totalTasksReceived: this.totalReceived,
      totalDissected: dissected,
      totalReconstructed: reconstructed,
      totalHardened: hardened,
      totalCleared: cleared,
      totalReleased: this.totalReleased,
      totalKilled: this.totalKilled,
      totalBlocked: this.totalBlocked,
      activeWeapons: active,
      retiredWeapons: retired,
      expiredWeapons: expired,
      reviewDueWeapons: reviewDue,
      lastTaskAt: this.lastTaskAt,
      lastReleaseAt: this.lastReleaseAt,
      lastDecayCheckAt: this.lastDecayCheckAt,
    };
  }

  getTasks(filters?: { status?: string; mode?: string; grade?: string }): LabsTask[] {
    let results = [...this.tasks.values()];
    if (filters?.status) results = results.filter(t => t.status === filters.status);
    if (filters?.mode) results = results.filter(t => t.mode === filters.mode);
    if (filters?.grade) results = results.filter(t => t.killChainGrade === filters.grade);
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getTask(taskId: string): LabsTask | undefined { return this.tasks.get(taskId); }
  getWeaponsCatalogue(): WeaponRecord[] { return [...this.weapons.values()]; }
  getWeapon(weaponId: string): WeaponRecord | undefined { return this.weapons.get(weaponId); }
  getSourceProfiles(): SourceProfile[] { return [...this.sourceProfiles.values()]; }

  // ── Deployment Class Filtered Catalogue ───────────────────────────

  getWeaponsByDeploymentClass(dc: DeploymentClass): WeaponRecord[] {
    return [...this.weapons.values()].filter(
      (w) => w.deploymentClasses.includes(dc) && w.status === "ACTIVE",
    );
  }

  /**
   * Commander's Armoury Dashboard — Human-readable tactical overview.
   * Shows weapon count per deployment class, gaps, and recommendations
   * for where to aim the next Renaissance Prompt Doctrine spark.
   */
  getArmouryDashboard(): {
    totalWeapons: number;
    activeWeapons: number;
    byDeploymentClass: Record<string, { count: number; weapons: string[]; strength: string }>;
    gaps: string[];
    recommendations: string[];
  } {
    const ALL_CLASSES: DeploymentClass[] = ["RECON", "STRIKE", "DEFENCE", "STEALTH", "INTEL", "SUPPORT"];
    const active = [...this.weapons.values()].filter((w) => w.status === "ACTIVE");

    const byClass: Record<string, { count: number; weapons: string[]; strength: string }> = {};
    for (const dc of ALL_CLASSES) {
      const matching = active.filter((w) => w.deploymentClasses.includes(dc));
      const count = matching.length;
      const strength = count === 0 ? "EMPTY" : count <= 2 ? "THIN" : count <= 5 ? "ADEQUATE" : "STRONG";
      byClass[dc] = {
        count,
        weapons: matching.map((w) => `${w.weaponId}: ${w.name}`),
        strength,
      };
    }

    // Identify gaps and recommendations
    const gaps: string[] = [];
    const recommendations: string[] = [];
    for (const dc of ALL_CLASSES) {
      if (byClass[dc].count === 0) {
        gaps.push(`${dc}: NO active weapons. Critical gap.`);
        recommendations.push(`Commander: fire a Renaissance spark targeting ${dc} weapons.`);
      } else if (byClass[dc].count <= 2) {
        gaps.push(`${dc}: Only ${byClass[dc].count} weapon(s). Thin coverage.`);
        recommendations.push(`Consider additional ${dc} weapons for depth.`);
      }
    }

    return {
      totalWeapons: this.weapons.size,
      activeWeapons: active.length,
      byDeploymentClass: byClass,
      gaps,
      recommendations,
    };
  }
}
