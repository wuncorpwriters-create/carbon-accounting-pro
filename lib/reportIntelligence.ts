import { formatNumber } from "./carbonFormat";

export type ReportRow = {
  id: string;
  created_at?: string | null;
  company_name?: string | null;
  country?: string | null;
  industry?: string | null;
  period_label?: string | null;
  reporting_period?: string | null;
  employee_count?: number | null;
  electricity_kwh?: number | null;
  electricity_method?: string | null;
  electricity_factor?: number | null;
  fuel_liters?: number | null;
  fuel_type?: string | null;
  fuel_factor?: number | null;
  scope1_emissions?: number | null;
  scope2_emissions?: number | null;
  total_emissions?: number | null;
};

export type IntensityTone = "low" | "moderate" | "high" | "unknown";
export type SignalTone = "positive" | "negative" | "neutral";
export type ConfidenceLevel = "low" | "medium" | "high";

export type BestMonthDriverKind =
  | "fuel"
  | "electricity"
  | "scale"
  | "efficiency"
  | "mixed"
  | "insufficient-data";

export type BestMonthDriverSignal = {
  kind: BestMonthDriverKind;
  label: string;
  tone: SignalTone;
  summary: string;
  action: string;
};

export type BestMonthGapSignal = {
  label: string;
  tone: SignalTone;
  summary: string;
  action: string;
};

export type BestMonthReference = {
  hasBestMonth: boolean;
  bestMonthLabel: string;
  bestMonthId: string | null;
  gapKg: number | null;
  gapPercent: number | null;
  currentPerEmployee: number | null;
  bestPerEmployee: number | null;
  perEmployeeGap: number | null;
  driverSignal: BestMonthDriverSignal;
  gapSignal: BestMonthGapSignal;
  summary: string;
  nextStep: string;
};



export type IntensityBand = {
  label: string;
  tone: IntensityTone;
  action: string;
};

export type TrendDirection = {
  label: string;
  tone: SignalTone;
  summary: string;
  action: string;
};

export type DominantSource = {
  label: string;
  summary: string;
  action: string;
};

export type BaselineComparison = {
  label: string;
  tone: SignalTone;
  summary: string;
  action: string;
  average: number | null;
  delta: number | null;
  percentage: number | null;
  periodsUsed: number;
};

export type ComparisonMetric = {
  label: string;
  current: number | null;
  baseline: number | null;
  delta: number | null;
  percentage: number | null;
  direction: "up" | "down" | "flat" | "unknown";
  tone: SignalTone;
  changeLabel: string;
};

export type ComparisonMetrics = {
  baselineLabel: string;
  currentLabel: string;
  totalEmissions: ComparisonMetric;
  scope1: ComparisonMetric;
  scope2: ComparisonMetric;
  emissionsPerEmployee: ComparisonMetric;
  electricity: ComparisonMetric;
  fuel: ComparisonMetric;
};

export type ComparisonSummary = {
  title: string;
  summary: string;
  action: string;
  tone: SignalTone;
};

export type BaselineWindow = {
  primaryAverage: number | null;
  primaryPeriodsUsed: number;
  primaryLabel: string;
  secondaryAverage: number | null;
  secondaryPeriodsUsed: number;
  secondaryLabel: string | null;
  confidence: ConfidenceLevel;
};

export type AnomalySignal = {
  label: string;
  tone: SignalTone;
  confidence: ConfidenceLevel;
  status:
    | "above-normal"
    | "below-normal"
    | "near-normal"
    | "insufficient-history";
  summary: string;
  action: string;
  baselineAverage: number | null;
  delta: number | null;
  percentage: number | null;
  periodsUsed: number;
};

export type SourceWatchout = {
  label: string;
  tone: SignalTone;
  summary: string;
  action: string;
};

export type ConsistencySignal = {
  label: string;
  tone: SignalTone;
  confidence: ConfidenceLevel;
  summary: string;
  action: string;
  status: "stable" | "moderately-variable" | "volatile" | "insufficient-history";
  periodsUsed: number;
  coefficientOfVariation: number | null;
  rangePercentage: number | null;
};

export type ManagementSignal = {
  label: string;
  tone: SignalTone;
  summary: string;
  action: string;
};

export type RecentPositionSignal = {
  label: string;
  tone: SignalTone;
  summary: string;
  action: string;
  status:
    | "best-recent"
    | "worst-recent"
    | "near-best"
    | "mid-range"
    | "insufficient-history";
  periodsUsed: number;
  bestValue: number | null;
  worstValue: number | null;
  currentRank: number | null;
  gapToBest: number | null;
  gapToBestPercent: number | null;
};

export type DeteriorationStreakSignal = {
  label: string;
  tone: SignalTone;
  summary: string;
  action: string;
  status:
    | "repeated-worsening"
    | "repeated-improving"
    | "mixed"
    | "insufficient-history";
  periodsUsed: number;
  worseningStreak: number;
  improvingStreak: number;
};

export type PersistentSourceSignal = {
  label: string;
  tone: SignalTone;
  summary: string;
  action: string;
  status:
    | "scope1-persistent"
    | "scope2-persistent"
    | "balanced-persistent"
    | "mixed"
    | "insufficient-history";
  periodsUsed: number;
  scope1DominantPeriods: number;
  scope2DominantPeriods: number;
  balancedPeriods: number;
};

export type RecentTrajectorySignal = {
  label: string;
  tone: SignalTone;
  summary: string;
  action: string;
  status:
    | "sustained-improvement"
    | "sustained-deterioration"
    | "holding-gains"
    | "partial-rebound"
    | "mixed-trajectory"
    | "insufficient-history";
  periodsUsed: number;
  improvingMoves: number;
  worseningMoves: number;
  netChange: number | null;
  netChangePercent: number | null;
};

export type ChangeDriverSignal = {
  label: string;
  tone: SignalTone;
  summary: string;
  action: string;
  status:
    | "scale-driven-increase"
    | "scale-driven-reduction"
    | "efficiency-deterioration"
    | "efficiency-improvement"
    | "scope1-shift"
    | "scope2-shift"
    | "broad-based-change"
    | "mixed-change"
    | "insufficient-history";
};

