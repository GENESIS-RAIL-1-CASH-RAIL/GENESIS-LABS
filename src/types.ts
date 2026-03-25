// ═══════════════════════════════════════════════════════════════════════
// GENESIS LABS — The Weapons Forge
// Port 8845 | Under DARPA | Zero Copy Gate via SOP-101
// "Their apple, our X. We NEVER copy."
// ═══════════════════════════════════════════════════════════════════════

// ── Source & Triage ─────────────────────────────────────────────────

export type SourceGrade = "A" | "B" | "C" | "D";

export interface SourceProfile {
  sourceId: string;
  name: string;
  grade: SourceGrade;
  category: "JOURNAL" | "UNIVERSITY" | "FIRM" | "COMMUNITY" | "ANONYMOUS";
  trustScore: number;
  papersIngested: number;
  weaponsProduced: number;
  lastSeenAt: string;
}

export type KillChainGrade = "FLASH" | "PRIORITY" | "ROUTINE" | "ARCHIVE";

export type LabsTaskMode = "OFFENSIVE" | "DEFENSIVE";

export type LabsTaskStatus =
  | "RECEIVED"
  | "TRIAGED"
  | "DISSECTING"
  | "DISSECTED"
  | "RECONSTRUCTING"
  | "RECONSTRUCTED"
  | "HARDENING"
  | "HARDENED"
  | "ZERO_COPY_GATE"
  | "CLEARED"
  | "RELEASED"
  | "KILLED"
  | "BLOCKED";

export interface LabsTask {
  taskId: string;
  workOrderId: string | null;
  missionId: string | null;
  title: string;
  description: string;
  mode: LabsTaskMode;
  status: LabsTaskStatus;
  killChainGrade: KillChainGrade;
  sourceGrade: SourceGrade;
  sourceName: string;
  sourceUrl: string;
  originalAbstract: string;
  coreConcept: string;
  dissection: DissectionRecord | null;
  reconstruction: ReconstructionRecord | null;
  hardening: HardeningRecord | null;
  zeroCopyResult: ZeroCopyResult | null;
  weapon: WeaponRecord | null;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  killedReason: string | null;
}

// ── Stage 1: Dissection ─────────────────────────────────────────────

export interface DissectionRecord {
  concept: string;
  mechanism: string;
  assumptions: string[];
  weaknesses: string[];
  applicability: string;
  killDecision: boolean;
  killReason: string | null;
  dissectedAt: string;
}

// ── Stage 2: Reconstruction (Dropbox Protocol) ─────────────────────

export type DropboxSlotId = "ALPHA" | "BRAVO" | "CHARLIE" | "DELTA" | "ECHO";

export interface DropboxSubmission {
  slotId: DropboxSlotId;
  question: string;
  response: string;
  confidence: number;
  submittedAt: string;
}

export interface ContradictionFinding {
  slotId: DropboxSlotId;
  contradictingConcept: string;
  source: string;
  reasoning: string;
  confidence: number;
}

export interface RefereeVerdict {
  consensusApproach: string;
  disagreements: string[];
  contradictions: ContradictionFinding[];
  hallucinationFlags: string[];
  confidence: number;
  recommendation: string;
  verdictAt: string;
}

export interface ReconstructionRecord {
  dropboxSubmissions: DropboxSubmission[];
  refereeVerdict: RefereeVerdict;
  reconstructedApproach: string;
  originalDelta: string;
  novelElements: string[];
  combinedWith: string[];
  reconstructedAt: string;
}

// ── Stage 3: Hardening ──────────────────────────────────────────────

export interface RedTeamAssault {
  attackVector: string;
  result: "SURVIVED" | "BROKEN" | "WEAKENED";
  details: string;
  recommendation: string;
}

export interface HardeningRecord {
  redTeamAssaults: RedTeamAssault[];
  survivalRate: number;
  backtestPeriod: string;
  backtestResult: string;
  combinationCheck: string[];
  hardenedAt: string;
}

// ── Zero Copy Gate ──────────────────────────────────────────────────

export interface ZeroCopyResult {
  structuralDivergence: boolean;
  structuralDetails: string;
  originalityRatio: number;
  originalityBreakdown: string;
  cleanRoomProvenance: boolean;
  provenanceChain: string[];
  sopVerdict: "LAWFUL" | "UNLAWFUL" | "CAUTION" | "UNRESOLVED";
  passed: boolean;
  evaluatedAt: string;
}

// ── Weapon (Final Output) ───────────────────────────────────────────

export type WeaponStatus = "ACTIVE" | "REVIEW" | "RETIRED" | "EXPIRED";

export type WeaponCategory =
  | "STATISTICAL_ARBITRAGE"
  | "MARKET_MICROSTRUCTURE"
  | "FUNDING_RATE"
  | "CROSS_CHAIN"
  | "MEV"
  | "LIQUIDITY"
  | "VOLATILITY"
  | "SENTIMENT"
  | "YIELD"
  | "DEFENSIVE_COUNTER"
  | "EVASION_PATTERN"
  | "CUSTOM";

export interface WeaponRecord {
  weaponId: string;
  name: string;
  category: WeaponCategory;
  description: string;
  mechanism: string;
  mode: LabsTaskMode;
  sourceGrade: SourceGrade;
  birthCertificate: BirthCertificate;
  decayClock: DecayClock;
  pepFormationAffinity: string[];
  combinationPartners: string[];
  killConditions: string[];
  status: WeaponStatus;
  releasedAt: string;
  lastReviewAt: string | null;
  livePerformance: WeaponPerformance;
}

export interface BirthCertificate {
  taskId: string;
  originalSource: string;
  originalUrl: string;
  conceptExtracted: string;
  researchPath: string[];
  transformationEvidence: string;
  zeroCopyStamp: string;
  redTeamClearance: string;
}

export interface DecayClock {
  bornAt: string;
  halfLifeDays: number;
  reviewDueAt: string;
  status: "TICKING" | "REVIEW_DUE" | "EXPIRED";
}

export interface WeaponPerformance {
  deploymentsCount: number;
  totalPnl: number;
  winRate: number;
  avgEdgeBps: number;
  lastDeployedAt: string | null;
  lastPnlUpdate: string | null;
}

// ── Labs State ──────────────────────────────────────────────────────

export interface LabsState {
  enabled: boolean;
  mode: "SIMULATION" | "API";
  port: number;
  totalTasksReceived: number;
  totalDissected: number;
  totalReconstructed: number;
  totalHardened: number;
  totalCleared: number;
  totalReleased: number;
  totalKilled: number;
  totalBlocked: number;
  activeWeapons: number;
  retiredWeapons: number;
  expiredWeapons: number;
  reviewDueWeapons: number;
  lastTaskAt: string | null;
  lastReleaseAt: string | null;
  lastDecayCheckAt: string | null;
}

// ── Inbound Payloads ────────────────────────────────────────────────

export interface DarpaWorkOrderPayload {
  orderId: string;
  title: string;
  description: string;
  justification: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  spec: string;
  acceptanceCriteria: string[];
  source: string;
  missionId?: string;
  sourceName?: string;
  sourceUrl?: string;
}

export interface DefensiveThreatPayload {
  threatId: string;
  title: string;
  description: string;
  detectedPattern: string;
  sourceName: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}
