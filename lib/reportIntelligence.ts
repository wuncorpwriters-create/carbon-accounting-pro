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

export function getIntensityBand(perEmployee: number | null): IntensityBand | null {
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
      action: "Target efficiency improvements in your highest-use activities.",
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
      )} kg CO₂e).`,
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
      )} kg CO₂e${
        percentage != null ? ` (${formatNumber(Math.abs(percentage), 1)}%)` : ""
      } compared with the previous month.`,
      action:
        "Preserve the reduction drivers and extend them to the next month.",
    };
  }

  return {
    label: "Worsening",
    tone: "negative",
    summary: `Total emissions rose by ${formatNumber(delta)} kg CO₂e${
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
  const validTotals = comparisonHistory
    .map((item) => item.total_emissions)
    .filter((value): value is number => value != null && !Number.isNaN(value));

  const baselineSource = validTotals.slice(-3);
  const periodsUsed = baselineSource.length;

  if (latestTotal == null || periodsUsed === 0) {
    return {
      label: "No baseline yet",
      tone: "neutral",
      summary:
        "More completed reporting periods are needed before a recent baseline can be established.",
      action: "Keep submitting monthly assessments to build a stronger operating baseline.",
      average: null,
      delta: null,
      percentage: null,
      periodsUsed,
    };
  }

  const average =
    baselineSource.reduce((sum, value) => sum + value, 0) / periodsUsed;
  const delta = latestTotal - average;
  const percentage = average > 0 ? (delta / average) * 100 : null;
  const nearThreshold = Math.max(average * 0.05, 10);

  if (Math.abs(delta) <= nearThreshold) {
    return {
      label: "Near baseline",
      tone: "neutral",
      summary: `Total emissions are broadly in line with your recent baseline of ${formatNumber(
        average
      )} kg CO₂e across ${periodsUsed} prior period${
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
        Math.abs(delta)
      )} kg CO₂e below your recent baseline${
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
      delta
    )} kg CO₂e above your recent baseline${
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

export function getExecutiveSummary(
  report: ReportRow | null,
  trend: TrendDirection,
  baselineComparison: BaselineComparison,
  dominantSource: DominantSource,
  intensityBand: IntensityBand | null
) {
  const period = formatPeriodLabel(report);

  if ((report?.total_emissions ?? 0) <= 0) {
    return `${period}: There is not yet enough emissions volume to generate a strong operational signal.`;
  }

  if (
    baselineComparison.label === "Above baseline" &&
    dominantSource.label === "Scope 2 dominant"
  ) {
    return `${period}: Total emissions are above your recent baseline and Scope 2 remains the main driver, so electricity reduction should be the first priority this month.`;
  }

  if (
    baselineComparison.label === "Above baseline" &&
    dominantSource.label === "Scope 1 dominant"
  ) {
    return `${period}: Total emissions are above your recent baseline and Scope 1 is the main driver, so fuel and equipment efficiency should be the first priority this month.`;
  }

  if (
    baselineComparison.label === "Below baseline" &&
    trend.label === "Improving"
  ) {
    return `${period}: Emissions are moving in the right direction, now sitting below your recent baseline. Focus on preserving the changes that produced this reduction.`;
  }

  if (
    trend.label === "Stable" &&
    intensityBand?.label === "High"
  ) {
    return `${period}: Emissions are broadly stable month to month, but intensity remains high, so efficiency per employee should become a priority.`;
  }

  if (dominantSource.label === "Balanced") {
    return `${period}: Emissions are spread fairly evenly across Scope 1 and Scope 2, so the next reduction step should address both fuel and electricity controls together.`;
  }

  return `${period}: ${trend.summary} ${dominantSource.summary}`;
}

export function getRecommendedActions(
  report: ReportRow | null,
  trend: TrendDirection,
  dominantSource: DominantSource,
  intensityBand: IntensityBand | null,
  perEmployee: number | null,
  baselineComparison?: BaselineComparison
) {
  const actions: string[] = [];
  const hasEmployeeCount = (report?.employee_count ?? 0) > 0;
  const hasElectricity = (report?.electricity_kwh ?? 0) > 0;
  const hasFuel = (report?.fuel_liters ?? 0) > 0;
  const limitedCoverage = !hasElectricity || !hasFuel;

  if (limitedCoverage) {
    actions.push(
      "Capture both electricity and fuel inputs consistently each month so comparisons, source analysis, and trend decisions stay reliable."
    );
  }

  if (
    baselineComparison?.label === "Above baseline" &&
    dominantSource.label === "Scope 2 dominant"
  ) {
    actions.push(
      "Make electricity reduction the first priority this month because total emissions are above baseline and purchased power remains the main driver."
    );
  } else if (
    baselineComparison?.label === "Above baseline" &&
    dominantSource.label === "Scope 1 dominant"
  ) {
    actions.push(
      "Make fuel and equipment efficiency the first priority this month because total emissions are above baseline and direct fuel use remains the main driver."
    );
  } else if (dominantSource.label === "Scope 2 dominant") {
    actions.push(
      "Prioritize electricity-saving actions first, since purchased power is currently the biggest emissions driver."
    );
  } else if (dominantSource.label === "Scope 1 dominant") {
    actions.push(
      "Prioritize fuel-saving actions first, since direct fuel use is currently the biggest emissions driver."
    );
  } else {
    actions.push(
      "Review fuel and electricity controls together, since neither source clearly dominates this month."
    );
  }

  if (trend.label === "Worsening" && baselineComparison?.label === "Above baseline") {
    actions.push(
      "Review what changed versus both last month and your recent baseline, then correct the single activity that added the most emissions."
    );
  } else if (trend.label === "Worsening") {
    actions.push(
      "Investigate what changed since the previous month and focus first on the activity that increased emissions most."
    );
  } else if (trend.label === "Improving" && baselineComparison?.label === "Below baseline") {
    actions.push(
      "Lock in the operational changes behind this better-than-baseline month and standardize them for the next reporting period."
    );
  } else if (trend.label === "Improving") {
    actions.push(
      "Lock in the changes that reduced emissions this month and repeat them in the next reporting month."
    );
  } else {
    actions.push(
      "Keep monitoring month by month so smaller operational changes are spotted before they become larger shifts."
    );
  }

  if (!hasEmployeeCount) {
    actions.push(
      "Add a valid employee count so benchmarking and emissions-per-employee tracking stay decision-useful."
    );
  } else if (perEmployee != null && intensityBand?.label === "High") {
    actions.push(
      "High emissions per employee suggests reduction actions should be prioritized immediately, even if total emissions look stable."
    );
  } else if (perEmployee != null && intensityBand?.label === "Moderate") {
    actions.push(
      "Moderate emissions per employee suggests targeted operational improvements could deliver quick gains."
    );
  } else if (!limitedCoverage) {
    actions.push(
      "Keep electricity, fuel, and employee inputs complete each month so benchmarking stays reliable."
    );
  }

  return Array.from(new Set(actions)).slice(0, 3);
}

export function getElectricityMethodLabel(method: string | null | undefined) {
  if (!method) return "Not recorded";
  if (method === "location-based") return "Location-based";
  if (method === "market-based") return "Market-based / supplier-specific";
  return method;
}

export function buildReportIntelligence(
  report: ReportRow | null,
  previousComparableReport: ReportRow | null,
  comparisonHistory: ReportRow[] = []
) {
  const perEmployee = getPerEmployee(report?.total_emissions, report?.employee_count);
  const intensityBand = getIntensityBand(perEmployee);
  const trend = getTrendDirection(report, previousComparableReport);
  const dominantSource = getDominantSource(report);
  const coverage = getCoverageLabel(report);
  const baselineComparison = getRecentBaselineComparison(report, comparisonHistory);
  const executiveSummary = getExecutiveSummary(
    report,
    trend,
    baselineComparison,
    dominantSource,
    intensityBand
  );
  const recommendedActions = getRecommendedActions(
    report,
    trend,
    dominantSource,
    intensityBand,
    perEmployee,
    baselineComparison
  );

  let benchmarkSummary =
    "Emissions per employee is unavailable. Add a valid employee count to benchmark this report.";

  if (perEmployee != null && intensityBand) {
    benchmarkSummary = `${intensityBand.label} intensity: ${formatNumber(
      perEmployee
    )} kg CO₂e per employee. ${intensityBand.action}`;
  }

  return {
    perEmployee,
    intensityBand,
    trend,
    dominantSource,
    coverage,
    baselineComparison,
    executiveSummary,
    benchmarkSummary,
    recommendedActions,
  };
}