export function formatDisplayDate(dateString: string | null | undefined) {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPeriodLabel(report: ReportRow | null) {
  if (report?.period_label && String(report.period_label).trim()) {
    return String(report.period_label).trim();
  }

  if (report?.reporting_period && String(report.reporting_period).trim()) {
    return String(report.reporting_period).trim();
  }

  return formatDisplayDate(report?.created_at);
}

export function getPerEmployee(
  total: number | null | undefined,
  employees: number | null | undefined
) {
  if (total == null || employees == null || employees <= 0) return null;
  return total / employees;
}

export function getIntensityBand(
  perEmployee: number | null
): IntensityBand | null {
  if (perEmployee == null || Number.isNaN(perEmployee)) {
    return null;
  }

  if (perEmployee < 50) {
    return {
      label: "Low",
      tone: "low",
      action: "Keep current controls in place and monitor monthly.",
    };
  }

  if (perEmployee < 150) {
    return {
      label: "Moderate",
      tone: "moderate",
      action:
        "Target efficiency improvements in your highest-use activities.",
    };
  }

  return {
    label: "High",
    tone: "high",
    action: "Prioritize reductions now, starting with your biggest source.",
  };
}

export function parseReportingDateStrict(report: ReportRow): Date | null {
  const raw = (report.period_label || report.reporting_period || "").trim();

  if (!raw) return null;

  const normalized = raw.replace(/\s+/g, " ").trim();

  if (/^[A-Za-z]{3,9}\s+\d{4}$/i.test(normalized)) {
    const parsed = new Date(`${normalized} 01`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (/^\d{4}-\d{2}$/.test(normalized)) {
    const parsed = new Date(`${normalized}-01`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

export function parseSortDate(report: ReportRow): Date | null {
  const strict = parseReportingDateStrict(report);
  if (strict) return strict;

  if (report.created_at) {
    const created = new Date(report.created_at);
    if (!Number.isNaN(created.getTime())) return created;
  }

  return null;
}

export function compareReportsChronologically(
  a: { report: ReportRow; parsedDate: Date | null },
  b: { report: ReportRow; parsedDate: Date | null }
) {
  if (a.parsedDate && b.parsedDate) {
    return a.parsedDate.getTime() - b.parsedDate.getTime();
  }

  if (a.parsedDate && !b.parsedDate) return -1;
  if (!a.parsedDate && b.parsedDate) return 1;

  const createdA = a.report.created_at
    ? new Date(a.report.created_at).getTime()
    : 0;
  const createdB = b.report.created_at
    ? new Date(b.report.created_at).getTime()
    : 0;

  if (createdA !== createdB) {
    return createdA - createdB;
  }

  return a.report.id.localeCompare(b.report.id);
}

export function sortReportsChronologically(reports: ReportRow[]) {
  return reports
    .map((report) => ({
      report,
      parsedDate: parseSortDate(report),
    }))
    .sort(compareReportsChronologically)
    .map((item) => item.report);
}

export function getChronologicalNeighbors(
  reports: ReportRow[],
  currentReportId: string
) {
  const sorted = sortReportsChronologically(reports);
  const index = sorted.findIndex((report) => report.id === currentReportId);

  if (index === -1) {
    return {
      previous: null as ReportRow | null,
      current: null as ReportRow | null,
      next: null as ReportRow | null,
      sorted,
      index,
    };
  }

  return {
    previous: index > 0 ? sorted[index - 1] : null,
    current: sorted[index] ?? null,
    next: index < sorted.length - 1 ? sorted[index + 1] : null,
    sorted,
    index,
  };
}

function getSafeNumber(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return null;
  return value;
}

function getAverage(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getStandardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const average = getAverage(values);
  if (average == null) return 0;
  const variance =
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    values.length;
  return Math.sqrt(variance);
}

function getComparisonDirection(
  current: number | null,
  baseline: number | null
): "up" | "down" | "flat" | "unknown" {
  if (current == null || baseline == null) return "unknown";

  const delta = current - baseline;
  const threshold = Math.max(Math.abs(baseline) * 0.03, 1);

  if (Math.abs(delta) <= threshold) return "flat";
  return delta > 0 ? "up" : "down";
}

function getComparisonTone(
  direction: "up" | "down" | "flat" | "unknown"
): SignalTone {
  if (direction === "down") return "positive";
  if (direction === "up") return "negative";
  return "neutral";
}

function formatPercentAbsolute(value: number | null, digits = 1) {
  if (value == null || Number.isNaN(value)) return null;
  return `${formatNumber(Math.abs(value), digits)}%`;
}

function getBaselineConfidenceLabel(periodsUsed: number) {
  if (periodsUsed >= 3) return "recent operating baseline";
  if (periodsUsed === 2) return "early operating baseline";
  return "single-period baseline";
}

function getBaselineReferenceText(periodsUsed: number) {
  if (periodsUsed >= 3) return "recent operating baseline";
  if (periodsUsed === 2) return "early operating baseline";
  return "single-period baseline";
}

function getAverageWindowLabel(periodsUsed: number) {
  if (periodsUsed <= 0) return "baseline";
  if (periodsUsed === 1) return "previous period";
  return `recent ${periodsUsed}-period average`;
}

function getConfidenceLabel(confidence: ConfidenceLevel) {
  if (confidence === "high") return "with high confidence";
  if (confidence === "medium") return "with moderate confidence";
  return "but history is still limited";
}

function getComparableHistory(
  report: ReportRow | null,
  comparisonHistory: ReportRow[]
) {
  const currentId = report?.id ?? null;

  return sortReportsChronologically(
    comparisonHistory.filter((item) => {
      if (!item) return false;
      if (currentId && item.id === currentId) return false;
      return item.total_emissions != null && !Number.isNaN(item.total_emissions);
    })
  );
}

function getHistoricalTotals(
  report: ReportRow | null,
  comparisonHistory: ReportRow[]
) {
  return getComparableHistory(report, comparisonHistory)
    .map((item) => getSafeNumber(item.total_emissions))
    .filter((value): value is number => value != null);
}

export function getConsistencySignal(
  report: ReportRow | null,
  comparisonHistory: ReportRow[]
): ConsistencySignal {
  const totals = getHistoricalTotals(report, comparisonHistory).slice(-6);
  const periodsUsed = totals.length;

  if (periodsUsed < 2) {
    return {
      label: "Early pattern",
      tone: "neutral",
      confidence: "low",
      status: "insufficient-history",
      summary:
        "There is not enough recent history yet to judge whether operating performance is stable or volatile.",
      action:
        "Add more completed months before interpreting one result as a durable pattern.",
      periodsUsed,
      coefficientOfVariation: null,
      rangePercentage: null,
    };
  }

  const average = getAverage(totals);
  const min = Math.min(...totals);
  const max = Math.max(...totals);
  const standardDeviation = getStandardDeviation(totals);
  const coefficientOfVariation =
    average && average > 0 ? (standardDeviation / average) * 100 : null;
  const rangePercentage =
    average && average > 0 ? ((max - min) / average) * 100 : null;

  const confidence: ConfidenceLevel =
    periodsUsed >= 4 ? "high" : periodsUsed === 3 ? "medium" : "low";

  if (
    coefficientOfVariation != null &&
    rangePercentage != null &&
    coefficientOfVariation <= 12 &&
    rangePercentage <= 30
  ) {
    return {
      label: "Stable recent pattern",
      tone: "positive",
      confidence,
      status: "stable",
      summary: `Recent months show a relatively stable operating pattern across ${periodsUsed} comparable period${
        periodsUsed === 1 ? "" : "s"
      }, which makes current deviations easier to interpret as real changes rather than noise.`,
      action:
        "Treat strong movement away from recent normal as more decision-useful, because recent volatility has been limited.",
      periodsUsed,
      coefficientOfVariation,
      rangePercentage,
    };
  }

  if (
    coefficientOfVariation != null &&
    rangePercentage != null &&
    coefficientOfVariation <= 25 &&
    rangePercentage <= 60
  ) {
    return {
      label: "Changing month to month",
      tone: "neutral",
      confidence,
      status: "moderately-variable",
      summary: `Recent months show some variability across ${periodsUsed} comparable periods, so individual month changes should be interpreted with moderate caution.`,
      action:
        "Use both recent baseline and source-level signals together before treating one month as a major shift.",
      periodsUsed,
      coefficientOfVariation,
      rangePercentage,
    };
  }

  return {
    label: "Changing month to month",
    tone: "negative",
    confidence,
    status: "volatile",
    summary: `Recent months show a broad operating range across ${periodsUsed} comparable periods, which means single-month changes may reflect an unstable pattern as much as a clear operational shift.`,
    action:
      "Interpret one month cautiously and look for repeated movement across multiple cycles before locking in major conclusions.",
    periodsUsed,
    coefficientOfVariation,
    rangePercentage,
  };
}

function getAdjustedConfidenceFromHistory(
  periodsUsed: number,
  consistencySignal: ConsistencySignal
): ConfidenceLevel {
  let base: ConfidenceLevel =
    periodsUsed >= 3 ? "high" : periodsUsed === 2 ? "medium" : "low";

  if (periodsUsed <= 1) return base;

  if (consistencySignal.status === "volatile") {
    if (base === "high") return "medium";
    if (base === "medium") return "low";
    return "low";
  }

  if (consistencySignal.status === "stable" && periodsUsed >= 3) {
    return "high";
  }

  return base;
}

export function getBaselineWindow(
  report: ReportRow | null,
  comparisonHistory: ReportRow[]
): BaselineWindow {
  const comparableHistory = getComparableHistory(report, comparisonHistory);
  const totals = comparableHistory
    .map((item) => getSafeNumber(item.total_emissions))
    .filter((value): value is number => value != null);

  const primarySource = totals.slice(-3);
  const secondarySource = totals.length >= 4 ? totals.slice(-6) : [];

  const primaryPeriodsUsed = primarySource.length;
  const secondaryPeriodsUsed = secondarySource.length;
  const consistencySignal = getConsistencySignal(report, comparisonHistory);

  return {
    primaryAverage: getAverage(primarySource),
    primaryPeriodsUsed,
    primaryLabel: getAverageWindowLabel(primaryPeriodsUsed),
    secondaryAverage: getAverage(secondarySource),
    secondaryPeriodsUsed,
    secondaryLabel:
      secondaryPeriodsUsed > 0 ? getAverageWindowLabel(secondaryPeriodsUsed) : null,
    confidence: getAdjustedConfidenceFromHistory(
      primaryPeriodsUsed,
      consistencySignal
    ),
  };
}

function buildComparisonMetric(
  label: string,
  current: number | null | undefined,
  baseline: number | null | undefined
): ComparisonMetric {
  const safeCurrent = getSafeNumber(current);
  const safeBaseline = getSafeNumber(baseline);

  const delta =
    safeCurrent != null && safeBaseline != null
      ? safeCurrent - safeBaseline
      : null;

  const percentage =
    delta != null && safeBaseline != null && safeBaseline !== 0
      ? (delta / safeBaseline) * 100
      : null;

  const direction = getComparisonDirection(safeCurrent, safeBaseline);
  const tone = getComparisonTone(direction);

  let changeLabel = "Not enough data";

  if (direction === "flat") {
    changeLabel = "No material change";
  } else if (direction === "up") {
    changeLabel = `Up ${
      formatPercentAbsolute(percentage) ?? formatNumber(Math.abs(delta ?? 0), 1)
    }`;
  } else if (direction === "down") {
    changeLabel = `Down ${
      formatPercentAbsolute(percentage) ?? formatNumber(Math.abs(delta ?? 0), 1)
    }`;
  }

  return {
    label,
    current: safeCurrent,
    baseline: safeBaseline,
    delta,
    percentage,
    direction,
    tone,
    changeLabel,
  };
}

export 
function safeDivide(value: number | null | undefined, by: number | null | undefined) {
  if (value == null || by == null || by <= 0) return null;
  const result = value / by;
  return Number.isFinite(result) ? result : null;
}

function formatSignedPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "Not enough data";
  const rounded = Math.round(value);
  if (rounded > 0) return `+${rounded}%`;
  return `${rounded}%`;
}


function buildRecoveryProgressSignal(
  report: ReportRow | null,
  previousComparableReport: ReportRow | null,
  bestMonthReference: BestMonthReference
): RecoveryProgressSignal {
  if (!report || !bestMonthReference.hasBestMonth) {
    return {
      label: "Limited recovery history",
      tone: "neutral",
      summary:
        "There is not enough history yet to judge whether the gap to your strongest recent month is narrowing or widening.",
      action:
        "Keep monthly reporting consistent so best-month recovery progress becomes clearer over the next few cycles.",
      status: "insufficient-history",
      currentGapKg: null,
      previousGapKg: null,
      gapChangeKg: null,
    };
  }

  const currentGapKg = bestMonthReference.gapKg ?? null;
  const bestTotal =
    report.total_emissions != null && currentGapKg != null
      ? report.total_emissions - currentGapKg
      : null;
  const previousGapKg =
    previousComparableReport?.total_emissions != null && bestTotal != null
      ? previousComparableReport.total_emissions - bestTotal
      : null;
  const gapChangeKg =
    currentGapKg != null && previousGapKg != null
      ? currentGapKg - previousGapKg
      : null;

  if (currentGapKg != null && currentGapKg <= 0) {
    return {
      label: "At best month",
      tone: "positive",
      summary:
        "This month now sets the current best-month reference point.",
      action:
        "Confirm next cycle that this stronger operating level is repeatable.",
      status: "at-best",
      currentGapKg,
      previousGapKg,
      gapChangeKg,
    };
  }

  if (currentGapKg == null || previousGapKg == null || gapChangeKg == null) {
    return {
      label: "Limited recovery history",
      tone: "neutral",
      summary:
        "There is not enough comparable history yet to judge whether the remaining gap to your best month is improving or worsening.",
      action:
        "Add another completed comparable month before leaning on recovery-progress interpretation.",
      status: "insufficient-history",
      currentGapKg,
      previousGapKg,
      gapChangeKg,
    };
  }

  if (Math.abs(currentGapKg) <= 500 && Math.abs(gapChangeKg) <= 500) {
    return {
      label: "Holding near best",
      tone: "positive",
      summary:
        "The latest month remains close to your strongest recent month, with no meaningful change in the remaining gap.",
      action:
        "Hold the current operating controls steady and use the next cycle to confirm this near-best position is durable.",
      status: "holding-near-best",
      currentGapKg,
      previousGapKg,
      gapChangeKg,
    };
  }

  if (gapChangeKg < -500) {
    return {
      label: "Closing gap to best",
      tone: "positive",
      summary:
        "The gap to your strongest recent month is narrower than it was in the previous comparable month.",
      action:
        "Keep using the strongest recent month as the operating reference and preserve the changes that are reducing the remaining gap.",
      status: "closing-gap",
      currentGapKg,
      previousGapKg,
      gapChangeKg,
    };
  }

  if (gapChangeKg > 500) {
    return {
      label: "Drifting away from best",
      tone: "negative",
      summary:
        "The gap to your strongest recent month is wider than it was in the previous comparable month.",
      action:
        "Compare the latest month with both your strongest month and the previous comparable month to identify what widened the gap.",
      status: "drifting-away",
      currentGapKg,
      previousGapKg,
      gapChangeKg,
    };
  }

  return {
    label: "No clear change versus best",
    tone: "neutral",
    summary:
      "The gap to your strongest recent month has not moved enough yet to show a clear recovery or setback.",
    action:
      "Keep the next cycle consistent and watch whether the gap begins to close more clearly.",
    status: "no-clear-change",
    currentGapKg,
    previousGapKg,
    gapChangeKg,
  };
}

function buildBestMonthReference(
  current: ReportRow,
  comparableHistory: ReportRow[]
): BestMonthReference {
  const currentTotal = current.total_emissions ?? null;
  const currentEmployees = current.employee_count ?? null;
  const currentFuel = current.fuel_liters ?? null;
  const currentElectricity = current.electricity_kwh ?? null;
  const currentPerEmployee = safeDivide(currentTotal, currentEmployees);

  const candidates = sortReportsChronologically(
    [...comparableHistory, current].filter((row, index, arr) => {
      if (!row?.id) return false;
      const total = row.total_emissions ?? null;
      if (total == null || total < 0) return false;
      return arr.findIndex((candidate) => candidate.id === row.id) === index;
    })
  );

  if (currentTotal == null || candidates.length === 0) {
    return {
      hasBestMonth: false,
      bestMonthLabel: "No benchmark yet",
      bestMonthId: null,
      gapKg: null,
      gapPercent: null,
      currentPerEmployee,
      bestPerEmployee: null,
      perEmployeeGap: null,
      driverSignal: {
        kind: "insufficient-data",
        label: "Limited benchmark history",
        tone: "neutral",
        summary: "A strongest recent month cannot yet be identified from the available history.",
        action: "Keep submitting monthly assessments to unlock stronger best-month comparison guidance.",
      },
      gapSignal: {
        label: "Limited benchmark history",
        tone: "neutral",
        summary: "There is not enough recent history yet to compare this month against a strongest reference month.",
        action: "Build a few more months of consistent reporting to unlock best-month gap analysis.",
      },
      summary: "Best-month comparison is not yet available.",
      nextStep: "Continue monthly reporting to establish a reliable best-month baseline.",
    };
  }

  const bestMonth = [...candidates].sort((a, b) => {
    const aTotal = a.total_emissions ?? Number.POSITIVE_INFINITY;
    const bTotal = b.total_emissions ?? Number.POSITIVE_INFINITY;
    return aTotal - bTotal;
  })[0];

  const bestTotal = bestMonth.total_emissions ?? null;
  const bestEmployees = bestMonth.employee_count ?? null;
  const bestFuel = bestMonth.fuel_liters ?? null;
  const bestElectricity = bestMonth.electricity_kwh ?? null;
  const bestPerEmployee = safeDivide(bestTotal, bestEmployees);

  const gapKg =
    currentTotal != null && bestTotal != null ? currentTotal - bestTotal : null;
  const gapPercent = getPercentChange(currentTotal, bestTotal);
  const perEmployeeGap =
    currentPerEmployee != null && bestPerEmployee != null
      ? currentPerEmployee - bestPerEmployee
      : null;

  const fuelDelta =
    currentFuel != null && bestFuel != null ? currentFuel - bestFuel : null;
  const electricityDelta =
    currentElectricity != null && bestElectricity != null
      ? currentElectricity - bestElectricity
      : null;
  const employeeDelta =
    currentEmployees != null && bestEmployees != null
      ? currentEmployees - bestEmployees
      : null;

  const intensityChangePercent =
    currentPerEmployee != null && bestPerEmployee != null && bestPerEmployee > 0
      ? ((currentPerEmployee - bestPerEmployee) / bestPerEmployee) * 100
      : null;

  const fuelWeight = fuelDelta != null ? Math.max(fuelDelta, 0) : 0;
  const electricityWeight =
    electricityDelta != null ? Math.max(electricityDelta, 0) : 0;
  const scaleWeight = employeeDelta != null ? Math.max(employeeDelta, 0) : 0;
  const efficiencyWeight =
    intensityChangePercent != null ? Math.max(intensityChangePercent, 0) : 0;

  const weights = [
    { kind: "fuel" as const, value: fuelWeight },
    { kind: "electricity" as const, value: electricityWeight },
    { kind: "scale" as const, value: scaleWeight },
    { kind: "efficiency" as const, value: efficiencyWeight },
  ].sort((a, b) => b.value - a.value);

  const top = weights[0];
  const second = weights[1];

  let driverKind: BestMonthDriverKind = "mixed";

  if (!top || top.value <= 0) {
    driverKind = "mixed";
  } else if (!second || top.value >= second.value * 1.6) {
    driverKind = top.kind;
  } else {
    driverKind = "mixed";
  }

  const bestMonthLabel = formatPeriodLabel(bestMonth);
  const gapFar =
    gapPercent != null ? gapPercent >= 20 : gapKg != null ? gapKg >= 1000 : false;
  const gapClose =
    gapPercent != null ? Math.abs(gapPercent) <= 8 : gapKg != null ? Math.abs(gapKg) <= 500 : false;

  let driverSignal: BestMonthDriverSignal;

  if (gapKg != null && gapKg <= 0) {
    driverSignal = {
      kind: "efficiency",
      label: "At or better than best month",
      tone: "positive",
      summary: `This month is performing at or below the strongest recent month (${bestMonthLabel}).`,
      action: "Protect the operating conditions behind this stronger result and repeat them next cycle.",
    };
  } else {
    switch (driverKind) {
      case "fuel":
        driverSignal = {
          kind: "fuel",
          label: "Fuel-led gap",
          tone: gapFar ? "negative" : "neutral",
          summary: `Most of the gap versus ${bestMonthLabel} appears to be driven by fuel-side changes.`,
          action: "Review fleet, generator, and fuel-use practices first because fuel appears to be the clearest lever back toward best-month performance.",
        };
        break;
      case "electricity":
        driverSignal = {
          kind: "electricity",
          label: "Electricity-led gap",
          tone: gapFar ? "negative" : "neutral",
          summary: `Most of the gap versus ${bestMonthLabel} appears to be electricity-led.`,
          action: "Check usage patterns, equipment runtime, and purchased-electricity controls first to close the remaining gap.",
        };
        break;
      case "scale":
        driverSignal = {
          kind: "scale",
          label: "Scale-led gap",
          tone: "neutral",
          summary: `The current month appears to be larger in operating scale than ${bestMonthLabel}, which explains much of the gap.`,
          action: "Separate scale effects from efficiency effects and focus next on keeping emissions intensity controlled as activity rises.",
        };
        break;
      case "efficiency":
        driverSignal = {
          kind: "efficiency",
          label: "Efficiency-led gap",
          tone: "negative",
          summary: `The current gap versus ${bestMonthLabel} appears to be driven more by efficiency deterioration than by scale alone.`,
          action: "Focus on restoring the operating habits behind the stronger month rather than treating the increase as normal business variation.",
        };
        break;
      default:
        driverSignal = {
          kind: "mixed",
          label: "Mixed gap drivers",
          tone: gapFar ? "negative" : "neutral",
          summary: `The gap versus ${bestMonthLabel} appears to come from several overlapping factors rather than a single clear source.`,
          action: "Review fuel, electricity, and operating intensity together to identify the quickest path back toward best-month performance.",
        };
        break;
    }
  }

  let gapSignal: BestMonthGapSignal;

  if (gapKg != null && gapKg <= 0) {
    gapSignal = {
      label: "At or better than best month",
      tone: "positive",
      summary: `This month is matching or outperforming the strongest recent month (${bestMonthLabel}).`,
      action: "Treat this month as a reference operating standard and preserve the conditions behind it.",
    };
  } else if (gapClose) {
    gapSignal = {
      label: "Close to best month",
      tone: "positive",
      summary: `This month is close to the strongest recent month (${bestMonthLabel}), with only a modest remaining gap.`,
      action: "Use small operational corrections to close the remaining distance to your best month.",
    };
  } else if (gapFar) {
    gapSignal = {
      label: "Materially above best month",
      tone: "negative",
      summary: `This month sits materially above the strongest recent month (${bestMonthLabel}).`,
      action: "Use the best month as an operational reference point and prioritize the biggest source of the gap first.",
    };
  } else {
    gapSignal = {
      label: "Moderately above best month",
      tone: "neutral",
      summary: `This month is above the strongest recent month (${bestMonthLabel}), but the gap still looks recoverable.`,
      action: "Target the clearest driver of the gap and use the best month as the benchmark to return toward.",
    };
  }

  const summary =
    gapKg != null && gapKg <= 0
      ? `This month is performing at or better than your strongest recent month (${bestMonthLabel}).`
      : `This month is ${formatSignedPercent(gapPercent)} versus your strongest recent month (${bestMonthLabel}), and the gap is mainly ${driverSignal.label.toLowerCase()}.`;

  const nextStep =
    gapKg != null && gapKg <= 0
      ? "Protect and standardize the practices behind this stronger month so the result becomes repeatable."
      : driverSignal.action;

  return {
    hasBestMonth: true,
    bestMonthLabel,
    bestMonthId: bestMonth.id ?? null,
    gapKg,
    gapPercent,
    currentPerEmployee,
    bestPerEmployee,
    perEmployeeGap,
    driverSignal,
    gapSignal,
    summary,
    nextStep,
  };
}

export function buildComparisonMetrics(
  currentReport: ReportRow | null,
  baselineReport: ReportRow | null
): ComparisonMetrics | null {
  if (!currentReport || !baselineReport) return null;

  const currentPerEmployee = getPerEmployee(
    currentReport.total_emissions,
    currentReport.employee_count
  );
  const baselinePerEmployee = getPerEmployee(
    baselineReport.total_emissions,
    baselineReport.employee_count
  );

  return {
    baselineLabel: formatPeriodLabel(baselineReport),
    currentLabel: formatPeriodLabel(currentReport),
    totalEmissions: buildComparisonMetric(
      "Total emissions",
      currentReport.total_emissions,
      baselineReport.total_emissions
    ),
    scope1: buildComparisonMetric(
      "Scope 1",
      currentReport.scope1_emissions,
      baselineReport.scope1_emissions
    ),
    scope2: buildComparisonMetric(
      "Scope 2",
      currentReport.scope2_emissions,
      baselineReport.scope2_emissions
    ),
    emissionsPerEmployee: buildComparisonMetric(
      "Emissions per employee",
      currentPerEmployee,
      baselinePerEmployee
    ),
    electricity: buildComparisonMetric(
      "Electricity use",
      currentReport.electricity_kwh,
      baselineReport.electricity_kwh
    ),
    fuel: buildComparisonMetric(
      "Fuel use",
      currentReport.fuel_liters,
      baselineReport.fuel_liters
    ),
  };
}

export function getComparisonSummary(
  currentReport: ReportRow | null,
  baselineReport: ReportRow | null
): ComparisonSummary | null {
  const comparison = buildComparisonMetrics(currentReport, baselineReport);

  if (!comparison) return null;

  const { totalEmissions, scope1, scope2, emissionsPerEmployee } = comparison;
  const baselineLabel = comparison.baselineLabel;

  if (totalEmissions.direction === "unknown") {
    return {
      title: `Comparison vs ${baselineLabel}`,
      summary:
        "A reliable comparison is not yet available because the two reporting periods do not have enough overlapping data.",
      action:
        "Keep monthly inputs complete so comparison signals become strong enough to support operational decisions.",
      tone: "neutral",
    };
  }

  if (
    totalEmissions.direction === "up" &&
    emissionsPerEmployee.direction === "down"
  ) {
    return {
      title: `Comparison vs ${baselineLabel}`,
      summary:
        "Total emissions are higher than the comparison month, but emissions per employee improved. This suggests activity volume likely increased faster than efficiency deteriorated.",
      action:
        "Check whether the increase came from higher output, longer operating hours, or heavier asset utilization before treating it as a pure efficiency problem.",
      tone: "neutral",
    };
  }

  if (
    totalEmissions.direction === "up" &&
    emissionsPerEmployee.direction === "flat"
  ) {
    return {
      title: `Comparison vs ${baselineLabel}`,
      summary:
        "Total emissions are higher than the comparison month, while emissions per employee are broadly stable. This suggests operational scale may have increased without a major change in efficiency.",
      action:
        "Review whether staffing, production volume, operating hours, or asset utilization expanded in line with the higher emissions month.",
      tone: "neutral",
    };
  }

  if (
    totalEmissions.direction === "up" &&
    scope2.direction === "up" &&
    (scope2.delta ?? 0) >= (scope1.delta ?? Number.NEGATIVE_INFINITY)
  ) {
    return {
      title: `Comparison vs ${baselineLabel}`,
      summary:
        "Total emissions are higher than the comparison month, driven mainly by Scope 2. Purchased electricity appears to be the main source of deterioration in this comparison.",
      action:
        "Review electricity-intensive operations first, then check operating hours, equipment loading, and practical efficiency opportunities.",
      tone: "negative",
    };
  }

  if (
    totalEmissions.direction === "up" &&
    scope1.direction === "up" &&
    (scope1.delta ?? 0) > (scope2.delta ?? Number.NEGATIVE_INFINITY)
  ) {
    return {
      title: `Comparison vs ${baselineLabel}`,
      summary:
        "Total emissions are higher than the comparison month, driven mainly by Scope 1. Direct fuel use appears to be the main source of deterioration in this comparison.",
      action:
        "Review fuel-consuming operations, equipment efficiency, routing, idling, and maintenance controls first.",
      tone: "negative",
    };
  }

  if (
    totalEmissions.direction === "down" &&
    emissionsPerEmployee.direction === "down"
  ) {
    return {
      title: `Comparison vs ${baselineLabel}`,
      summary:
        "This reporting month outperformed the comparison month on both total emissions and emissions per employee, indicating a more efficient operating period.",
      action:
        "Preserve the operating conditions behind this stronger month and repeat them in the next cycle.",
      tone: "positive",
    };
  }

  if (
    totalEmissions.direction === "down" &&
    emissionsPerEmployee.direction === "up"
  ) {
    return {
      title: `Comparison vs ${baselineLabel}`,
      summary:
        "Total emissions are lower than the comparison month, but emissions per employee increased. This suggests the lower total may be partly explained by reduced scale rather than stronger efficiency.",
      action:
        "Check whether staffing or activity volume fell before treating this month as a full efficiency improvement.",
      tone: "neutral",
    };
  }

  if (totalEmissions.direction === "flat") {
    return {
      title: `Comparison vs ${baselineLabel}`,
      summary:
        "Total emissions are broadly in line with the comparison month, with no material overall shift.",
      action:
        "Look for smaller efficiency wins in the dominant source instead of waiting for a larger variance to appear.",
      tone: "neutral",
    };
  }

  if (totalEmissions.direction === "down") {
    return {
      title: `Comparison vs ${baselineLabel}`,
      summary:
        "Total emissions are lower than the comparison month, indicating better overall operating performance in this reporting period.",
      action:
        "Identify what changed in this lower-emissions month and standardize those practices where possible.",
      tone: "positive",
    };
  }

  return {
    title: `Comparison vs ${baselineLabel}`,
    summary:
      "Total emissions are higher than the comparison month, indicating a higher-emissions operating period overall.",
    action:
      "Use the metric-level deltas below to identify the main source of change and act on that first.",
    tone: "negative",
  };
}

export function getTrendDirection(
  latest: ReportRow | null,
  previous: ReportRow | null
): TrendDirection {
  const latestTotal = latest?.total_emissions ?? null;
  const previousTotal = previous?.total_emissions ?? null;

  if (latestTotal == null || previousTotal == null) {
    return {
      label: "Limited history",
      tone: "neutral",
      summary:
        "Add another completed month to unlock month-over-month direction.",
      action: "Keep submitting monthly assessments to build a stronger baseline.",
    };
  }

  const delta = latestTotal - previousTotal;
  const percentage = previousTotal > 0 ? (delta / previousTotal) * 100 : null;
  const stableThreshold = Math.max(previousTotal * 0.03, 5);

  if (Math.abs(delta) <= stableThreshold) {
    return {
      label: "Stable",
      tone: "neutral",
      summary: `Total emissions are broadly stable versus the previous month (${formatNumber(
        previousTotal
      )} kg CO2e).`,
      action:
        "Focus on steady efficiency gains and keep monitoring the dominant source.",
    };
  }

  if (delta < 0) {
    return {
      label: "Improving",
      tone: "positive",
      summary: `Total emissions fell by ${formatNumber(
        Math.abs(delta)
      )} kg CO2e${
        percentage != null ? ` (${formatNumber(Math.abs(percentage), 1)}%)` : ""
      } compared with the previous month.`,
      action:
        "Preserve the reduction drivers and extend them to the next month.",
    };
  }

  return {
    label: "Worsening",
    tone: "negative",
    summary: `Total emissions rose by ${formatNumber(delta, 0)} kg CO2e${
      percentage != null ? ` (${formatNumber(percentage, 1)}%)` : ""
    } compared with the previous month.`,
    action:
      "Review which activity changed most and tackle the dominant source first.",
  };
}

export function getDominantSource(report: ReportRow | null): DominantSource {
  const scope1 = report?.scope1_emissions ?? 0;
  const scope2 = report?.scope2_emissions ?? 0;
  const total = report?.total_emissions ?? 0;

  if (total <= 0) {
    return {
      label: "No clear source",
      summary:
        "There is not enough emissions volume yet to identify a dominant source.",
      action:
        "Complete a fuller assessment before acting on source-level priorities.",
    };
  }

  const difference = Math.abs(scope1 - scope2);
  const balancedThreshold = total * 0.05;

  if (difference <= balancedThreshold) {
    return {
      label: "Balanced",
      summary: "Scope 1 and Scope 2 are contributing at similar levels.",
      action:
        "Review both fuel and electricity efficiency rather than focusing on only one source.",
    };
  }

  if (scope1 > scope2) {
    const share = (scope1 / total) * 100;
    return {
      label: "Scope 1 dominant",
      summary: `Scope 1 is the main driver at ${formatNumber(
        share,
        1
      )}% of total emissions.`,
      action:
        "Prioritize fuel efficiency, runtime controls, fleet/equipment checks, and maintenance.",
    };
  }

  const share = (scope2 / total) * 100;
  return {
    label: "Scope 2 dominant",
    summary: `Scope 2 is the main driver at ${formatNumber(
      share,
      1
    )}% of total emissions.`,
    action:
      "Prioritize electricity efficiency, operating-hour controls, and high-use equipment review.",
  };
}

export function getCoverageLabel(report: ReportRow | null) {
  const electricity = report?.electricity_kwh ?? 0;
  const fuel = report?.fuel_liters ?? 0;

  if (electricity > 0 && fuel > 0) {
    return "Electricity and fuel are both captured, giving a stronger comparison base.";
  }

  if (electricity > 0) {
    return "Only electricity is captured. Add fuel data for a fuller comparison.";
  }

  if (fuel > 0) {
    return "Only fuel is captured. Add electricity data for a fuller comparison.";
  }

  return "Input coverage is limited. Add more activity data.";
}

export function getRecentBaselineComparison(
  report: ReportRow | null,
  comparisonHistory: ReportRow[]
): BaselineComparison {
  const latestTotal = report?.total_emissions ?? null;
  const baselineWindow = getBaselineWindow(report, comparisonHistory);
  const average = baselineWindow.primaryAverage;
  const periodsUsed = baselineWindow.primaryPeriodsUsed;

  if (latestTotal == null || average == null || periodsUsed === 0) {
    return {
      label: "No baseline yet",
      tone: "neutral",
      summary:
        "More completed reporting periods are needed before a recent baseline can be established.",
      action:
        "Keep submitting monthly assessments to build a stronger operating baseline.",
      average: null,
      delta: null,
      percentage: null,
      periodsUsed,
    };
  }

  const delta = latestTotal - average;
  const percentage = average > 0 ? (delta / average) * 100 : null;
  const nearThreshold = Math.max(average * 0.05, 10);
  const baselineConfidence = getBaselineConfidenceLabel(periodsUsed);

  if (Math.abs(delta) <= nearThreshold) {
    return {
      label: "Near baseline",
      tone: "neutral",
      summary: `Total emissions are broadly in line with your ${baselineConfidence} of ${formatNumber(
        average
      )} kg CO2e based on ${periodsUsed} prior period${
        periodsUsed === 1 ? "" : "s"
      }.`,
      action:
        "Focus on targeted efficiency gains to move below your recent operating baseline.",
      average,
      delta,
      percentage,
      periodsUsed,
    };
  }

  if (delta < 0) {
    return {
      label: "Below baseline",
      tone: "positive",
      summary: `Total emissions are ${formatNumber(
        Math.abs(delta),
        0
      )} kg CO2e below your ${baselineConfidence}${
        percentage != null ? ` (${formatNumber(Math.abs(percentage), 1)}%)` : ""
      }.`,
      action:
        "Preserve the operating changes behind this lower-than-baseline month and repeat them next period.",
      average,
      delta,
      percentage,
      periodsUsed,
    };
  }

  return {
    label: "Above baseline",
    tone: "negative",
    summary: `Total emissions are ${formatNumber(
      delta,
      0
    )} kg CO2e above your ${baselineConfidence}${
      percentage != null ? ` (${formatNumber(percentage, 1)}%)` : ""
    }.`,
    action:
      "Investigate what changed versus recent months and reduce the largest driver first.",
    average,
    delta,
    percentage,
    periodsUsed,
  };
}

export function getAnomalySignal(
  report: ReportRow | null,
  comparisonHistory: ReportRow[]
): AnomalySignal {
  const latestTotal = getSafeNumber(report?.total_emissions);
  const baselineWindow = getBaselineWindow(report, comparisonHistory);
  const baselineAverage = baselineWindow.primaryAverage;
  const periodsUsed = baselineWindow.primaryPeriodsUsed;
  const confidence = baselineWindow.confidence;
  const averageLabel = baselineWindow.primaryLabel;

  if (latestTotal == null || baselineAverage == null || periodsUsed === 0) {
    return {
      label: "Not enough history",
      tone: "neutral",
      confidence,
      status: "insufficient-history",
      summary:
        "There is not enough comparable reporting history yet to classify this month as normal or unusual.",
      action:
        "Add more complete monthly periods so unusual-month detection becomes trustworthy.",
      baselineAverage: null,
      delta: null,
      percentage: null,
      periodsUsed,
    };
  }

  const delta = latestTotal - baselineAverage;
  const percentage = baselineAverage > 0 ? (delta / baselineAverage) * 100 : null;
  const absoluteDelta = Math.abs(delta);

  const nearThreshold = Math.max(baselineAverage * 0.05, 10);
  const moderateThreshold = Math.max(baselineAverage * 0.12, 20);
  const strongThreshold = Math.max(baselineAverage * 0.2, 35);

  if (absoluteDelta <= nearThreshold) {
    return {
      label: "Within normal range",
      tone: "neutral",
      confidence,
      status: "near-normal",
      summary: `Total emissions are broadly within the expected range versus your ${averageLabel} of ${formatNumber(
        baselineAverage
      )} kg CO2e ${getConfidenceLabel(confidence)}.`,
      action:
        "Use this month as a stability reference and look for one focused efficiency gain to move below normal next period.",
      baselineAverage,
      delta,
      percentage,
      periodsUsed,
    };
  }

  if (delta > 0) {
    const label =
      confidence === "high" && absoluteDelta >= strongThreshold
        ? "Materially above normal"
        : confidence === "low" || absoluteDelta < moderateThreshold
        ? "Above recent range"
        : "Likely above normal";

    return {
      label,
      tone: "negative",
      confidence,
      status: "above-normal",
      summary: `Total emissions are ${formatNumber(
        absoluteDelta,
        0
      )} kg CO2e above your ${averageLabel} of ${formatNumber(
        baselineAverage
      )} kg CO2e${
        percentage != null ? ` (${formatNumber(Math.abs(percentage), 1)}%)` : ""
      } ${getConfidenceLabel(confidence)}.`,
      action:
        "Treat this as an unusual higher-emissions month and verify the main operational driver before the next reporting cycle closes.",
      baselineAverage,
      delta,
      percentage,
      periodsUsed,
    };
  }

  const label =
    confidence === "high" && absoluteDelta >= strongThreshold
      ? "Materially below normal"
      : confidence === "low" || absoluteDelta < moderateThreshold
      ? "Below recent range"
      : "Likely below normal";

  return {
    label,
    tone: "positive",
    confidence,
    status: "below-normal",
    summary: `Total emissions are ${formatNumber(
      absoluteDelta,
      0
    )} kg CO2e below your ${averageLabel} of ${formatNumber(
      baselineAverage
    )} kg CO2e${
      percentage != null ? ` (${formatNumber(Math.abs(percentage), 1)}%)` : ""
    } ${getConfidenceLabel(confidence)}.`,
    action:
      "Treat this as a potentially stronger-than-normal month and identify what changed so the reduction can be repeated.",
      baselineAverage,
      delta,
      percentage,
      periodsUsed,
  };
}

export function getSourceWatchout(
  report: ReportRow | null,
  previousComparableReport: ReportRow | null
): SourceWatchout {
  const currentTotal = getSafeNumber(report?.total_emissions);
  const previousTotal = getSafeNumber(previousComparableReport?.total_emissions);
  const currentScope1 = getSafeNumber(report?.scope1_emissions) ?? 0;
  const currentScope2 = getSafeNumber(report?.scope2_emissions) ?? 0;
  const previousScope1 =
    getSafeNumber(previousComparableReport?.scope1_emissions) ?? 0;
  const previousScope2 =
    getSafeNumber(previousComparableReport?.scope2_emissions) ?? 0;

  if (currentTotal == null || currentTotal <= 0) {
    return {
      label: "No clear watchout",
      tone: "neutral",
      summary:
        "There is not enough current emissions volume to isolate a useful source watchout.",
      action:
        "Complete fuller monthly inputs before using source-level watchouts to guide action.",
    };
  }

  if (previousTotal == null || previousTotal <= 0) {
    if (currentScope1 > currentScope2) {
      return {
        label: "Fuel-side watchout",
        tone: "negative",
        summary:
          "Direct fuel use is currently the larger source, so fuel-side controls deserve the first review.",
        action:
          "Start with equipment runtime, idling, routing, loading, and maintenance discipline.",
      };
    }

    if (currentScope2 > currentScope1) {
      return {
        label: "Electricity-side watchout",
        tone: "negative",
        summary:
          "Purchased electricity is currently the larger source, so electricity-intensive operations deserve the first review.",
        action:
          "Start with operating hours, high-load equipment, HVAC, lighting, and idle consumption.",
      };
    }

    return {
      label: "Balanced watchout",
      tone: "neutral",
      summary:
        "Scope 1 and Scope 2 are currently close enough that a single dominant watchout does not stand out.",
      action:
        "Run a combined review of both fuel and electricity controls instead of focusing on only one source.",
    };
  }

  const totalDelta = currentTotal - previousTotal;
  const scope1Delta = currentScope1 - previousScope1;
  const scope2Delta = currentScope2 - previousScope2;

  const currentPerEmployee = getPerEmployee(
    report?.total_emissions,
    report?.employee_count
  );
  const previousPerEmployee = getPerEmployee(
    previousComparableReport?.total_emissions,
    previousComparableReport?.employee_count
  );

  if (
    totalDelta > 0 &&
    currentPerEmployee != null &&
    previousPerEmployee != null &&
    currentPerEmployee < previousPerEmployee * 0.97
  ) {
    return {
      label: "Scale-driven increase",
      tone: "neutral",
      summary:
        "Total emissions increased, but emissions per employee improved. This points more toward higher operating scale than a pure efficiency breakdown.",
      action:
        "Check whether staffing, throughput, operating hours, or asset utilization expanded before treating the change as a control failure.",
    };
  }

  if (
    totalDelta < 0 &&
    currentPerEmployee != null &&
    previousPerEmployee != null &&
    currentPerEmployee > previousPerEmployee * 1.03
  ) {
    return {
      label: "Lower total, weaker intensity",
      tone: "neutral",
      summary:
        "Total emissions fell, but emissions per employee worsened. The lower total may reflect reduced scale more than stronger efficiency.",
      action:
        "Check whether output or staffing fell before carrying this month forward as a best-practice model.",
    };
  }

  const sourceDriverThreshold = Math.max(Math.abs(totalDelta) * 0.25, 10);

  if (
    totalDelta > 0 &&
    scope2Delta > 0 &&
    scope2Delta - scope1Delta > sourceDriverThreshold
  ) {
    return {
      label: "Electricity-driven increase",
      tone: "negative",
      summary:
        "Most of the deterioration versus the previous comparable month appears to come from Scope 2, pointing to an electricity-side change.",
      action:
        "Review high-load equipment, operating hours, HVAC, lighting, and any process changes that raised electricity demand.",
    };
  }

  if (
    totalDelta > 0 &&
    scope1Delta > 0 &&
    scope1Delta - scope2Delta > sourceDriverThreshold
  ) {
    return {
      label: "Fuel-driven increase",
      tone: "negative",
      summary:
        "Most of the deterioration versus the previous comparable month appears to come from Scope 1, pointing to a fuel-side change.",
      action:
        "Review equipment runtime, idling, routing, loading, maintenance, and direct combustion controls first.",
    };
  }

  if (totalDelta > 0 && scope1Delta > 0 && scope2Delta > 0) {
    return {
      label: "Both sources moved up",
      tone: "negative",
      summary:
        "Scope 1 and Scope 2 both increased versus the previous comparable month, which suggests a broader operational expansion or multi-source efficiency slippage.",
      action:
        "Review both activity scale and cross-site operating discipline rather than focusing on only one source.",
    };
  }

  if (
    totalDelta < 0 &&
    scope2Delta < 0 &&
    Math.abs(scope2Delta) - Math.abs(scope1Delta) > sourceDriverThreshold
  ) {
    return {
      label: "Electricity-led improvement",
      tone: "positive",
      summary:
        "Most of the reduction versus the previous comparable month appears to come from Scope 2, which suggests electricity-side controls improved.",
      action:
        "Confirm what changed on the electricity side and lock those practices in for the next month.",
    };
  }

  if (
    totalDelta < 0 &&
    scope1Delta < 0 &&
    Math.abs(scope1Delta) - Math.abs(scope2Delta) > sourceDriverThreshold
  ) {
    return {
      label: "Fuel-led improvement",
      tone: "positive",
      summary:
        "Most of the reduction versus the previous comparable month appears to come from Scope 1, which suggests fuel-side controls improved.",
      action:
        "Confirm what changed on the fuel side and standardize those practices for the next cycle.",
    };
  }

  const currentScope1Share = currentTotal > 0 ? currentScope1 / currentTotal : null;
  const previousScope1Share =
    previousTotal > 0 ? previousScope1 / previousTotal : null;

  if (currentScope1Share != null && previousScope1Share != null) {
    const scope1ShareShift = currentScope1Share - previousScope1Share;

    if (scope1ShareShift >= 0.1) {
      return {
        label: "Source mix shifted toward Scope 1",
        tone: "negative",
        summary:
          "The emissions mix shifted materially toward Scope 1 compared with the previous comparable month, even if total emissions did not change evenly across sources.",
        action:
          "Look for fuel-side operating changes, equipment usage shifts, or combustion-heavy activity that took a larger share this month.",
      };
    }

    if (scope1ShareShift <= -0.1) {
      return {
        label: "Source mix shifted toward Scope 2",
        tone: "negative",
        summary:
          "The emissions mix shifted materially toward Scope 2 compared with the previous comparable month, even if total emissions did not change evenly across sources.",
        action:
          "Look for electricity-side operating changes, process loading shifts, or equipment demand that took a larger share this month.",
      };
    }
  }

  if (totalDelta < 0) {
    return {
      label: "Broad-based improvement",
      tone: "positive",
      summary:
        "No single adverse source stands out strongly enough versus the previous comparable month to isolate one clear risk driver. The lower-emissions result may reflect broader operating improvement rather than one isolated change.",
      action:
        "Check which operating controls held steady across both fuel and electricity use, then preserve those conditions into the next cycle.",
    };
  }

  return {
    label: "No single watchout",
    tone: "neutral",
    summary:
      "No single source shift stands out strongly enough versus the previous comparable month to isolate one clear watchout.",
    action:
      "Use the metric-level changes together with operational context to decide where to investigate first.",
  };
}

export function getManagementSignal(
  report: ReportRow | null,
  consistencySignal: ConsistencySignal,
  anomalySignal: AnomalySignal,
  sourceWatchout: SourceWatchout
): ManagementSignal {
  const period = formatPeriodLabel(report);

  if ((report?.total_emissions ?? 0) <= 0) {
    return {
      label: "Limited management view",
      tone: "neutral",
      summary:
        "This period does not yet contain enough emissions volume to support a strong management reading.",
      action:
        "Focus first on complete and consistent monthly inputs before drawing operational conclusions.",
    };
  }

  if (
    sourceWatchout.label === "Lower total, weaker intensity" &&
    anomalySignal.status === "below-normal" &&
    (consistencySignal.status === "stable" ||
      consistencySignal.status === "moderately-variable")
  ) {
    return {
      label: "Lower total, mixed efficiency signal",
      tone: "neutral",
      summary: `${period} is below recent normal on total emissions, but emissions per employee worsened. This suggests the lower total may reflect reduced scale more than a clean efficiency improvement.`,
      action:
        "Review staffing, output, or activity volume before carrying this month forward as a clear best-practice model.",
    };
  }

  if (
    anomalySignal.status === "below-normal" &&
    consistencySignal.status === "stable"
  ) {
    return {
      label: "Likely real improvement",
      tone: "positive",
      summary: `${period} looks better than recent normal, and recent months have been relatively stable. This makes the reduction more likely to reflect a real operating improvement than random variation.`,
      action:
        "Identify the changes behind this lower month and preserve them into the next cycle.",
    };
  }

  if (
    sourceWatchout.label === "Scale-driven increase" &&
    anomalySignal.status === "above-normal" &&
    (consistencySignal.status === "stable" ||
      consistencySignal.status === "moderately-variable")
  ) {
    return {
      label: "Scale-linked increase",
      tone: "neutral",
      summary: `${period} is above recent normal, but the increase appears more consistent with higher operating scale than a clear efficiency breakdown.`,
      action:
        "Review staffing, throughput, operating hours, or asset utilization before treating the increase as a pure deterioration signal.",
    };
  }

  if (
    anomalySignal.status === "above-normal" &&
    consistencySignal.status === "stable"
  ) {
    return {
      label: "Likely real deterioration",
      tone: "negative",
      summary: `${period} looks worse than recent normal, and recent months have been relatively stable. This makes the increase more likely to reflect a real operating shift than routine volatility.`,
      action:
        "Investigate the main driver promptly, because this result is more likely to be decision-useful than noise-driven.",
    };
  }

  if (
    anomalySignal.status !== "insufficient-history" &&
    consistencySignal.status === "volatile"
  ) {
    return {
      label: "Limited history",
      tone: "neutral",
      summary:
        "Recent months have been volatile, so this period should be interpreted with caution even if it looks unusually high or low versus recent normal.",
      action:
        "Use repeated movement across multiple cycles, together with source-level evidence, before treating this as a durable change.",
    };
  }

  if (
    consistencySignal.status === "volatile" &&
    sourceWatchout.tone !== "neutral"
  ) {
    return {
      label: "Variable pattern with source signal",
      tone: "neutral",
      summary:
        "Recent months are variable, but the main source watchout still provides a useful direction for operational review.",
      action:
        "Use the source watchout to guide investigation while avoiding overconfidence in any single month result.",
    };
  }

  if (consistencySignal.status === "stable") {
    return {
      label: "Stable operating pattern",
      tone: "positive",
      summary:
        "Recent months are relatively stable, which gives management a cleaner baseline for judging whether performance is truly shifting.",
      action:
        "Use baseline and anomaly signals more confidently when prioritizing the next operational action.",
    };
  }

  if (consistencySignal.status === "moderately-variable") {
    return {
      label: "Moderate variability",
      tone: "neutral",
      summary:
        "Recent months show some variability, so management should combine trend, anomaly, and source signals before treating one period as decisive.",
      action:
        "Use the current month as a signal worth reviewing, but validate it against the next cycle where possible.",
    };
  }

  return {
    label: "Building baseline",
    tone: "neutral",
    summary:
      "Recent reporting history is still forming, so management should focus on building a stronger cadence before relying on deeper interpretation.",
    action:
      "Keep reporting periods and inputs consistent so decision signals strengthen over time.",
  };
}

export function getExecutiveSummary(
  report: ReportRow | null,
  trend: TrendDirection,
  baselineComparison: BaselineComparison,
  dominantSource: DominantSource,
  intensityBand: IntensityBand | null,
  anomalySignal?: AnomalySignal,
  sourceWatchout?: SourceWatchout,
  consistencySignal?: ConsistencySignal,
  managementSignal?: ManagementSignal
) {
  const period = formatPeriodLabel(report);
  const baselineReference = getBaselineReferenceText(
    baselineComparison.periodsUsed
  );

  if ((report?.total_emissions ?? 0) <= 0) {
    return `${period}: There is not yet enough emissions volume to generate a strong operational signal. Capture complete activity data and reassess next month.`;
  }

  if (
    anomalySignal?.periodsUsed != null &&
    anomalySignal.periodsUsed <= 1
  ) {
    return `${period}: Reporting history is still very limited, so this result should be interpreted cautiously. Use it as an early directional signal and focus on building a more reliable monthly baseline before drawing stronger operational conclusions.`;
  }

  if (baselineComparison.label === "No baseline yet") {
    return `${period}: Reporting history is still limited, so this month should be treated as a baseline-building period. Directionally stronger or weaker results should be interpreted cautiously until a more reliable monthly pattern is established.`;
  }

  if (managementSignal?.label === "Lower total, mixed efficiency signal") {
    return `${period}: Total emissions came in below recent normal, but efficiency weakened on a per-employee basis. Priority now is to check whether the lower total reflects reduced scale rather than a clean operational improvement.`;
  }

  if (managementSignal?.label === "Likely real improvement") {
    return `${period}: This month outperformed recent normal under relatively stable conditions. Priority now is to preserve the operating changes behind the reduction and repeat them next cycle.`;
  }

  if (managementSignal?.label === "Likely real deterioration") {
    return `${period}: This month deteriorated against recent normal under relatively stable conditions. Priority now is to investigate the main driver promptly before the next cycle closes.`;
  }

  if (
    consistencySignal?.status === "volatile" &&
    anomalySignal?.status !== "insufficient-history"
  ) {
    return `${period}: This month differs from recent normal, but recent months have also been volatile. Treat the signal cautiously and confirm the main driver before locking in a strong conclusion.`;
  }

  if (
    anomalySignal?.status === "above-normal" &&
    sourceWatchout?.label === "Electricity-driven increase"
  ) {
    return `${period}: This month looks unusually high versus your ${baselineReference}, and the main watchout points to electricity-side change. Review Scope 2 drivers before the next cycle closes.`;
  }

  if (
    anomalySignal?.status === "above-normal" &&
    sourceWatchout?.label === "Fuel-driven increase"
  ) {
    return `${period}: This month looks unusually high versus your ${baselineReference}, and the main watchout points to fuel-side change. Review Scope 1 drivers before the next cycle closes.`;
  }

  if (
    anomalySignal?.status === "above-normal" &&
    sourceWatchout?.label === "Both sources moved up"
  ) {
    return `${period}: This month looks unusually high versus your ${baselineReference}, and both Scope 1 and Scope 2 moved up together. Review both operating scale and cross-source efficiency controls.`;
  }

  if (
    anomalySignal?.status === "below-normal" &&
    trend.label === "Improving"
  ) {
    return `${period}: Emissions are trending in the right direction and this month looks better than recent normal. The priority now is to preserve the operating conditions behind the reduction.`;
  }

  if (
    anomalySignal?.status === "near-normal" &&
    intensityBand?.label === "High"
  ) {
    return `${period}: This month looks broadly normal versus recent history, but emissions per employee remain high. The next priority is improving efficiency, not just maintaining a normal month.`;
  }

  if (
    baselineComparison.label === "Above baseline" &&
    trend.label === "Worsening" &&
    dominantSource.label === "Scope 2 dominant"
  ) {
    return `${period}: Emissions are above your ${baselineReference} and still rising, with Scope 2 as the main driver. Electricity reduction should be the first operational priority right now.`;
  }

  if (
    baselineComparison.label === "Above baseline" &&
    trend.label === "Worsening" &&
    dominantSource.label === "Scope 1 dominant"
  ) {
    return `${period}: Emissions are above your ${baselineReference} and still rising, with Scope 1 as the main driver. Fuel use and equipment efficiency should be the first operational priority right now.`;
  }

  if (
    baselineComparison.label === "Above baseline" &&
    dominantSource.label === "Scope 2 dominant"
  ) {
    return `${period}: Total emissions remain above your ${baselineReference} and Scope 2 is still the main driver, so electricity reduction should lead this month’s action plan.`;
  }

  if (
    baselineComparison.label === "Above baseline" &&
    dominantSource.label === "Scope 1 dominant"
  ) {
    return `${period}: Total emissions remain above your ${baselineReference} and Scope 1 is still the main driver, so fuel and equipment efficiency should lead this month’s action plan.`;
  }

  if (
    baselineComparison.label === "Below baseline" &&
    trend.label === "Improving"
  ) {
    return `${period}: Emissions are moving in the right direction and are now below your recent baseline. The priority is to preserve and repeat the changes that produced this reduction.`;
  }

  if (
    baselineComparison.label === "Near baseline" &&
    intensityBand?.label === "High"
  ) {
    return `${period}: Total emissions are close to your recent baseline, but emissions per employee remain high. The next priority is efficiency improvement, not just maintaining the current month.`;
  }

  if (trend.label === "Stable" && intensityBand?.label === "High") {
    return `${period}: Month-to-month emissions are stable, but emissions per employee remain high. The next priority is improving efficiency, not simply maintaining the status quo.`;
  }

  if (dominantSource.label === "Balanced") {
    if (baselineComparison.label === "Above baseline") {
      return `${period}: Emissions are above your ${baselineReference}, but neither Scope 1 nor Scope 2 clearly dominates. The next reduction step should combine fuel and electricity controls instead of focusing on a single source.`;
    }

    return `${period}: Emissions are split fairly evenly across Scope 1 and Scope 2, so the next reduction step should combine fuel and electricity controls rather than focusing on only one source.`;
  }

  return `${period}: ${trend.summary} ${dominantSource.summary}`;
}

function getBenchmarkSummary(
  perEmployee: number | null,
  intensityBand: IntensityBand | null,
  baselineComparison: BaselineComparison,
  anomalySignal?: AnomalySignal,
  consistencySignal?: ConsistencySignal
) {
  if (perEmployee == null || !intensityBand) {
    return "Emissions per employee is unavailable. Add a valid employee count to benchmark this report.";
  }

  const baselineReference = getBaselineReferenceText(
    baselineComparison.periodsUsed
  );
  const perEmployeeLabel = `${formatNumber(
    perEmployee,
    1
  )} kg CO2e per employee`;

  if (baselineComparison.label === "No baseline yet") {
    return `${intensityBand.label} intensity: ${perEmployeeLabel}. This is still a baseline-building period, so use this month as an early benchmark and add more consistent months before drawing stronger conclusions.`;
  }

  if (
    anomalySignal?.status === "below-normal" &&
    intensityBand.label === "Low" &&
    consistencySignal?.status === "stable"
  ) {
    return `${intensityBand.label} intensity: ${perEmployeeLabel}. This month looks better than recent normal and recent months have been relatively stable, so current operating controls likely outperformed the recent pattern.`;
  }

  if (
    anomalySignal?.status === "above-normal" &&
    intensityBand.label === "High"
  ) {
    return `${intensityBand.label} intensity: ${perEmployeeLabel}. This month also looks above recent normal, so efficiency improvement should be treated as an immediate operational priority.`;
  }

  if (
    anomalySignal?.status === "below-normal" &&
    intensityBand.label === "Low"
  ) {
    return `${intensityBand.label} intensity: ${perEmployeeLabel}. This month looks better than recent normal, which suggests current operating controls outperformed the recent pattern.`;
  }

  if (
    baselineComparison.label === "Above baseline" &&
    intensityBand.label === "High"
  ) {
    return `${intensityBand.label} intensity: ${perEmployeeLabel}. This report is above your ${baselineReference}, so efficiency improvement should be treated as an immediate operational priority.`;
  }

  if (
    baselineComparison.label === "Above baseline" &&
    intensityBand.label === "Moderate"
  ) {
    return `${intensityBand.label} intensity: ${perEmployeeLabel}. This report is above your ${baselineReference}, so target practical efficiency gains in the highest-impact activities next month.`;
  }

  if (
    baselineComparison.label === "Below baseline" &&
    intensityBand.label === "Low"
  ) {
    return `${intensityBand.label} intensity: ${perEmployeeLabel}. This report is below your ${baselineReference}, which suggests current operating controls are performing better than your recent norm.`;
  }

  if (baselineComparison.label === "Near baseline") {
    return `${intensityBand.label} intensity: ${perEmployeeLabel}. This is broadly in line with your ${baselineReference}; the next goal is to move below baseline through targeted efficiency gains.`;
  }

  return `${intensityBand.label} intensity: ${perEmployeeLabel}. ${intensityBand.action}`;
}

export function getRecommendedActions(
  report: ReportRow | null,
  trend: TrendDirection,
  dominantSource: DominantSource,
  intensityBand: IntensityBand | null,
  perEmployee: number | null,
  baselineComparison?: BaselineComparison,
  anomalySignal?: AnomalySignal,
  sourceWatchout?: SourceWatchout,
  consistencySignal?: ConsistencySignal,
  recentPositionSignal?: RecentPositionSignal,
  deteriorationStreakSignal?: DeteriorationStreakSignal,
  persistentSourceSignal?: PersistentSourceSignal,
  changeDriverSignal?: ChangeDriverSignal,
  benchmarkDepthSignal?: BenchmarkDepthSignal,
  opportunitySignal?: OpportunitySignal
) {
  const actions: Array<{ text: string; score: number; role: "move" | "diagnostic" | "follow-through" | "support" }> = [];
  const hasEmployeeCount = (report?.employee_count ?? 0) > 0;
  const hasElectricity = (report?.electricity_kwh ?? 0) > 0;
  const hasFuel = (report?.fuel_liters ?? 0) > 0;
  const limitedCoverage = !hasElectricity || !hasFuel;
  const noBaselineYet = baselineComparison?.label === "No baseline yet";
  const baselineReference = baselineComparison
    ? getBaselineReferenceText(baselineComparison.periodsUsed)
    : "baseline";

  const pushAction = (
    text: string,
    score: number,
    role: "move" | "diagnostic" | "follow-through" | "support"
  ) => {
    if (actions.some((item) => item.text === text || item.role === role)) return;
    actions.push({ text, score, role });
  };

  if (limitedCoverage) {
    pushAction(
      "Capture both electricity and fuel inputs consistently each month so comparisons and source-level decisions remain reliable.",
      98,
      "support"
    );
  }

  if (noBaselineYet) {
    pushAction(
      "Keep reporting periods, electricity inputs, fuel inputs, and period labels consistent each month so a reliable operating baseline can form.",
      92,
      "support"
    );
  }

  if (
    (benchmarkDepthSignal?.status === "off-best" || benchmarkDepthSignal?.status === "far-off-best") &&
    opportunitySignal?.source === "scope1"
  ) {
    pushAction(
      "Start with the largest fuel-related driver and choose one practical reduction action for the next reporting period.",
      96,
      "move"
    );
  } else if (
    (benchmarkDepthSignal?.status === "off-best" || benchmarkDepthSignal?.status === "far-off-best") &&
    opportunitySignal?.source === "scope2"
  ) {
    pushAction(
      "Start with the largest electricity-related driver and choose one measurable efficiency action for the next reporting period.",
      96,
      "move"
    );
  } else if (
    (benchmarkDepthSignal?.status === "off-best" || benchmarkDepthSignal?.status === "far-off-best") &&
    opportunitySignal?.source === "intensity"
  ) {
    pushAction(
      "Set one emissions-per-employee reduction target for the next cycle and trace whether the gap is coming from scale shift or true efficiency loss.",
      95,
      "move"
    );
  } else if (
    (benchmarkDepthSignal?.status === "off-best" || benchmarkDepthSignal?.status === "far-off-best")
  ) {
    pushAction(
      "Use the gap to your best recent month as the main reduction target and act on the strongest repeatable lever first.",
      93,
      "move"
    );
  } else if (
    anomalySignal?.status === "below-normal" &&
    changeDriverSignal?.status === "efficiency-improvement" &&
    sourceWatchout?.label === "Fuel-led improvement" &&
    persistentSourceSignal?.status === "scope1-persistent" &&
    dominantSource.label === "Scope 1 dominant"
  ) {
    pushAction(
      "Keep Scope 1 as the main management focus and preserve the fuel-side practices behind this stronger month.",
      90,
      "move"
    );
  } else if (
    persistentSourceSignal?.status === "scope1-persistent" &&
    dominantSource.label === "Scope 1 dominant"
  ) {
    pushAction(
      "Treat Scope 1 as a sustained management priority and plan repeated fuel-efficiency actions across upcoming cycles.",
      90,
      "move"
    );
  } else if (
    persistentSourceSignal?.status === "scope2-persistent" &&
    dominantSource.label === "Scope 2 dominant"
  ) {
    pushAction(
      "Treat Scope 2 as a sustained management priority and plan repeated electricity-efficiency actions across upcoming cycles.",
      90,
      "move"
    );
  } else if (
    persistentSourceSignal?.status === "balanced-persistent" &&
    dominantSource.label === "Balanced"
  ) {
    pushAction(
      "Use a combined electricity-and-fuel action plan rather than waiting for one source to dominate.",
      82,
      "move"
    );
  } else if (opportunitySignal?.source === "scope1") {
    pushAction(
      "Start with the largest fuel-related driver and choose one practical reduction action for the next reporting period.",
      86,
      "move"
    );
  } else if (opportunitySignal?.source === "scope2") {
    pushAction(
      "Start with the largest electricity-related driver and choose one measurable efficiency action for the next reporting period.",
      86,
      "move"
    );
  } else if (opportunitySignal?.source === "intensity") {
    pushAction(
      "Set one emissions-per-employee reduction target for the next cycle so efficiency improvement is measured directly.",
      84,
      "move"
    );
  }

  if (
    anomalySignal?.status === "above-normal" &&
    consistencySignal?.status === "stable" &&
    sourceWatchout?.label === "Electricity-driven increase"
  ) {
    pushAction(
      `Check which electricity-side change pushed this month above your ${baselineReference}, especially high-load equipment, operating hours, HVAC, lighting, and idle demand.`,
      95,
      "diagnostic"
    );
  } else if (
    anomalySignal?.status === "above-normal" &&
    consistencySignal?.status === "stable" &&
    sourceWatchout?.label === "Fuel-driven increase"
  ) {
    pushAction(
      `Check which fuel-side change pushed this month above your ${baselineReference}, especially runtime, idling, routing, loading, and maintenance.`,
      95,
      "diagnostic"
    );
  } else if (
    anomalySignal?.status === "above-normal" &&
    consistencySignal?.status === "stable" &&
    sourceWatchout?.label === "Both sources moved up"
  ) {
    pushAction(
      `Check whether the increase came from broader operating scale, weaker controls, or both, because this month is running above your ${baselineReference}.`,
      93,
      "diagnostic"
    );
  } else if (
    anomalySignal?.status === "below-normal" &&
    sourceWatchout?.label === "Lower total, weaker intensity"
  ) {
    pushAction(
      "Check whether the lower total came from reduced operating scale rather than cleaner underlying efficiency before treating this as a model month.",
      89,
      "diagnostic"
    );
  } else if (
    anomalySignal?.status === "below-normal" &&
    consistencySignal?.status === "stable"
  ) {
    pushAction(
      "Confirm what changed in this stronger month so the reduction can be repeated with confidence.",
      84,
      "diagnostic"
    );
  } else if (
    consistencySignal?.status === "volatile"
  ) {
    pushAction(
      "Use the next reporting cycle to confirm whether this movement repeats, because recent operating variability is still high.",
      78,
      "diagnostic"
    );
  }

  if (deteriorationStreakSignal?.status === "repeated-worsening") {
    pushAction(
      "Treat this as a repeated worsening pattern and intervene now before it becomes the new operating norm.",
      94,
      "follow-through"
    );
  } else if (deteriorationStreakSignal?.status === "repeated-improving") {
    pushAction(
      "Standardize the operating changes behind the repeated improvement run so the gains remain durable.",
      84,
      "follow-through"
    );
  } else if (
    trend.label === "Improving" &&
    baselineComparison?.label === "Below baseline"
  ) {
    pushAction(
      "Preserve the operating changes behind this better-than-baseline month so the reduction becomes repeatable.",
      80,
      "follow-through"
    );
  } else if (
    trend.label === "Worsening" &&
    baselineComparison?.label === "Above baseline"
  ) {
    pushAction(
      `Compare this month with both last month and your ${baselineReference}, then correct the single activity that added the most emissions.`,
      85,
      "follow-through"
    );
  } else if (
    recentPositionSignal?.status === "best-recent" ||
    recentPositionSignal?.status === "near-best"
  ) {
    pushAction(
      "Use this month as a best-practice reference and preserve the operating choices that kept performance near the stronger end of your recent range.",
      76,
      "follow-through"
    );
  }

  if (intensityBand?.label === "High" && perEmployee != null) {
    pushAction(
      "Set one emissions-per-employee reduction target for the next cycle so efficiency improvement is measured directly, not only through total emissions.",
      83,
      "support"
    );
  } else if (intensityBand?.label === "Moderate" && perEmployee != null) {
    pushAction(
      "Use the moderate emissions-per-employee result as a prompt to make one quick efficiency improvement in the dominant source before the next cycle.",
      66,
      "support"
    );
  }

  if (!hasEmployeeCount) {
    pushAction(
      "Add a valid employee count so benchmarking and emissions-per-employee tracking remain decision-useful.",
      79,
      "support"
    );
  }

  if (
    !limitedCoverage &&
    !noBaselineYet &&
    actions.length < 3
  ) {
    pushAction(
      "Keep electricity, fuel, and employee inputs complete each month so your benchmarking and decision signals remain trustworthy.",
      60,
      "support"
    );
  }

  if (actions.length === 0) {
    pushAction(
      "Maintain consistent reporting and use the next cycle to confirm whether the current operating position strengthens or drifts.",
      50,
      "move"
    );
  }

  return actions
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.text);
}

export function getElectricityMethodLabel(method: string | null | undefined) {
  if (!method) return "Not recorded";
  if (method === "location-based") return "Location-based";
  if (method === "market-based") return "Market-based / supplier-specific";
  return method;
}

function getComparableReportsWithCurrent(
  report: ReportRow | null,
  comparisonHistory: ReportRow[]
) {
  const history = getComparableHistory(report, comparisonHistory);
  if (!report || report.total_emissions == null || Number.isNaN(report.total_emissions)) {
    return history;
  }
  return sortReportsChronologically([...history, report]);
}

function getSourceState(report: ReportRow | null) {
  const scope1 = getSafeNumber(report?.scope1_emissions) ?? 0;
  const scope2 = getSafeNumber(report?.scope2_emissions) ?? 0;
  const total = getSafeNumber(report?.total_emissions) ?? 0;

  if (total <= 0) return "mixed" as const;

  const difference = Math.abs(scope1 - scope2);
  const balancedThreshold = total * 0.05;

  if (difference <= balancedThreshold) return "balanced" as const;
  if (scope1 > scope2) return "scope1" as const;
  return "scope2" as const;
}

export function getBenchmarkPositionSignal(
  report: ReportRow | null,
  comparisonHistory: ReportRow[]
): BenchmarkPositionSignal {
  const rankedComparable = getComparableReportsWithCurrent(report, comparisonHistory)
    .filter((item) => item.total_emissions != null && !Number.isNaN(item.total_emissions));

  const recentComparable = rankedComparable.slice(-6);
  const averageValue = getAverage(
    recentComparable
      .map((item) => getSafeNumber(item.total_emissions))
      .filter((value): value is number => value != null)
  );

  if (!report || rankedComparable.length === 0) {
    return {
      label: "No benchmark yet",
      tone: "neutral",
      status: "no-benchmark",
      summary:
        "Add more reporting months to benchmark the latest month against your recent history.",
      action:
        "Keep monthly reporting consistent so benchmark position becomes more decision-useful.",
      rank: null,
      totalCount: 0,
      deltaToBest: null,
      deltaToAverage: null,
    };
  }

  const ranked = [...rankedComparable].sort(
    (a, b) => (a.total_emissions ?? 0) - (b.total_emissions ?? 0)
  );

  const rank = ranked.findIndex((item) => item.id === report.id) + 1;
  const totalCount = ranked.length;
  const best = ranked[0] ?? null;
  const bestValue = best?.total_emissions ?? null;
  const currentValue = report.total_emissions ?? null;

  const deltaToBest =
    currentValue != null && bestValue != null ? currentValue - bestValue : null;

  const deltaToAverage =
    currentValue != null && averageValue != null
      ? currentValue - averageValue
      : null;

  if (totalCount === 1) {
    return {
      label: "Baseline month",
      tone: "neutral",
      status: "baseline-month",
      summary:
        "Only one reporting month is available, so the latest month is acting as your starting benchmark.",
      action:
        "Add another month to unlock a stronger benchmark position.",
      rank,
      totalCount,
      deltaToBest,
      deltaToAverage,
    };
  }

  if (rank === 1) {
    return {
      label: "Strongest month so far",
      tone: "positive",
      status: "strongest-month",
      summary:
        "The latest month is currently your lowest-emissions month on record.",
      action:
        "Use this month as your internal benchmark and preserve the operating conditions behind it.",
      rank,
      totalCount,
      deltaToBest,
      deltaToAverage,
    };
  }

  if (rank === totalCount) {
    return {
      label: "Weakest month so far",
      tone: "negative",
      status: "weakest-month",
      summary:
        "The latest month is currently your highest-emissions month on record.",
      action:
        "Use the watchout and comparison signals to identify what needs correcting first.",
      rank,
      totalCount,
      deltaToBest,
      deltaToAverage,
    };
  }

  const threshold =
    averageValue != null ? Math.max(averageValue * 0.05, 10) : 10;

  if (deltaToAverage != null && deltaToAverage <= -threshold) {
    return {
      label: "Stronger than average",
      tone: "positive",
      status: "stronger-than-average",
      summary:
        "The latest month is performing better than your average reporting month so far.",
      action:
        "Use this month as a practical internal benchmark and preserve the conditions behind it.",
      rank,
      totalCount,
      deltaToBest,
      deltaToAverage,
    };
  }

  if (deltaToAverage != null && deltaToAverage >= threshold) {
    return {
      label: "Weaker than average",
      tone: "negative",
      status: "weaker-than-average",
      summary:
        "The latest month is performing worse than your average reporting month so far.",
      action:
        "Use comparison and watchout signals to decide which driver needs attention first.",
      rank,
      totalCount,
      deltaToBest,
      deltaToAverage,
    };
  }

  return {
    label: "Mid-range month",
    tone: "neutral",
    status: "mid-range",
    summary:
      "The latest month is sitting close to the middle of your reporting history rather than clearly outperforming or underperforming it.",
    action:
      "Use this month as a neutral operating reference and focus on one targeted efficiency gain next.",
    rank,
    totalCount,
    deltaToBest,
    deltaToAverage,
  };
}

export function getBenchmarkDepthSignal(
  report: ReportRow | null,
  comparisonHistory: ReportRow[]
): BenchmarkDepthSignal {
  const reports = getComparableReportsWithCurrent(report, comparisonHistory)
    .filter((item) => item.total_emissions != null && !Number.isNaN(item.total_emissions))
    .slice(-6);

  const periodsUsed = reports.length;

  if (!report || report.total_emissions == null || periodsUsed < 3) {
    return {
      label: "Early benchmark view",
      tone: "neutral",
      status: "insufficient-history",
      summary:
        "There is not enough comparable history yet to judge how far this month sits from your best recent operating result.",
      action:
        "Add more completed months before using best-month distance as a management benchmark.",
      title: "Best recent month view",
      periodsUsed,
      bestPeriodLabel: null,
      bestValue: null,
      currentValue: getSafeNumber(report?.total_emissions),
      gapToBest: null,
      gapToBestPercent: null,
    };
  }

  const ranked = [...reports].sort(
    (a, b) => (a.total_emissions ?? Number.POSITIVE_INFINITY) - (b.total_emissions ?? Number.POSITIVE_INFINITY)
  );

  const best = ranked[0] ?? null;
  const bestValue = getSafeNumber(best?.total_emissions);
  const currentValue = getSafeNumber(report.total_emissions);
  const gapToBest =
    currentValue != null && bestValue != null ? currentValue - bestValue : null;
  const gapToBestPercent =
    gapToBest != null && bestValue != null && bestValue !== 0
      ? (gapToBest / bestValue) * 100
      : null;
  const bestPeriodLabel = best ? formatPeriodLabel(best) : null;

  if (best?.id === report.id) {
    return {
      label: "Best recent month",
      tone: "positive",
      status: "best-month",
      summary:
        "This month is your strongest recent operating result and currently sets the benchmark for the recent comparison window.",
      action:
        "Use this month as your internal best-practice reference and preserve the operating conditions behind it.",
      title: "Best recent month",
      periodsUsed,
      bestPeriodLabel,
      bestValue,
      currentValue,
      gapToBest,
      gapToBestPercent,
    };
  }

  const closeThreshold =
    bestValue != null ? Math.max(bestValue * 0.08, 20) : 20;
  const offBestThreshold =
    bestValue != null ? Math.max(bestValue * 0.2, 50) : 50;

  if (gapToBest != null && gapToBest <= closeThreshold) {
    return {
      label: "Close to best recent month",
      tone: "positive",
      status: "close-to-best",
      summary: `This month is operating close to your best recent month (${bestPeriodLabel}), which suggests performance is near the stronger end of your recent range.`,
      action:
        "Use the best recent month as your operating reference and target one focused improvement to fully match or beat it.",
      title: "Close to best recent month",
      periodsUsed,
      bestPeriodLabel,
      bestValue,
      currentValue,
      gapToBest,
      gapToBestPercent,
    };
  }

  const farOffBestThreshold =
    bestValue != null ? Math.max(bestValue * 0.35, 100) : 100;

  if (gapToBest != null && gapToBest >= farOffBestThreshold) {
    return {
      label: "Far off best recent month",
      tone: "negative",
      status: "far-off-best",
      summary: `This month is well above your best recent month (${bestPeriodLabel}), indicating a large recoverable gap within your own recent operating range.`,
      action:
        "Use your best recent month as the management reference point, isolate the largest operating differences, and assign a focused recovery action for the next cycle.",
      title: "Gap to best recent month",
      periodsUsed,
      bestPeriodLabel,
      bestValue,
      currentValue,
      gapToBest,
      gapToBestPercent,
    };
  }

  if (gapToBest != null && gapToBest >= offBestThreshold) {
    return {
      label: "Materially off best recent month",
      tone: "negative",
      status: "off-best",
      summary: `This month is sitting materially above your best recent month (${bestPeriodLabel}), leaving a meaningful reduction gap within your own recent operating range.`,
      action:
        "Use the gap to your best recent month as a practical reduction target and focus first on the strongest operational lever.",
      title: "Gap to best recent month",
      periodsUsed,
      bestPeriodLabel,
      bestValue,
      currentValue,
      gapToBest,
      gapToBestPercent,
    };
  }

  return {
    label: "Mid-range versus best recent month",
    tone: "neutral",
    status: "mid-range",
    summary: `This month sits between your best recent result (${bestPeriodLabel}) and weaker recent months, so it is neither a best-practice month nor a worst-case month.`,
    action:
      "Use source and trend signals to decide what would move this month closer to your best recent result.",
    title: "Position versus best recent month",
    periodsUsed,
    bestPeriodLabel,
    bestValue,
    currentValue,
    gapToBest,
    gapToBestPercent,
  };
}

export function getOpportunitySignal(
  report: ReportRow | null,
  dominantSource: DominantSource,
  intensityBand: IntensityBand | null,
  consistencySignal: ConsistencySignal,
  sourceWatchout: SourceWatchout,
  benchmarkDepthSignal: BenchmarkDepthSignal
): OpportunitySignal {
  if (!report || (report.total_emissions ?? 0) <= 0) {
    return {
      label: "Build fuller data first",
      tone: "neutral",
      source: "general",
      summary:
        "The report does not yet contain enough usable emissions volume to isolate a strong improvement opportunity.",
      action:
        "Focus on complete and consistent monthly reporting before using deeper decision support.",
    };
  }

  if (
    benchmarkDepthSignal.status === "far-off-best" &&
    dominantSource.label === "Scope 1 dominant"
  ) {
    return {
      label: "Fuel-side recovery gap is the biggest opportunity",
      tone: "negative",
      source: "scope1",
      summary:
        "This month sits well above your best recent month and direct fuel use remains the strongest source signal, so the largest recovery opportunity is on the fuel side.",
      action:
        "Compare this month against your best recent month and prioritize equipment runtime, idling, routing, loading, and combustion efficiency first.",
    };
  }

  if (
    benchmarkDepthSignal.status === "off-best" &&
    dominantSource.label === "Scope 1 dominant"
  ) {
    return {
      label: "Fuel-side gap is the biggest opportunity",
      tone: "negative",
      source: "scope1",
      summary:
        "This month is materially off your best recent month and direct fuel use remains the strongest source signal, so the largest practical improvement opportunity is on the fuel side.",
      action:
        "Prioritize equipment runtime, idling, routing, loading, and combustion efficiency first.",
    };
  }

  if (
    benchmarkDepthSignal.status === "far-off-best" &&
    dominantSource.label === "Scope 2 dominant"
  ) {
    return {
      label: "Electricity-side recovery gap is the biggest opportunity",
      tone: "negative",
      source: "scope2",
      summary:
        "This month sits well above your best recent month and electricity remains the strongest source signal, so the largest recovery opportunity is on the electricity side.",
      action:
        "Compare this month against your best recent month and prioritize high-load equipment, operating hours, HVAC, lighting, and idle consumption first.",
    };
  }

  if (
    benchmarkDepthSignal.status === "off-best" &&
    dominantSource.label === "Scope 2 dominant"
  ) {
    return {
      label: "Electricity-side gap is the biggest opportunity",
      tone: "negative",
      source: "scope2",
      summary:
        "This month is materially off your best recent month and electricity remains the strongest source signal, so the largest practical improvement opportunity is on the electricity side.",
      action:
        "Prioritize high-load equipment, operating hours, HVAC, lighting, and idle consumption first.",
    };
  }

  if (intensityBand?.label === "High") {
    return {
      label: "Efficiency gap is the biggest opportunity",
      tone: "negative",
      source: "intensity",
      summary:
        "Emissions per employee remain high enough that operational efficiency, not just total emissions, should be treated as the main improvement opportunity.",
      action:
        "Set a per-employee reduction target and review whether energy, fuel, staffing, and operating scale are moving out of balance.",
    };
  }

  if (consistencySignal.status === "volatile") {
    return {
      label: "Stability is the biggest opportunity",
      tone: "neutral",
      source: "stability",
      summary:
        "Recent months are variable enough that improving operating consistency is itself a key management opportunity.",
      action:
        "Use the next reporting cycles to reduce volatility and confirm which operating controls are repeatable.",
    };
  }

  if (sourceWatchout.label.includes("Electricity")) {
    return {
      label: "Electricity improvement opportunity",
      tone: "neutral",
      source: "scope2",
      summary:
        "The current watchout still points most strongly to electricity-side improvement as the clearest next lever.",
      action:
        "Review equipment loading, operating hours, and avoidable electricity demand first.",
    };
  }

  if (sourceWatchout.label.includes("Fuel")) {
    return {
      label: "Fuel improvement opportunity",
      tone: "neutral",
      source: "scope1",
      summary:
        "Fuel-side improvement appears to be the clearest repeatable lever behind this stronger month.",
      action:
        "Preserve the fuel-side practices behind this result and turn them into a repeatable operating standard.",
    };
  }

  return {
    label: "Mixed improvement opportunity",
    tone: "neutral",
    source: "general",
    summary:
      "No single source dominates strongly enough to isolate only one lever, so the next gain likely comes from combined operational discipline.",
    action:
      "Review both fuel and electricity controls together and target the easiest repeatable reduction first.",
  };
}

export function getRecentPositionSignal(
  report: ReportRow | null,
  comparisonHistory: ReportRow[]
): RecentPositionSignal {
  const reports = getComparableReportsWithCurrent(report, comparisonHistory)
    .filter((item) => item.total_emissions != null && !Number.isNaN(item.total_emissions))
    .slice(-6);

  const periodsUsed = reports.length;

  if (!report || report.total_emissions == null || periodsUsed < 3) {
    return {
      label: "Early position view",
      tone: "neutral",
      status: "insufficient-history",
      summary:
        "There is not enough comparable history yet to judge whether this month sits near your best or worst recent performance.",
      action:
        "Add more completed months before using best-versus-worst positioning as a management signal.",
      periodsUsed,
      bestValue: null,
      worstValue: null,
      currentRank: null,
      gapToBest: null,
      gapToBestPercent: null,
    };
  }

  const totals = reports
    .map((item) => getSafeNumber(item.total_emissions))
    .filter((value): value is number => value != null);

  const currentValue = getSafeNumber(report.total_emissions);
  if (currentValue == null) {
    return {
      label: "Early position view",
      tone: "neutral",
      status: "insufficient-history",
      summary:
        "There is not enough comparable history yet to judge whether this month sits near your best or worst recent performance.",
      action:
        "Add more completed months before using best-versus-worst positioning as a management signal.",
      periodsUsed,
      bestValue: null,
      worstValue: null,
      currentRank: null,
      gapToBest: null,
      gapToBestPercent: null,
    };
  }

  const sortedAscending = [...totals].sort((a, b) => a - b);
  const bestValue = sortedAscending[0] ?? null;
  const worstValue = sortedAscending[sortedAscending.length - 1] ?? null;
  const currentRank = sortedAscending.findIndex((value) => value === currentValue) + 1;
  const gapToBest =
    bestValue != null ? currentValue - bestValue : null;
  const gapToBestPercent =
    bestValue != null && bestValue !== 0 && gapToBest != null
      ? (gapToBest / bestValue) * 100
      : null;

  const nearBestThreshold =
    bestValue != null ? Math.max(bestValue * 0.05, 10) : null;

  if (bestValue != null && currentValue === bestValue) {
    return {
      label: "Best recent month",
      tone: "positive",
      status: "best-recent",
      summary: `This is the lowest-emissions month in your recent ${periodsUsed}-period view, making it your current best operating result in that window.`,
      action:
        "Identify what was different in this month and preserve those operating conditions into the next cycle.",
      periodsUsed,
      bestValue,
      worstValue,
      currentRank,
      gapToBest,
      gapToBestPercent,
    };
  }

  if (worstValue != null && currentValue === worstValue) {
    return {
      label: "Worst recent month",
      tone: "negative",
      status: "worst-recent",
      summary: `This is the highest-emissions month in your recent ${periodsUsed}-period view, making it the weakest operating result in that window.`,
      action:
        "Treat this month as a priority review case and investigate the main driver before the next cycle closes.",
      periodsUsed,
      bestValue,
      worstValue,
      currentRank,
      gapToBest,
      gapToBestPercent,
    };
  }

  if (
    gapToBest != null &&
    nearBestThreshold != null &&
    gapToBest <= nearBestThreshold
  ) {
    return {
      label: "Close to best recent month",
      tone: "positive",
      status: "near-best",
      summary: `This month is close to your best recent result, which suggests performance is sitting near the stronger end of your recent operating range.`,
      action:
        "Use this month as a near-best reference and look for one focused improvement that can move performance fully into best-month territory.",
      periodsUsed,
      bestValue,
      worstValue,
      currentRank,
      gapToBest,
      gapToBestPercent,
    };
  }

  return {
    label: "Mid-range recent position",
    tone: "neutral",
    status: "mid-range",
    summary: `This month sits between your best and worst recent periods rather than clearly defining either edge of the recent range.`,
    action:
      "Use the stronger source, anomaly, and comparison signals to decide what to improve next rather than treating this month as a peak or low point.",
    periodsUsed,
    bestValue,
    worstValue,
    currentRank,
    gapToBest,
    gapToBestPercent,
  };
}

export function getDeteriorationStreakSignal(
  report: ReportRow | null,
  comparisonHistory: ReportRow[]
): DeteriorationStreakSignal {
  const reports = getComparableReportsWithCurrent(report, comparisonHistory)
    .filter((item) => item.total_emissions != null && !Number.isNaN(item.total_emissions))
    .slice(-6);

  const periodsUsed = reports.length;

  if (periodsUsed < 3) {
    return {
      label: "No streak yet",
      tone: "neutral",
      status: "insufficient-history",
      summary:
        "There is not enough recent history yet to tell whether emissions are worsening or improving repeatedly across consecutive periods.",
      action:
        "Add more completed months before using streaks as a management signal.",
      periodsUsed,
      worseningStreak: 0,
      improvingStreak: 0,
    };
  }

  let worseningStreak = 0
  let improvingStreak = 0

  for (let i = reports.length - 1; i > 0; i -= 1) {
    const current = getSafeNumber(reports[i]?.total_emissions);
    const previous = getSafeNumber(reports[i - 1]?.total_emissions);

    if (current == null || previous == null) continue;

    const threshold = Math.max(previous * 0.03, 5);

    if (current > previous + threshold) {
      worseningStreak += 1;
      if (improvingStreak === 0) {
        continue;
      }
      break;
    }

    if (current < previous - threshold) {
      improvingStreak += 1;
      if (worseningStreak === 0) {
        continue;
      }
      break;
    }

    break;
  }

  if (worseningStreak >= 2) {
    return {
      label: "Repeated worsening",
      tone: "negative",
      status: "repeated-worsening",
      summary:
        "Emissions have worsened across multiple consecutive comparable periods, which is more concerning than a one-off rise.",
      action:
        "Treat this as a pattern rather than a single-month issue and intervene on the main driver now.",
      periodsUsed,
      worseningStreak,
      improvingStreak,
    };
  }

  if (improvingStreak >= 2) {
    return {
      label: "Repeated improvement",
      tone: "positive",
      status: "repeated-improving",
      summary:
        "Emissions have improved across multiple consecutive comparable periods, which suggests recent controls may be working consistently.",
      action:
        "Confirm what changed during the improvement run and standardize those practices.",
      periodsUsed,
      worseningStreak,
      improvingStreak,
    };
  }

  return {
    label: "No clear streak",
    tone: "neutral",
    status: "mixed",
    summary:
      "Recent periods do not yet show a clear consecutive worsening or improving streak.",
    action:
      "Use this month together with baseline and source signals rather than relying on streak logic alone.",
    periodsUsed,
    worseningStreak,
    improvingStreak,
  };
}

export function getPersistentSourceSignal(
  report: ReportRow | null,
  comparisonHistory: ReportRow[]
): PersistentSourceSignal {
  const reports = getComparableReportsWithCurrent(report, comparisonHistory).slice(-4);
  const periodsUsed = reports.length;

  if (periodsUsed < 3) {
    return {
      label: "No persistent source yet",
      tone: "neutral",
      status: "insufficient-history",
      summary:
        "There is not enough recent source history yet to tell whether one emissions source is staying dominant over time.",
      action:
        "Add more complete monthly inputs before using persistent source dominance as a planning signal.",
      periodsUsed,
      scope1DominantPeriods: 0,
      scope2DominantPeriods: 0,
      balancedPeriods: 0,
    };
  }

  let scope1DominantPeriods = 0;
  let scope2DominantPeriods = 0;
  let balancedPeriods = 0;

  for (const item of reports) {
    const state = getSourceState(item);
    if (state === "scope1") scope1DominantPeriods += 1;
    if (state === "scope2") scope2DominantPeriods += 1;
    if (state === "balanced") balancedPeriods += 1;
  }

  if (scope1DominantPeriods >= 3) {
    return {
      label: "Scope 1 repeatedly dominant",
      tone: "negative",
      status: "scope1-persistent",
      summary:
        "Scope 1 has remained the dominant source across most recent comparable periods, which suggests fuel-side controls deserve sustained attention rather than one-off review.",
      action:
        "Plan repeated fuel and combustion efficiency actions instead of treating Scope 1 as a temporary spike.",
      periodsUsed,
      scope1DominantPeriods,
      scope2DominantPeriods,
      balancedPeriods,
    };
  }

  if (scope2DominantPeriods >= 3) {
    return {
      label: "Scope 2 repeatedly dominant",
      tone: "negative",
      status: "scope2-persistent",
      summary:
        "Scope 2 has remained the dominant source across most recent comparable periods, which suggests electricity-side controls deserve sustained attention rather than one-off review.",
      action:
        "Plan repeated electricity efficiency actions instead of treating Scope 2 as a temporary spike.",
      periodsUsed,
      scope1DominantPeriods,
      scope2DominantPeriods,
      balancedPeriods,
    };
  }

  if (balancedPeriods >= 3) {
    return {
      label: "Balanced source mix",
      tone: "neutral",
      status: "balanced-persistent",
      summary:
        "Recent periods have stayed fairly balanced between Scope 1 and Scope 2, so one source is not consistently dominating your footprint.",
      action:
        "Use combined electricity-and-fuel improvement planning rather than leaning too heavily on a single source.",
      periodsUsed,
      scope1DominantPeriods,
      scope2DominantPeriods,
      balancedPeriods,
    };
  }

  return {
    label: "Mixed source pattern",
    tone: "neutral",
    status: "mixed",
    summary:
      "The dominant source is still changing across recent periods, so source planning should stay flexible.",
    action:
      "Use the current month’s dominant source together with trend and anomaly signals to decide what to review next.",
    periodsUsed,
    scope1DominantPeriods,
    scope2DominantPeriods,
    balancedPeriods,
  };
}

export function getRecentTrajectorySignal(
  report: ReportRow | null,
  comparisonHistory: ReportRow[]
): RecentTrajectorySignal {
  const reports = getComparableReportsWithCurrent(report, comparisonHistory)
    .filter((item) => item.total_emissions != null && !Number.isNaN(item.total_emissions))
    .slice(-5);

  const periodsUsed = reports.length;

  if (periodsUsed < 3) {
    return {
      label: "Early trajectory view",
      tone: "neutral",
      status: "insufficient-history",
      summary:
        "There is not enough recent history yet to judge whether performance is improving over time or simply moving month to month.",
      action:
        "Add more completed months before using trajectory as a management signal.",
      periodsUsed,
      improvingMoves: 0,
      worseningMoves: 0,
      netChange: null,
      netChangePercent: null,
    };
  }

  let improvingMoves = 0;
  let worseningMoves = 0;

  for (let i = 1; i < reports.length; i += 1) {
    const previous = getSafeNumber(reports[i - 1]?.total_emissions);
    const current = getSafeNumber(reports[i]?.total_emissions);

    if (previous == null || current == null) continue;

    const threshold = Math.max(previous * 0.03, 5);
    if (current < previous - threshold) improvingMoves += 1;
    else if (current > previous + threshold) worseningMoves += 1;
  }

  const firstValue = getSafeNumber(reports[0]?.total_emissions);
  const lastValue = getSafeNumber(reports[reports.length - 1]?.total_emissions);
  const netChange =
    firstValue != null && lastValue != null ? lastValue - firstValue : null;
  const netChangePercent =
    netChange != null && firstValue != null && firstValue !== 0
      ? (netChange / firstValue) * 100
      : null;

  const currentIsBest = report?.id != null && reports.length > 0
    ? reports.reduce((best, item) => {
        const bestValue = getSafeNumber(best?.total_emissions);
        const itemValue = getSafeNumber(item?.total_emissions);
        if (bestValue == null) return item;
        if (itemValue == null) return best;
        return itemValue < bestValue ? item : best;
      }, reports[0])?.id === report.id
    : false;

  const latestMoveImproving =
    reports.length >= 2 &&
    getSafeNumber(reports[reports.length - 2]?.total_emissions) != null &&
    getSafeNumber(reports[reports.length - 1]?.total_emissions) != null &&
    (getSafeNumber(reports[reports.length - 1]?.total_emissions) ?? 0) <
      (getSafeNumber(reports[reports.length - 2]?.total_emissions) ?? 0) -
        Math.max((getSafeNumber(reports[reports.length - 2]?.total_emissions) ?? 0) * 0.03, 5);

  if (
    improvingMoves >= Math.max(2, worseningMoves + 1) &&
    netChange != null &&
    netChange < 0
  ) {
    return {
      label: "Sustained improvement",
      tone: "positive",
      status: "sustained-improvement",
      summary:
        "Recent months show a broader improving direction rather than a one-off lower month, suggesting performance has been strengthening across the recent window.",
      action:
        "Preserve the operating changes behind the lower-emissions run and keep checking that the pattern continues next cycle.",
      periodsUsed,
      improvingMoves,
      worseningMoves,
      netChange,
      netChangePercent,
    };
  }

  if (
    worseningMoves >= Math.max(2, improvingMoves + 1) &&
    netChange != null &&
    netChange > 0
  ) {
    return {
      label: "Sustained deterioration",
      tone: "negative",
      status: "sustained-deterioration",
      summary:
        "Recent months show a broader worsening direction rather than a one-off higher month, suggesting performance has been drifting upward across the recent window.",
      action:
        "Treat this as a multi-month deterioration pattern and intervene on the strongest driver before it becomes harder to reverse.",
      periodsUsed,
      improvingMoves,
      worseningMoves,
      netChange,
      netChangePercent,
    };
  }

  if (
    currentIsBest &&
    latestMoveImproving &&
    improvingMoves >= 1 &&
    worseningMoves <= 1
  ) {
    return {
      label: "Holding gains",
      tone: "positive",
      status: "holding-gains",
      summary:
        "Recent performance is sitting near the stronger end of the recent range, and the latest periods suggest gains are being held rather than immediately given back.",
      action:
        "Use the current operating conditions as a reference point and focus on keeping the stronger pattern intact next cycle.",
      periodsUsed,
      improvingMoves,
      worseningMoves,
      netChange,
      netChangePercent,
    };
  }

  if (
    latestMoveImproving &&
    netChange != null &&
    netChange < 0 &&
    worseningMoves >= 1
  ) {
    return {
      label: "Recovery strengthening",
      tone: "neutral",
      status: "partial-rebound",
      summary:
        "Recent results suggest performance is recovering, but the broader pattern has not yet become clean enough to call it a sustained improvement run.",
      action:
        "Keep the stronger recent controls in place and use the next cycle to confirm whether the rebound is becoming durable.",
      periodsUsed,
      improvingMoves,
      worseningMoves,
      netChange,
      netChangePercent,
    };
  }

  return {
    label: "Mixed trajectory",
    tone: "neutral",
    status: "mixed-trajectory",
    summary:
      "Recent months do not yet show a clear broader direction, so performance still looks mixed rather than steadily improving or deteriorating.",
    action:
      "Use the next cycle to confirm whether a clearer direction is emerging before treating trajectory as a firm management signal.",
    periodsUsed,
    improvingMoves,
    worseningMoves,
    netChange,
    netChangePercent,
  };
}

export function getChangeDriverSignal(
  report: ReportRow | null,
  previousComparableReport: ReportRow | null
): ChangeDriverSignal {
  const currentTotal = getSafeNumber(report?.total_emissions);
  const previousTotal = getSafeNumber(previousComparableReport?.total_emissions);

  const currentPerEmployee = getPerEmployee(
    report?.total_emissions,
    report?.employee_count
  );
  const previousPerEmployee = getPerEmployee(
    previousComparableReport?.total_emissions,
    previousComparableReport?.employee_count
  );

  const currentScope1 = getSafeNumber(report?.scope1_emissions) ?? 0;
  const currentScope2 = getSafeNumber(report?.scope2_emissions) ?? 0;
  const previousScope1 =
    getSafeNumber(previousComparableReport?.scope1_emissions) ?? 0;
  const previousScope2 =
    getSafeNumber(previousComparableReport?.scope2_emissions) ?? 0;

  if (currentTotal == null || previousTotal == null) {
    return {
      label: "Limited change-driver view",
      tone: "neutral",
      status: "insufficient-history",
      summary:
        "There is not enough comparable history yet to judge what is mainly driving the latest change.",
      action:
        "Add another completed comparable month before treating change-driver interpretation as decision-useful.",
    };
  }

  const totalDelta = currentTotal - previousTotal;
  const totalThreshold = Math.max(previousTotal * 0.03, 5);

  if (Math.abs(totalDelta) <= totalThreshold) {
    return {
      label: "Mixed change pattern",
      tone: "neutral",
      status: "mixed-change",
      summary:
        "The latest month is broadly in line with the previous comparable month, so no single change driver stands out strongly.",
      action:
        "Use source-level and intensity signals to look for smaller improvement opportunities rather than treating this as a major shift.",
    };
  }

  if (
    currentPerEmployee != null &&
    previousPerEmployee != null &&
    totalDelta > totalThreshold &&
    currentPerEmployee < previousPerEmployee * 0.97
  ) {
    return {
      label: "Scale-driven increase",
      tone: "neutral",
      status: "scale-driven-increase",
      summary:
        "Total emissions increased, but emissions per employee improved. This suggests the latest rise was driven more by higher operating scale than a pure efficiency breakdown.",
      action:
        "Check staffing, throughput, operating hours, or asset utilization before treating the increase as a control failure.",
    };
  }

  if (
    currentPerEmployee != null &&
    previousPerEmployee != null &&
    totalDelta < -totalThreshold &&
    currentPerEmployee > previousPerEmployee * 1.03
  ) {
    return {
      label: "Scale-driven reduction",
      tone: "neutral",
      status: "scale-driven-reduction",
      summary:
        "Total emissions fell, but emissions per employee worsened. This suggests the lower total may be driven more by reduced operating scale than a clean efficiency gain.",
      action:
        "Check whether output, staffing, or operating activity fell before treating this month as a best-practice model.",
    };
  }

  if (
    currentPerEmployee != null &&
    previousPerEmployee != null &&
    totalDelta > totalThreshold &&
    currentPerEmployee > previousPerEmployee * 1.03
  ) {
    return {
      label: "Efficiency deterioration",
      tone: "negative",
      status: "efficiency-deterioration",
      summary:
        "Total emissions increased and emissions per employee also worsened, which points more toward a true efficiency deterioration than a simple scale change.",
      action:
        "Identify which operating activity became less efficient and correct that driver first.",
    };
  }

  if (
    currentPerEmployee != null &&
    previousPerEmployee != null &&
    totalDelta < -totalThreshold &&
    currentPerEmployee < previousPerEmployee * 0.97
  ) {
    return {
      label: "Efficiency improvement",
      tone: "positive",
      status: "efficiency-improvement",
      summary:
        "Total emissions fell and emissions per employee also improved, which points more toward a real efficiency improvement than a simple scale reduction.",
      action:
        "Identify what changed in the stronger month and standardize those operating conditions into the next cycle.",
    };
  }

  const scope1Delta = currentScope1 - previousScope1;
  const scope2Delta = currentScope2 - previousScope2;
  const sourceDriverThreshold = Math.max(Math.abs(totalDelta) * 0.25, 10);

  if (
    totalDelta > totalThreshold &&
    scope1Delta > 0 &&
    scope1Delta - scope2Delta > sourceDriverThreshold
  ) {
    return {
      label: "Scope 1 shift",
      tone: "negative",
      status: "scope1-shift",
      summary:
        "The latest deterioration appears to be driven mainly by the fuel-related side of the footprint rather than an even rise across both sources.",
      action:
        "Review runtime, idling, routing, loading, maintenance, and direct fuel-consuming activity first.",
    };
  }

  if (
    totalDelta > totalThreshold &&
    scope2Delta > 0 &&
    scope2Delta - scope1Delta > sourceDriverThreshold
  ) {
    return {
      label: "Scope 2 shift",
      tone: "negative",
      status: "scope2-shift",
      summary:
        "The latest deterioration appears to be driven mainly by the electricity-related side of the footprint rather than an even rise across both sources.",
      action:
        "Review high-load equipment, operating hours, HVAC, lighting, and electricity demand first.",
    };
  }

  if (
    Math.abs(scope1Delta) > 5 &&
    Math.abs(scope2Delta) > 5 &&
    ((scope1Delta > 0 && scope2Delta > 0) ||
      (scope1Delta < 0 && scope2Delta < 0))
  ) {
    const label =
      totalDelta > 0 ? "Broad-based increase" : "Broad-based reduction";
    const tone: SignalTone = totalDelta > 0 ? "negative" : "positive";

    return {
      label,
      tone,
      status: "broad-based-change",
      summary:
        "Both Scope 1 and Scope 2 moved in the same direction, which suggests the latest change is broad-based rather than isolated to one source.",
      action:
        "Review cross-cutting operating changes affecting both fuel and electricity rather than focusing on only one source.",
    };
  }

  return {
    label: "Mixed change pattern",
    tone: "neutral",
    status: "mixed-change",
    summary:
      "The latest change does not point clearly to a single scale, efficiency, or source-shift explanation.",
    action:
      "Use trend, source watchout, and benchmarking signals together before treating one driver as the clear cause.",
  };
}

export type ManagementPriority = {
  title: string;
  summary: string;
  tone: SignalTone;
  source: "scope1" | "scope2" | "intensity" | "trend" | "data" | "general";
};

export type ManagementActionSet = {
  priorityActions: ManagementPriority[];
  biggestOpportunity: string;
  improvedAreas: string[];
  watchAreas: string[];
  nextBestStep: string;
};

export type BenchmarkDepthSignal = {
  label: string;
  tone: SignalTone;
  summary: string;
  action: string;
  title: string;
  status:
    | "best-month"
    | "close-to-best"
    | "mid-range"
    | "off-best"
    | "far-off-best"
    | "insufficient-history";
  periodsUsed: number;
  bestPeriodLabel: string | null;
  bestValue: number | null;
  currentValue: number | null;
  gapToBest: number | null;
  gapToBestPercent: number | null;
};

export type OpportunitySignal = {
  label: string;
  tone: SignalTone;
  summary: string;
  action: string;
  source: "scope1" | "scope2" | "intensity" | "stability" | "general";
};

export type BenchmarkPositionSignal = {
  label: string;
  tone: SignalTone;
  summary: string;
  action: string;
  status:
    | "no-benchmark"
    | "baseline-month"
    | "strongest-month"
    | "weakest-month"
    | "stronger-than-average"
    | "weaker-than-average"
    | "mid-range";
  rank: number | null;
  totalCount: number;
  deltaToBest: number | null;
  deltaToAverage: number | null;
};

export type RecoveryProgressSignal = {
  label: string;
  tone: SignalTone;
  summary: string;
  action: string;
  status:
    | "at-best"
    | "closing-gap"
    | "holding-near-best"
    | "drifting-away"
    | "no-clear-change"
    | "insufficient-history";
  currentGapKg: number | null;
  previousGapKg: number | null;
  gapChangeKg: number | null;
};

export type MultiMonthSignal = {
  label: string;
  tone: SignalTone;
  summary: string;
  action: string;
  windowLabel: string;
  improvingCount: number;
  worseningCount: number;
  stableCount: number;
  averageDeltaPercent: number;
  latestPosition:
    | "below-range"
    | "within-range"
    | "above-range"
    | "insufficient-history";
};


function getPercentChange(
  current: number | null | undefined,
  previous: number | null | undefined
) {
  if (
    current == null ||
    previous == null ||
    Number.isNaN(current) ||
    Number.isNaN(previous) ||
    previous === 0
  ) {
    return null;
  }

  return ((current - previous) / previous) * 100;
}

function formatDeltaPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return null;
  const rounded = Math.round(value);
  if (rounded === 0) return "0%";
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

type ManagementActionParams = {
  currentReport: ReportRow;
  previousReport?: ReportRow | null;
  bestMonthReference: BestMonthReference;
  comparisonMetrics?: {
    totalChangePercent?: number | null;
    intensityChangePercent?: number | null;
    scope1ChangePercent?: number | null;
    scope2ChangePercent?: number | null;
  } | null;
  dominantSourceLabel?: string | null;
  intensityBand?: IntensityBand | null;
  trendDirection?: TrendDirection | null;
  comparisonSummary?: string | null;
  baselineComparison?: BaselineComparison | null;
  anomalySignal?: AnomalySignal | null;
  consistencySignal?: ConsistencySignal | null;
  sourceWatchout?: SourceWatchout | null;
  recentPositionSignal?: RecentPositionSignal | null;
  deteriorationStreakSignal?: DeteriorationStreakSignal | null;
  persistentSourceSignal?: PersistentSourceSignal | null;
  recentTrajectorySignal?: RecentTrajectorySignal | null;
  changeDriverSignal?: ChangeDriverSignal | null;
  benchmarkDepthSignal?: BenchmarkDepthSignal | null;
  opportunitySignal?: OpportunitySignal | null;
};

function buildManagementActions(params: ManagementActionParams): ManagementActionSet {
  const {
    currentReport,
    bestMonthReference,
    comparisonMetrics,
    dominantSourceLabel,
    intensityBand,
    trendDirection,
    comparisonSummary,
    baselineComparison,
    anomalySignal,
    consistencySignal,
    sourceWatchout,
    recentPositionSignal,
    deteriorationStreakSignal,
    persistentSourceSignal,
    recentTrajectorySignal,
    changeDriverSignal,
    benchmarkDepthSignal,
    opportunitySignal,
  } = params;

  const priorityActions: Array<ManagementPriority & { score: number }> = [];
  const improvedAreas: string[] = [];
  const watchAreas: string[] = [];

  const total = currentReport.total_emissions ?? 0;
  const scope1 = currentReport.scope1_emissions ?? 0;
  const scope2 = currentReport.scope2_emissions ?? 0;

  const scope1Share = total > 0 ? scope1 / total : 0;
  const scope2Share = total > 0 ? scope2 / total : 0;

  const totalDelta = comparisonMetrics?.totalChangePercent ?? null;
  const intensityDelta = comparisonMetrics?.intensityChangePercent ?? null;
  const scope1Delta = comparisonMetrics?.scope1ChangePercent ?? null;
  const scope2Delta = comparisonMetrics?.scope2ChangePercent ?? null;

  const pushPriority = (
    title: string,
    summary: string,
    tone: SignalTone,
    source: "scope1" | "scope2" | "intensity" | "trend" | "data" | "general",
    score: number
  ) => {
    if (priorityActions.some((item) => item.title === title)) return;
    priorityActions.push({ title, summary, tone, source, score });
  };

  const pushImproved = (value: string) => {
    if (!improvedAreas.includes(value)) improvedAreas.push(value);
  };

  const pushWatch = (value: string) => {
    if (!watchAreas.includes(value)) watchAreas.push(value);
  };

  const baselineIsWeak = baselineComparison?.label === "No baseline yet";
  const baselineIsAbove = baselineComparison?.label === "Above baseline";
  const anomalyAbove = anomalySignal?.status === "above-normal";
  const anomalyBelow = anomalySignal?.status === "below-normal";
  const volatile = consistencySignal?.status === "volatile";
  const highIntensity = intensityBand?.tone === "high";
  const worsening = trendDirection?.label === "Worsening";
  const improving = trendDirection?.label === "Improving";

  if (benchmarkDepthSignal?.status === "far-off-best") {
    pushPriority(
      "Current month is far from your best recent month",
      benchmarkDepthSignal.summary,
      "negative",
      "general",
      98
    );
    pushWatch("Current month is well above the best result in your recent operating range and needs focused recovery attention.");
  } else if (benchmarkDepthSignal?.status === "off-best") {
    pushPriority(
      "Current month is materially off your best recent month",
      benchmarkDepthSignal.summary,
      "negative",
      "general",
      95
    );
    pushWatch("Current month is materially above the best result in your recent operating range.");
  } else if (benchmarkDepthSignal?.status === "close-to-best") {
    pushImproved("Current month is operating close to your best recent result.");
  } else if (benchmarkDepthSignal?.status === "best-month") {
    pushImproved("This is currently the best month in your recent comparison window.");
  }

  if (
    benchmarkDepthSignal?.status === "far-off-best" &&
    recentTrajectorySignal?.status === "sustained-deterioration" &&
    changeDriverSignal?.status === "efficiency-deterioration"
  ) {
    pushPriority(
      "Performance is far from your best month and still worsening for efficiency reasons",
      "Recent results are moving in the wrong direction, the current month sits well above your best recent result, and the latest change looks driven by weaker underlying efficiency rather than scale alone.",
      "negative",
      "intensity",
      100
    );
    pushWatch("The gap to your stronger recent performance now looks like a true efficiency recovery issue, not just ordinary month-to-month variation.");
  } else if (
    benchmarkDepthSignal?.status === "off-best" &&
    recentTrajectorySignal?.status === "sustained-deterioration" &&
    changeDriverSignal?.status === "efficiency-deterioration"
  ) {
    pushPriority(
      "Performance is drifting away from your best month for efficiency reasons",
      "Recent results are moving in the wrong direction, the current month remains materially off your best recent result, and the latest change looks driven by weaker underlying efficiency rather than scale alone.",
      "negative",
      "intensity",
      99
    );
    pushWatch("The current gap to your better recent performance looks increasingly driven by true efficiency deterioration, not just normal month-to-month movement.");
  }

  if (
    benchmarkDepthSignal?.status === "far-off-best" &&
    changeDriverSignal?.status === "scale-driven-increase"
  ) {
    pushPriority(
      "Performance is far off best, with operating scale as a major driver",
      "The current month sits well above your best recent result, but the latest increase appears to be driven more by higher operating scale than a pure efficiency breakdown.",
      "neutral",
      "trend",
      90
    );
    pushWatch("The recovery gap is large, but it should be interpreted in the context of operating scale rather than treated automatically as an efficiency failure.");
  } else if (
    benchmarkDepthSignal?.status === "off-best" &&
    changeDriverSignal?.status === "scale-driven-increase"
  ) {
    pushPriority(
      "Performance is off best, but scale is a major driver",
      "The current month is still materially above your best recent result, but the latest increase appears to be driven more by higher operating scale than a pure efficiency breakdown.",
      "neutral",
      "trend",
      87
    );
    pushWatch("The gap to your best recent month should be reviewed in the context of operating scale, not treated automatically as an efficiency failure.");
  }

  if (
    benchmarkDepthSignal?.status === "far-off-best" &&
    recentTrajectorySignal?.status === "partial-rebound"
  ) {
    pushPriority(
      "Recovery has started, but the business is still far from its best recent month",
      "Recent results suggest some rebound, but the current month still sits well above your best recent result, so recovery should not yet be treated as close to complete.",
      "neutral",
      "trend",
      88
    );
    pushWatch("Recent improvement is encouraging, but the operating gap versus your stronger recent months remains large.");
  } else if (
    benchmarkDepthSignal?.status === "off-best" &&
    recentTrajectorySignal?.status === "partial-rebound"
  ) {
    pushPriority(
      "Recovery has started, but the gap is still open",
      "Recent results suggest some rebound, but the current month is still materially above your best recent result, so recovery should not yet be treated as complete.",
      "neutral",
      "trend",
      86
    );
    pushWatch("Recent improvement is encouraging, but the operating gap versus your stronger recent months is still not closed.");
  }

  if (
    (benchmarkDepthSignal?.status === "best-month" ||
      benchmarkDepthSignal?.status === "close-to-best") &&
    recentTrajectorySignal?.status === "holding-gains"
  ) {
    pushImproved("Recent gains are holding while performance stays near the best end of your recent range.");
  }

  if (
    anomalySignal?.status === "below-normal" &&
    changeDriverSignal?.status === "efficiency-improvement" &&
    (benchmarkDepthSignal?.status === "best-month" ||
      benchmarkDepthSignal?.status === "close-to-best") &&
    (recentTrajectorySignal?.status === "partial-rebound" ||
      recentTrajectorySignal?.status === "holding-gains")
  ) {
    pushPriority(
      "Protect and standardize this stronger operating month",
      "The latest month is outperforming recent normal, the change looks driven by real efficiency improvement, and performance is now sitting at the strong end of your recent range.",
      "positive",
      sourceWatchout?.label === "Fuel-led improvement" ? "scope1" : "general",
      97
    );
    pushImproved("This month is strong enough to use as a practical operating reference, not just a temporary good result.");
  }

  if (
    sourceWatchout?.label === "Fuel-led improvement" &&
    changeDriverSignal?.status === "efficiency-improvement"
  ) {
    pushPriority(
      "Fuel-side improvement is the strongest repeatable lever",
      "Fuel-side operating changes appear to have contributed to a real efficiency improvement, so the strongest next gain comes from preserving and repeating what worked there.",
      "positive",
      "scope1",
      89
    );
    pushImproved("Fuel-side operating changes appear to have contributed to a real efficiency improvement.");
  }

  if (deteriorationStreakSignal?.status === "repeated-worsening") {
    pushPriority(
      "Performance is worsening repeatedly",
      deteriorationStreakSignal.summary,
      "negative",
      "trend",
      92
    );
    pushWatch("Emissions have worsened across multiple consecutive comparable periods.");
  } else if (deteriorationStreakSignal?.status === "repeated-improving") {
    pushImproved("Performance has improved across multiple consecutive comparable periods.");
  }

  if (recentTrajectorySignal?.status === "sustained-deterioration") {
    pushPriority(
      "Recent direction is deteriorating",
      recentTrajectorySignal.summary,
      "negative",
      "trend",
      91
    );
    pushWatch("Recent months are showing a broader worsening direction, not just a one-off higher month.");
  } else if (recentTrajectorySignal?.status === "sustained-improvement") {
    pushImproved("Recent months show a broader improving direction rather than a one-off lower month.");
  } else if (recentTrajectorySignal?.status === "holding-gains") {
    pushImproved("Recent gains appear to be holding rather than immediately reversing.");
  } else if (recentTrajectorySignal?.status === "partial-rebound") {
    pushWatch("Recent performance is improving, but the rebound is not yet strong enough to treat as fully established.");
  }

  if (anomalyAbove && !volatile) {
    pushPriority(
      "This month is above recent normal",
      anomalySignal?.summary ||
        "This month is running above recent normal under reasonably stable conditions.",
      "negative",
      "trend",
      90
    );
    pushWatch("This month is above recent normal rather than just fluctuating inside the usual range.");
  } else if (anomalyBelow && !volatile) {
    pushImproved("This month performed better than recent normal under relatively stable conditions.");
  }

  if (highIntensity) {
    pushPriority(
      "Efficiency is now a management priority",
      "Emissions per employee remain high enough that efficiency should be treated as a priority, not just total-volume control.",
      "negative",
      "intensity",
      88
    );
    pushWatch("Emissions per employee remain elevated.");
  } else if (intensityBand?.tone === "low") {
    pushImproved("Emissions intensity is sitting in a healthier range.");
  }

  if (
    !(
      sourceWatchout?.label === "Fuel-led improvement" &&
      changeDriverSignal?.status === "efficiency-improvement"
    ) &&
    (
      opportunitySignal?.source === "scope1" ||
      persistentSourceSignal?.status === "scope1-persistent" ||
      scope1Share >= 0.6
    )
  ) {
    pushPriority(
      "Fuel-side reduction is the strongest lever",
      opportunitySignal?.summary ||
        "Scope 1 remains the strongest practical reduction lever in the current operating profile.",
      opportunitySignal?.tone === "negative" ? "negative" : "neutral",
      "scope1",
      (benchmarkDepthSignal?.status === "off-best" || benchmarkDepthSignal?.status === "far-off-best") ? 94 : 84
    );
    pushWatch("Fuel and direct combustion remain a major share of the footprint.");
  }

  if (
    opportunitySignal?.source === "scope2" ||
    persistentSourceSignal?.status === "scope2-persistent" ||
    scope2Share >= 0.6
  ) {
    pushPriority(
      "Electricity-side reduction is the strongest lever",
      opportunitySignal?.summary ||
        "Scope 2 remains the strongest practical reduction lever in the current operating profile.",
      opportunitySignal?.tone === "negative" ? "negative" : "neutral",
      "scope2",
      (benchmarkDepthSignal?.status === "off-best" || benchmarkDepthSignal?.status === "far-off-best") ? 94 : 84
    );
    pushWatch("Electricity remains a major share of the footprint.");
  }

  if (volatile) {
    pushPriority(
      "Operating consistency needs attention",
      consistencySignal?.summary ||
        "Recent months are variable enough that consistency itself has become a management issue.",
      "neutral",
      "general",
      76
    );
    pushWatch("Recent months remain variable, so one month should not be treated in isolation.");
  } else if (consistencySignal?.status === "stable") {
    pushImproved("Recent months have been stable enough to make comparisons more decision-useful.");
  }

  if (sourceWatchout?.label === "Electricity-driven increase") {
    pushWatch("The current increase appears to be mainly electricity-driven.");
  } else if (sourceWatchout?.label === "Fuel-driven increase") {
    pushWatch("The current increase appears to be mainly fuel-driven.");
  } else if (sourceWatchout?.label === "Both sources moved up") {
    pushWatch("Both fuel-related and electricity-related emissions increased together.");
  } else if (sourceWatchout?.label === "Electricity-led improvement") {
    pushImproved("Recent improvement appears to be led mainly by electricity-side controls.");
  } else if (sourceWatchout?.label === "Fuel-led improvement") {
    pushImproved("Recent improvement appears to be led mainly by fuel-side controls.");
  }

  if (recentPositionSignal?.status === "worst-recent") {
    pushPriority(
      "This is the weakest month in your recent range",
      recentPositionSignal.summary,
      "negative",
      "trend",
      89
    );
    pushWatch("This month sits at the weak end of your recent performance range.");
  } else if (recentPositionSignal?.status === "best-recent") {
    pushImproved("This month is the strongest result in your recent operating range.");
  }

  if (totalDelta != null && totalDelta > 0 && worsening) {
    pushWatch(`Total emissions worsened ${formatDeltaPercent(totalDelta)} versus the previous comparable period.`);
  } else if (totalDelta != null && totalDelta < 0) {
    pushImproved(`Total emissions improved ${formatDeltaPercent(totalDelta)} versus the previous comparable period.`);
  }

  if (scope1Delta != null && scope1Delta < 0) {
    pushImproved(`Scope 1 improved ${formatDeltaPercent(scope1Delta)} versus the previous comparable period.`);
  } else if (scope1Delta != null && scope1Delta > 0) {
    pushWatch(`Scope 1 worsened ${formatDeltaPercent(scope1Delta)} versus the previous comparable period.`);
  }

  if (scope2Delta != null && scope2Delta < 0) {
    pushImproved(`Scope 2 improved ${formatDeltaPercent(scope2Delta)} versus the previous comparable period.`);
  } else if (scope2Delta != null && scope2Delta > 0) {
    pushWatch(`Scope 2 worsened ${formatDeltaPercent(scope2Delta)} versus the previous comparable period.`);
  }

  if (intensityDelta != null && intensityDelta < 0) {
    pushImproved(`Emissions per employee improved ${formatDeltaPercent(intensityDelta)} versus the previous comparable period.`);
  } else if (intensityDelta != null && intensityDelta > 0) {
    pushWatch(`Emissions per employee worsened ${formatDeltaPercent(intensityDelta)} versus the previous comparable period.`);
  }

  if (baselineIsWeak) {
    pushPriority(
      "Baseline quality still needs building",
      "Recent history is still limited, so maintaining consistent monthly reporting structure remains important before drawing stronger conclusions.",
      "neutral",
      "data",
      70
    );
  }

  if (priorityActions.length === 0) {
    pushPriority(
      "Maintain current control and monitor for consistency",
      comparisonSummary ||
        "Recent results do not show one urgent problem. Focus on maintaining consistency and watching for repeated movement over time.",
      "neutral",
      "general",
      50
    );
  }

  const hasStrongOperationalPriority = priorityActions.some(
    (action) => action.score >= 88 && action.source !== "data"
  );

  const adjustedPriorityActions = priorityActions.map((action) => {
    let adjustedScore = action.score;

    if (benchmarkDepthSignal?.status === "far-off-best") {
      if (
        action.source === "intensity" &&
        changeDriverSignal?.status === "efficiency-deterioration"
      ) {
        adjustedScore += 4;
      }

      if (
        action.source === "scope1" &&
        opportunitySignal?.source === "scope1"
      ) {
        adjustedScore += 3;
      }

      if (
        action.source === "scope2" &&
        opportunitySignal?.source === "scope2"
      ) {
        adjustedScore += 3;
      }

      if (action.source === "data" && hasStrongOperationalPriority) {
        adjustedScore -= 10;
      }
    }

    if (
      (benchmarkDepthSignal?.status === "best-month" ||
        benchmarkDepthSignal?.status === "close-to-best") &&
      changeDriverSignal?.status === "efficiency-improvement"
    ) {
      if (action.title === "Protect and standardize this stronger operating month") {
        adjustedScore += 4;
      }

      if (
        action.title === "Fuel-side improvement is the strongest repeatable lever" ||
        action.title === "Electricity-side reduction is the strongest lever"
      ) {
        adjustedScore += 1;
      }
    }

    if (
      baselineIsWeak &&
      action.source === "data" &&
      hasStrongOperationalPriority
    ) {
      adjustedScore -= 6;
    }

    if (
      (benchmarkDepthSignal?.status === "far-off-best" ||
        benchmarkDepthSignal?.status === "off-best") &&
      bestMonthReference.driverSignal.kind === "fuel" &&
      action.source === "scope1"
    ) {
      adjustedScore += benchmarkDepthSignal?.status === "far-off-best" ? 5 : 3;
    }

    if (
      (benchmarkDepthSignal?.status === "far-off-best" ||
        benchmarkDepthSignal?.status === "off-best") &&
      bestMonthReference.driverSignal.kind === "electricity" &&
      action.source === "scope2"
    ) {
      adjustedScore += benchmarkDepthSignal?.status === "far-off-best" ? 5 : 3;
    }

    if (
      (benchmarkDepthSignal?.status === "far-off-best" ||
        benchmarkDepthSignal?.status === "off-best") &&
      bestMonthReference.driverSignal.kind === "efficiency" &&
      action.source === "intensity"
    ) {
      adjustedScore += benchmarkDepthSignal?.status === "far-off-best" ? 5 : 3;
    }

    if (
      (benchmarkDepthSignal?.status === "best-month" ||
        benchmarkDepthSignal?.status === "close-to-best") &&
      (action.title === "Protect and standardize this stronger operating month" ||
        action.title === "Fuel-side improvement is the strongest repeatable lever")
    ) {
      adjustedScore += 3;
    }

    if (
      action.title === "Recent direction is deteriorating" &&
      recentTrajectorySignal?.status === "sustained-deterioration" &&
      deteriorationStreakSignal?.status === "repeated-worsening"
    ) {
      adjustedScore -= 2;
    }

    if (
      action.source === "trend" &&
      (bestMonthReference.driverSignal.kind === "fuel" ||
        bestMonthReference.driverSignal.kind === "electricity" ||
        bestMonthReference.driverSignal.kind === "efficiency") &&
      (benchmarkDepthSignal?.status === "far-off-best" ||
        benchmarkDepthSignal?.status === "off-best")
    ) {
      adjustedScore -= 2;
    }

    return { ...action, score: adjustedScore };
  });

  const rankedActions = adjustedPriorityActions
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score, ...rest }) => rest);

  const topAction = rankedActions[0];

  let biggestOpportunity = "Largest opportunity is in combined fuel-and-electricity operating discipline.";
  if (
    (benchmarkDepthSignal?.status === "far-off-best" ||
      benchmarkDepthSignal?.status === "off-best") &&
    bestMonthReference.driverSignal.kind === "fuel"
  ) {
    biggestOpportunity =
      "Largest opportunity is closing the fuel-led gap to your best recent month.";
  } else if (
    (benchmarkDepthSignal?.status === "far-off-best" ||
      benchmarkDepthSignal?.status === "off-best") &&
    bestMonthReference.driverSignal.kind === "electricity"
  ) {
    biggestOpportunity =
      "Largest opportunity is closing the electricity-led gap to your best recent month.";
  } else if (
    (benchmarkDepthSignal?.status === "far-off-best" ||
      benchmarkDepthSignal?.status === "off-best") &&
    bestMonthReference.driverSignal.kind === "efficiency"
  ) {
    biggestOpportunity =
      "Largest opportunity is restoring the efficiency conditions behind your best recent month.";
  } else if (
    (benchmarkDepthSignal?.status === "best-month" ||
      benchmarkDepthSignal?.status === "close-to-best") &&
    changeDriverSignal?.status === "efficiency-improvement" &&
    sourceWatchout?.label === "Fuel-led improvement"
  ) {
    biggestOpportunity =
      "Largest opportunity is preserving the fuel-side practices behind this stronger month and turning them into a repeatable operating standard.";
  } else if (
    (benchmarkDepthSignal?.status === "best-month" ||
      benchmarkDepthSignal?.status === "close-to-best") &&
    changeDriverSignal?.status === "efficiency-improvement"
  ) {
    biggestOpportunity =
      "Largest opportunity is protecting and standardizing the operating conditions behind this stronger month.";
  } else if (
    anomalySignal?.status === "below-normal" &&
    changeDriverSignal?.status === "efficiency-improvement" &&
    sourceWatchout?.label === "Fuel-led improvement"
  ) {
    biggestOpportunity =
      "Largest opportunity is turning the fuel-side improvement behind this stronger month into a repeatable operating standard.";
  } else if (
    anomalySignal?.status === "below-normal" &&
    changeDriverSignal?.status === "efficiency-improvement"
  ) {
    biggestOpportunity =
      "Largest opportunity is standardizing the stronger operating conditions behind this month.";
  } else if (topAction?.source === "scope1") {
    biggestOpportunity = "Largest opportunity is on the fuel side.";
  } else if (topAction?.source === "scope2") {
    biggestOpportunity = "Largest opportunity is on the electricity side.";
  } else if (topAction?.source === "intensity") {
    biggestOpportunity = "Largest opportunity is improving emissions efficiency per employee.";
  } else if (topAction?.source === "trend") {
    biggestOpportunity = "Largest opportunity is reversing the current worsening pattern.";
  } else if (topAction?.source === "data") {
    biggestOpportunity = "Largest opportunity is improving reporting consistency.";
  } else if (opportunitySignal?.source === "scope1") {
    biggestOpportunity = "Largest opportunity is on the fuel side.";
  } else if (opportunitySignal?.source === "scope2") {
    biggestOpportunity = "Largest opportunity is on the electricity side.";
  } else if (opportunitySignal?.source === "intensity") {
    biggestOpportunity = "Largest opportunity is improving emissions efficiency per employee.";
  } else if (opportunitySignal?.source === "stability") {
    biggestOpportunity = "Largest opportunity is improving operating consistency.";
  }

  let nextBestStep =
    "Use the next cycle to confirm whether the current operating position holds and act on the clearest repeatable lever.";

  if (topAction?.source === "scope1") {
    nextBestStep =
      "Identify the single largest fuel-consuming activity and choose one practical reduction action for the next reporting period.";
  } else if (topAction?.source === "scope2") {
    nextBestStep =
      "Identify the single largest electricity-consuming activity and choose one measurable efficiency action for the next reporting period.";
  } else if (topAction?.source === "intensity") {
    nextBestStep =
      "Check whether the pressure is coming from higher energy or fuel use per employee, lower staffing, or a real efficiency loss before the next submission.";
  } else if (topAction?.source === "trend") {
    nextBestStep =
      "Compare the recent worsening periods side by side and identify the one operating change that most needs correcting before the next cycle closes.";
  } else if (topAction?.source === "data") {
    nextBestStep =
      "Keep the next reporting cycle complete and consistent so your operating baseline becomes more decision-useful.";
  }

  if (
    (benchmarkDepthSignal?.status === "far-off-best" ||
      benchmarkDepthSignal?.status === "off-best") &&
    bestMonthReference.driverSignal.kind === "fuel"
  ) {
    nextBestStep =
      "Compare the latest month against your best recent month, isolate the fuel-side difference, and carry one concrete fuel-use correction into the next cycle.";
  } else if (
    (benchmarkDepthSignal?.status === "far-off-best" ||
      benchmarkDepthSignal?.status === "off-best") &&
    bestMonthReference.driverSignal.kind === "electricity"
  ) {
    nextBestStep =
      "Compare the latest month against your best recent month, isolate the electricity-side difference, and carry one measurable power-efficiency correction into the next cycle.";
  } else if (
    (benchmarkDepthSignal?.status === "far-off-best" ||
      benchmarkDepthSignal?.status === "off-best") &&
    bestMonthReference.driverSignal.kind === "efficiency"
  ) {
    nextBestStep =
      "Compare the latest month against your best recent month, identify what changed in operating efficiency, and correct that breakdown before the next cycle closes.";
  } else if (
    anomalySignal?.status === "below-normal" &&
    changeDriverSignal?.status === "efficiency-improvement" &&
    sourceWatchout?.label === "Fuel-led improvement" &&
    (benchmarkDepthSignal?.status === "best-month" ||
      benchmarkDepthSignal?.status === "close-to-best")
  ) {
    nextBestStep =
      "Compare this stronger month against the previous worse month, isolate the fuel-side practices that improved performance, and lock those into a repeatable operating standard next cycle.";
  } else if (
    anomalySignal?.status === "below-normal" &&
    changeDriverSignal?.status === "efficiency-improvement" &&
    (benchmarkDepthSignal?.status === "best-month" ||
      benchmarkDepthSignal?.status === "close-to-best")
  ) {
    nextBestStep =
      "Use this month as your new operating reference, identify what changed versus the weaker recent months, and carry those conditions into the next cycle.";
  } else if (
    (benchmarkDepthSignal?.status === "off-best" || benchmarkDepthSignal?.status === "far-off-best") &&
    recentTrajectorySignal?.status === "sustained-deterioration" &&
    changeDriverSignal?.status === "efficiency-deterioration"
  ) {
    nextBestStep =
      "Compare your best recent month against the latest worsening months, identify the main efficiency breakdown, and correct that driver before it becomes your new operating norm.";
  } else if (
    (benchmarkDepthSignal?.status === "off-best" || benchmarkDepthSignal?.status === "far-off-best") &&
    changeDriverSignal?.status === "scale-driven-increase"
  ) {
    nextBestStep =
      "Review whether staffing, throughput, operating hours, or asset utilization expanded materially before treating the gap to your best recent month as a pure efficiency problem.";
  } else if (
    (benchmarkDepthSignal?.status === "off-best" || benchmarkDepthSignal?.status === "far-off-best") &&
    recentTrajectorySignal?.status === "partial-rebound"
  ) {
    nextBestStep =
      "Preserve the stronger recent controls, but keep using your best recent month as the reference point until the rebound closes more of the remaining gap.";
  } else if (
    (benchmarkDepthSignal?.status === "best-month" ||
      benchmarkDepthSignal?.status === "close-to-best") &&
    recentTrajectorySignal?.status === "holding-gains"
  ) {
    nextBestStep =
      "Standardize the operating conditions behind the stronger recent months and use the next cycle to confirm that the gains remain durable.";
  } else if (
    recentTrajectorySignal?.status === "sustained-deterioration" &&
    topAction?.source === "trend"
  ) {
    nextBestStep =
      "Compare the recent worsening months side by side, identify the main repeated driver, and correct that pattern before it becomes the new operating norm.";
  } else if (
    recentTrajectorySignal?.status === "holding-gains" &&
    topAction?.source !== "data"
  ) {
    nextBestStep =
      "Lock in the operating conditions behind the stronger recent results and use the next cycle to confirm that the gains continue to hold.";
  } else if (
    recentTrajectorySignal?.status === "partial-rebound" &&
    topAction?.source !== "data"
  ) {
    nextBestStep =
      "Keep the stronger recent controls in place and use the next cycle to confirm whether the rebound is becoming a durable improvement pattern.";
  }

  return {
    priorityActions: rankedActions,
    biggestOpportunity,
    improvedAreas: improvedAreas.slice(0, 3),
    watchAreas: watchAreas.slice(0, 3),
    nextBestStep,
  };
}


function buildMultiMonthSignal(
  report: ReportRow | null,
  comparisonHistory: ReportRow[]
): MultiMonthSignal {
  if (!report) {
    return {
      label: "Limited history",
      tone: "neutral",
      summary:
        "There is not enough comparable history yet to judge whether the recent multi-month pattern is improving, worsening, or mixed.",
      action:
        "Keep submitting monthly data so the platform can identify whether performance is stabilizing or drifting over time.",
      windowLabel: "No comparable months",
      improvingCount: 0,
      worseningCount: 0,
      stableCount: 0,
      averageDeltaPercent: 0,
      latestPosition: "insufficient-history",
    };
  }

  const currentTotal = Number(report.total_emissions ?? 0);

  const comparableHistory = getComparableHistory(report, comparisonHistory);

  const validHistory = comparableHistory
    .map((row) => Number(row.total_emissions ?? 0))
    .filter((value) => Number.isFinite(value));

  if (validHistory.length < 2) {
    return {
      label: "Limited history",
      tone: "neutral",
      summary:
        "There is not enough comparable history yet to judge whether the recent multi-month pattern is improving, worsening, or mixed.",
      action:
        "Keep submitting monthly data so the platform can identify whether performance is stabilizing or drifting over time.",
      windowLabel:
        validHistory.length === 1 ? "1 comparable month" : "No comparable months",
      improvingCount: 0,
      worseningCount: 0,
      stableCount: 0,
      averageDeltaPercent: 0,
      latestPosition: "insufficient-history",
    };
  }

  const recentSeries = [...validHistory, currentTotal].slice(-6);

  let improvingCount = 0;
  let worseningCount = 0;
  let stableCount = 0;
  const pctChanges: number[] = [];
  const absoluteDeltas: number[] = [];

  for (let index = 1; index < recentSeries.length; index += 1) {
    const previous = recentSeries[index - 1];
    const current = recentSeries[index];
    const delta = current - previous;
    const pct = previous > 0 ? (delta / previous) * 100 : 0;
    pctChanges.push(pct);
    absoluteDeltas.push(Math.abs(delta));

    const stabilityThreshold = Math.max(previous * 0.03, 5);

    if (Math.abs(delta) <= stabilityThreshold) {
      stableCount += 1;
    } else if (delta < 0) {
      improvingCount += 1;
    } else {
      worseningCount += 1;
    }
  }

  const averageHistory =
    validHistory.reduce((sum, value) => sum + value, 0) / validHistory.length;
  const minimumHistory = Math.min(...validHistory);
  const maximumHistory = Math.max(...validHistory);
  const historySpread = Math.max(maximumHistory - minimumHistory, 0);
  const averageAbsoluteDelta =
    absoluteDeltas.length > 0
      ? absoluteDeltas.reduce((sum, value) => sum + value, 0) / absoluteDeltas.length
      : 0;

  let latestPosition: MultiMonthSignal["latestPosition"] = "within-range";
  if (currentTotal < minimumHistory) latestPosition = "below-range";
  if (currentTotal > maximumHistory) latestPosition = "above-range";

  const averageDeltaPercent =
    pctChanges.length > 0
      ? pctChanges.reduce((sum, value) => sum + value, 0) / pctChanges.length
      : 0;

  const isVolatile =
    averageHistory > 0 &&
    (historySpread / averageHistory >= 0.2 || averageAbsoluteDelta / averageHistory >= 0.1);

  let label = "Mixed recent pattern";
  let tone: SignalTone = "neutral";
  let summary =
    "Recent months are moving in mixed directions, so management should focus on consistency rather than assuming a clear trend.";
  let action =
    "Review recent operating differences and standardize the practices behind the stronger months.";

  if (improvingCount > worseningCount && improvingCount >= stableCount) {
    label =
      latestPosition === "above-range"
        ? "Improving, but still elevated"
        : "Improving recent pattern";
    tone = "positive";
    summary =
      latestPosition === "below-range"
        ? "Recent months are generally improving, and the latest month is now below the recent operating range."
        : latestPosition === "within-range"
          ? "Recent months are generally improving, with the latest month staying within the recent operating range."
          : "Recent months are generally improving, although the latest month still sits above the recent operating range.";
    action =
      latestPosition === "above-range"
        ? "Protect the recent gains, but keep pressure on the main emissions source until the next cycle moves back into the recent range."
        : "Protect the operating changes behind the stronger months and make them the repeatable standard for the next cycle.";
  } else if (worseningCount > improvingCount && worseningCount >= stableCount) {
    label =
      latestPosition === "above-range"
        ? "Worsening and above range"
        : "Worsening recent pattern";
    tone = "negative";
    summary =
      latestPosition === "above-range"
        ? "Recent months are generally worsening, and the latest month is now above the recent operating range."
        : latestPosition === "within-range"
          ? "Recent months are generally worsening even though the latest month remains within the recent operating range."
          : "Recent months are generally worsening, though the latest month has not yet moved above the recent operating range.";
    action =
      "Investigate what changed across the last few months and target the source that is driving the repeated increases.";
  } else if (stableCount > improvingCount && stableCount > worseningCount) {
    label =
      latestPosition === "above-range"
        ? "Stable, but above normal"
        : latestPosition === "below-range"
          ? "Stable, stronger range"
          : "Stable recent pattern";
    tone = latestPosition === "above-range" ? "negative" : "neutral";
    summary =
      latestPosition === "above-range"
        ? "Recent months are relatively stable, but the operating level is holding above the recent normal range."
        : latestPosition === "below-range"
          ? "Recent months are relatively stable, and the latest month is holding below the recent operating range."
          : "Recent months are relatively stable overall, so the management opportunity is to move from consistency into deliberate reduction.";
    action =
      latestPosition === "above-range"
        ? "Use the stable pattern to target one clear reduction lever and bring the next month back toward the recent range."
        : latestPosition === "below-range"
          ? "Protect the practices behind this stronger operating level and confirm they can be repeated next cycle."
          : "Use the stable baseline to choose one clear reduction lever and track whether the next month moves below the normal range.";
  } else if (isVolatile) {
    label = "Volatile recent pattern";
    tone = "negative";
    summary =
      "Recent months are moving around too much to treat the latest result as a dependable new baseline.";
    action =
      "Investigate what is creating the month-to-month swings and standardize operating conditions before making big management assumptions.";
  }

  if (averageHistory <= 0) {
    return {
      label,
      tone,
      summary,
      action,
      windowLabel: `${validHistory.length} comparable months`,
      improvingCount,
      worseningCount,
      stableCount,
      averageDeltaPercent,
      latestPosition,
    };
  }

  return {
    label,
    tone,
    summary,
    action,
    windowLabel: `${validHistory.length} comparable months`,
    improvingCount,
    worseningCount,
    stableCount,
    averageDeltaPercent,
    latestPosition,
  };
}

export function buildReportIntelligence(
  report: ReportRow | null,
  previousComparableReport: ReportRow | null,
  comparisonHistory: ReportRow[] = []
) {
  const perEmployee = getPerEmployee(
    report?.total_emissions,
    report?.employee_count
  );
  const intensityBand = getIntensityBand(perEmployee);
  const trend = getTrendDirection(report, previousComparableReport);
  const dominantSource = getDominantSource(report);
  const coverage = getCoverageLabel(report);
  const consistencySignal = getConsistencySignal(report, comparisonHistory);
  const baselineWindow = getBaselineWindow(report, comparisonHistory);
  const baselineComparison = getRecentBaselineComparison(
    report,
    comparisonHistory
  );
  const anomalySignal = getAnomalySignal(report, comparisonHistory);
  const sourceWatchout = getSourceWatchout(report, previousComparableReport);
  const changeDriverSignal = getChangeDriverSignal(
    report,
    previousComparableReport
  );
  const managementSignal = getManagementSignal(
    report,
    consistencySignal,
    anomalySignal,
    sourceWatchout
  );
  const recentPositionSignal = getRecentPositionSignal(report, comparisonHistory);
  const deteriorationStreakSignal = getDeteriorationStreakSignal(
    report,
    comparisonHistory
  );
  const persistentSourceSignal = getPersistentSourceSignal(
    report,
    comparisonHistory
  );
  const recentTrajectorySignal = getRecentTrajectorySignal(
    report,
    comparisonHistory
  );
  const benchmarkDepthSignal = getBenchmarkDepthSignal(report, comparisonHistory);
  const benchmarkPositionSignal = getBenchmarkPositionSignal(
    report,
    comparisonHistory
  );
  const opportunitySignal = getOpportunitySignal(
    report,
    dominantSource,
    intensityBand,
    consistencySignal,
    sourceWatchout,
    benchmarkDepthSignal
  );

  const executiveSummary = getExecutiveSummary(
    report,
    trend,
    baselineComparison,
    dominantSource,
    intensityBand,
    anomalySignal,
    sourceWatchout,
    consistencySignal,
    managementSignal
  );

  const recommendedActions = getRecommendedActions(
    report,
    trend,
    dominantSource,
    intensityBand,
    perEmployee,
    baselineComparison,
    anomalySignal,
    sourceWatchout,
    consistencySignal,
    recentPositionSignal,
    deteriorationStreakSignal,
    persistentSourceSignal,
    changeDriverSignal,
    benchmarkDepthSignal,
    opportunitySignal
  );

  const benchmarkSummary = getBenchmarkSummary(
    perEmployee,
    intensityBand,
    baselineComparison,
    anomalySignal,
    consistencySignal
  );
  const comparisonSummaryObject = previousComparableReport
    ? getComparisonSummary(report, previousComparableReport)
    : null;

  const bestMonthReference: BestMonthReference = report
    ? buildBestMonthReference(report, comparisonHistory)
    : {
        hasBestMonth: false,
        bestMonthLabel: "No benchmark yet",
        bestMonthId: null,
        gapKg: null,
        gapPercent: null,
        currentPerEmployee: null,
        bestPerEmployee: null,
        perEmployeeGap: null,
        driverSignal: {
          kind: "insufficient-data",
          label: "Limited benchmark history",
          tone: "neutral",
          summary: "Best-month comparison is not yet available.",
          action: "Continue monthly reporting to establish a reliable best-month baseline.",
        },
        gapSignal: {
          label: "Limited benchmark history",
          tone: "neutral",
          summary: "There is not enough recent history yet to compare this month against a strongest reference month.",
          action: "Build a few more months of consistent reporting to unlock best-month gap analysis.",
        },
        summary: "Best-month comparison is not yet available.",
        nextStep: "Continue monthly reporting to establish a reliable best-month baseline.",
      };

  const recoveryProgressSignal = buildRecoveryProgressSignal(
    report,
    previousComparableReport,
    bestMonthReference
  );
  const multiMonthSignal = buildMultiMonthSignal(
    report,
    comparisonHistory
  );

  const managementActions = report
    ? buildManagementActions({
        currentReport: report,
        previousReport: previousComparableReport ?? null,
        bestMonthReference,
        comparisonMetrics: previousComparableReport
          ? {
              totalChangePercent:
                getPercentChange(report?.total_emissions, previousComparableReport?.total_emissions),
              intensityChangePercent:
                getPercentChange(
                  perEmployee,
                  getPerEmployee(
                    previousComparableReport?.total_emissions,
                    previousComparableReport?.employee_count
                  )
                ),
              scope1ChangePercent:
                getPercentChange(report?.scope1_emissions, previousComparableReport?.scope1_emissions),
              scope2ChangePercent:
                getPercentChange(report?.scope2_emissions, previousComparableReport?.scope2_emissions),
            }
          : null,
        dominantSourceLabel: dominantSource?.label ?? null,
        intensityBand,
        trendDirection: trend,
        comparisonSummary: comparisonSummaryObject?.summary ?? null,
        baselineComparison,
        anomalySignal,
        consistencySignal,
        sourceWatchout,
        recentPositionSignal,
        deteriorationStreakSignal,
        persistentSourceSignal,
        recentTrajectorySignal,
        changeDriverSignal,
        benchmarkDepthSignal,
        opportunitySignal,
      })
    : {
        priorityActions: [],
        biggestOpportunity: "",
        improvedAreas: [],
        watchAreas: [],
        nextBestStep: "",
      };


  return {
    perEmployee,
    bestMonthReference,
    multiMonthSignal,
    recoveryProgressSignal,
    intensityBand,
    trend,
    dominantSource,
    coverage,
    consistencySignal,
    baselineWindow,
    baselineComparison,
    anomalySignal,
    sourceWatchout,
    changeDriverSignal,
    managementSignal,
    recentPositionSignal,
    deteriorationStreakSignal,
    persistentSourceSignal,
    recentTrajectorySignal,
    benchmarkDepthSignal,
    benchmarkPositionSignal,
    opportunitySignal,
    executiveSummary,
    benchmarkSummary,
    recommendedActions,
    priorityActions: managementActions.priorityActions,
    biggestOpportunity: managementActions.biggestOpportunity,
    improvedAreas: managementActions.improvedAreas,
    watchAreas: managementActions.watchAreas,
    nextBestStep: managementActions.nextBestStep,
  };
}