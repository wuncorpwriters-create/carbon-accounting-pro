"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseClient } from "../../lib/supabaseClient";
import Card from "../../components/Card";
import {
  formatNumber,
  formatCarbonExactKg,
} from "../../lib/carbonFormat";
import {
  type ReportRow,
  type IntensityTone,
  type SignalTone,
  getPerEmployee,
  getIntensityBand,
  parseSortDate,
  compareReportsChronologically,
  buildReportIntelligence,
} from "../../lib/reportIntelligence";

const supabase = createSupabaseClient();

function formatKgValue(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return formatNumber(value, 2);
}

function formatKgFull(value: number | null | undefined) {
  return formatCarbonExactKg(value, 2);
}

function formatWhole(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return formatNumber(value, 0);
}

function formatKwh(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${formatNumber(value, 2)} kWh`;
}

function formatLiters(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${formatNumber(value, 2)} L`;
}

function getIntensityToneClass(tone: IntensityTone) {
  if (tone === "low") return "intensity-badge intensity-badge--low";
  if (tone === "moderate") return "intensity-badge intensity-badge--moderate";
  if (tone === "high") return "intensity-badge intensity-badge--high";
  return "intensity-badge";
}

function getSignalToneClass(tone: SignalTone) {
  if (tone === "positive") return "signal-chip signal-chip--positive";
  if (tone === "negative") return "signal-chip signal-chip--negative";
  return "signal-chip signal-chip--neutral";
}

function getBasePeriodLabel(report: ReportRow) {
  const raw = (report.period_label || report.reporting_period || "").trim();
  if (!raw) return null;

  const normalized = raw.replace(/\s+/g, " ").trim();

  if (/^[A-Za-z]{3,9}\s+\d{4}$/i.test(normalized)) {
    const [month, year] = normalized.split(" ");
    return `${month.slice(0, 3)} ${year}`;
  }

  if (/^\d{4}$/.test(normalized)) {
    return null;
  }

  if (/^\d{4}-\d{2}$/.test(normalized)) {
    const parsed = new Date(`${normalized}-01`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });
    }
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });
    }
    return null;
  }

  return normalized.length > 16 ? normalized.slice(0, 16) : normalized;
}

function getPeriodYear(report: ReportRow) {
  const parsed = parseSortDate(report);
  if (!parsed) return null;
  return parsed.getFullYear();
}

function buildChartPath(points: { x: number; y: number }[]) {
  if (!points.length) return "";

  return points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ");
}

function getDeltaTone(delta: number | null): SignalTone {
  if (delta == null || Number.isNaN(delta)) return "neutral";
  if (delta < 0) return "positive";
  if (delta > 0) return "negative";
  return "neutral";
}

function getMonthComparisonSummary(
  latest: ReportRow | null,
  previous: ReportRow | null
) {
  const latestTotal = latest?.total_emissions ?? null;
  const previousTotal = previous?.total_emissions ?? null;
  const latestLabel =
    latest?.period_label || latest?.reporting_period || "latest month";
  const previousLabel =
    previous?.period_label || previous?.reporting_period || "previous month";

  if (latestTotal == null || previousTotal == null) {
    return {
      absoluteDelta: null as number | null,
      percentDelta: null as number | null,
      tone: "neutral" as SignalTone,
      label: "No comparison yet",
      summary:
        "Add at least two completed reporting months to compare month-over-month performance.",
    };
  }

  const absoluteDelta = latestTotal - previousTotal;
  const percentDelta =
    previousTotal > 0 ? (absoluteDelta / previousTotal) * 100 : null;
  const tone = getDeltaTone(absoluteDelta);

  let label = `No change vs ${previousLabel}`;
  if (absoluteDelta < 0) label = `Down vs ${previousLabel}`;
  if (absoluteDelta > 0) label = `Up vs ${previousLabel}`;

  let summary = `${latestLabel} is ${formatKgFull(
    latestTotal
  )} compared with ${formatKgFull(previousTotal)} in ${previousLabel}.`;

  if (absoluteDelta < 0) {
    summary = `${latestLabel} is lower than ${previousLabel} by ${formatKgValue(
      Math.abs(absoluteDelta)
    )} kg CO₂e${
      percentDelta != null ? ` (${formatNumber(Math.abs(percentDelta), 1)}%)` : ""
    }.`;
  } else if (absoluteDelta > 0) {
    summary = `${latestLabel} is higher than ${previousLabel} by ${formatKgValue(
      absoluteDelta
    )} kg CO₂e${
      percentDelta != null ? ` (${formatNumber(percentDelta, 1)}%)` : ""
    }.`;
  }

  return {
    absoluteDelta,
    percentDelta,
    tone,
    label,
    summary,
  };
}

export default function DashboardPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const saved = params.get("saved") === "1";
    const month = params.get("month");

    if (!saved) return;

    setSuccessMessage(
      month
        ? `Assessment saved for ${month}. You can now review it in Dashboard, Reports, and Monthly Tracker.`
        : "Assessment saved. You can now review it in Dashboard, Reports, and Monthly Tracker."
    );

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
      window.history.replaceState({}, "", "/dashboard");
    }, 4000);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("report_results")
        .select(`
          id,
          created_at,
          reporting_period,
          period_label,
          employee_count,
          electricity_kwh,
          fuel_liters,
          scope1_emissions,
          scope2_emissions,
          total_emissions
        `)
        .order("id", { ascending: false })
        .limit(24);

      if (error) {
        console.error("Error loading dashboard:", error);
        setError("Failed to load dashboard data.");
        setReports([]);
      } else {
        setReports((data as ReportRow[]) || []);
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  async function handleDeleteReport(reportId: string) {
    const confirmed = window.confirm(
      "Delete this report? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeletingId(reportId);
    setError(null);

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Failed to delete report.");
      }

      setReports((current) => current.filter((report) => report.id !== reportId));
    } catch (err) {
      console.error("Dashboard delete failed:", err);
      setError("Failed to delete report.");
    } finally {
      setDeletingId(null);
    }
  }

  const chronologicalReports = useMemo(() => {
    const prepared = reports.map((report, index) => ({
      report,
      originalIndex: index,
      parsedDate: parseSortDate(report),
    }));

    prepared.sort((a, b) => {
      const ordered = compareReportsChronologically(
        { report: a.report, parsedDate: a.parsedDate },
        { report: b.report, parsedDate: b.parsedDate }
      );

      if (ordered !== 0) return ordered;
      return a.originalIndex - b.originalIndex;
    });

    return prepared.map((item) => item.report);
  }, [reports]);

  const latestReport =
    chronologicalReports[chronologicalReports.length - 1] ?? null;
  const previousReport =
    chronologicalReports[chronologicalReports.length - 2] ?? null;

  const currentYear = useMemo(() => {
    if (!latestReport) return new Date().getFullYear();
    return getPeriodYear(latestReport) ?? new Date().getFullYear();
  }, [latestReport]);

  const recentComparableReports = useMemo(() => {
    return chronologicalReports
      .filter((report) => report.total_emissions != null)
      .slice(-6);
  }, [chronologicalReports]);

  const yearReports = useMemo(() => {
    return chronologicalReports.filter(
      (report) => getPeriodYear(report) === currentYear
    );
  }, [chronologicalReports, currentYear]);

  const monthComparison = useMemo(() => {
    return getMonthComparisonSummary(latestReport, previousReport);
  }, [latestReport, previousReport]);

  const recentAverage = useMemo(() => {
    if (!recentComparableReports.length) return null;

    const total = recentComparableReports.reduce((sum, report) => {
      return sum + (report.total_emissions ?? 0);
    }, 0);

    return total / recentComparableReports.length;
  }, [recentComparableReports]);

  const bestPeriod = useMemo(() => {
    const comparable = chronologicalReports.filter(
      (report) => report.total_emissions != null
    );
    if (!comparable.length) return null;

    return comparable.reduce((best, current) => {
      const bestValue = best.total_emissions ?? Number.POSITIVE_INFINITY;
      const currentValue = current.total_emissions ?? Number.POSITIVE_INFINITY;
      return currentValue < bestValue ? current : best;
    });
  }, [chronologicalReports]);

  const worstPeriod = useMemo(() => {
    const comparable = chronologicalReports.filter(
      (report) => report.total_emissions != null
    );
    if (!comparable.length) return null;

    return comparable.reduce((worst, current) => {
      const worstValue = worst.total_emissions ?? Number.NEGATIVE_INFINITY;
      const currentValue = current.total_emissions ?? Number.NEGATIVE_INFINITY;
      return currentValue > worstValue ? current : worst;
    });
  }, [chronologicalReports]);

  const yearSummary = useMemo(() => {
    if (!yearReports.length) {
      return {
        total: null as number | null,
        average: null as number | null,
        periods: 0,
      };
    }

    const reportsWithTotals = yearReports.filter(
      (report) => report.total_emissions != null
    );

    if (!reportsWithTotals.length) {
      return {
        total: null as number | null,
        average: null as number | null,
        periods: yearReports.length,
      };
    }

    const total = reportsWithTotals.reduce((sum, report) => {
      return sum + (report.total_emissions ?? 0);
    }, 0);

    return {
      total,
      average: total / reportsWithTotals.length,
      periods: reportsWithTotals.length,
    };
  }, [yearReports]);

  const metrics = useMemo(() => {
    const latestTotal = latestReport?.total_emissions ?? 0;
    const latestScope1 = latestReport?.scope1_emissions ?? 0;
    const latestScope2 = latestReport?.scope2_emissions ?? 0;
    const latestEmployees = latestReport?.employee_count ?? null;
    const latestElectricity = latestReport?.electricity_kwh ?? null;
    const latestFuel = latestReport?.fuel_liters ?? null;

    const comparisonHistory = chronologicalReports
      .filter(
        (report) =>
          report.id !== latestReport?.id && report.total_emissions != null
      )
      .slice(-3);

    const intelligence = buildReportIntelligence(
      latestReport,
      previousReport,
      comparisonHistory
    );

    const intensityBand = intelligence.intensityBand ?? getIntensityBand(intelligence.perEmployee);

    return {
      latestTotal,
      latestScope1,
      latestScope2,
      latestEmployees,
      latestElectricity,
      latestFuel,
      perEmployee: intelligence.perEmployee,
      intensityBand,
      trend: intelligence.trend,
      dominantSource: intelligence.dominantSource,
      coverageLabel: intelligence.coverage,
      benchmarkLabel: intelligence.benchmarkSummary,
      baselineComparison: intelligence.baselineComparison,
      executiveSummary: intelligence.executiveSummary,
      recommendedActions: intelligence.recommendedActions,
    };
  }, [latestReport, previousReport, chronologicalReports]);

  const chartData = useMemo(() => {
    const filtered = chronologicalReports.filter(
      (report) => report.total_emissions != null
    );

    const labelCounts = new Map<string, number>();

    filtered.forEach((report, index) => {
      const base = getBasePeriodLabel(report) ?? `Period ${index + 1}`;
      labelCounts.set(base, (labelCounts.get(base) ?? 0) + 1);
    });

    const labelSeen = new Map<string, number>();

    return filtered.map((report, index) => {
      const base = getBasePeriodLabel(report) ?? `Period ${index + 1}`;
      const totalCount = labelCounts.get(base) ?? 1;
      const seen = (labelSeen.get(base) ?? 0) + 1;
      labelSeen.set(base, seen);

      const label = totalCount > 1 ? `${base} #${seen}` : base;

      return {
        id: report.id,
        label,
        fullLabel: label,
        total: report.total_emissions ?? 0,
        scope1: report.scope1_emissions ?? 0,
        scope2: report.scope2_emissions ?? 0,
      };
    });
  }, [chronologicalReports]);

  const recentReports = useMemo(() => {
    return [...chronologicalReports].reverse().slice(0, 5);
  }, [chronologicalReports]);

  const chart = useMemo(() => {
    const width = 760;
    const height = 280;
    const paddingTop = 24;
    const paddingRight = 24;
    const paddingBottom = 48;
    const paddingLeft = 56;

    const values = chartData.map((item) => item.total);
    const minValue = values.length ? Math.min(...values) : 0;
    const maxValue = values.length ? Math.max(...values) : 0;

    const paddedMin = Math.max(0, minValue * 0.9);
    const paddedMax =
      maxValue === 0
        ? 100
        : maxValue === minValue
        ? maxValue * 1.15
        : maxValue * 1.1;

    const range = paddedMax - paddedMin || 1;
    const usableWidth = width - paddingLeft - paddingRight;
    const usableHeight = height - paddingTop - paddingBottom;

    const points = values.map((value, index) => {
      const x =
        values.length === 1
          ? paddingLeft + usableWidth / 2
          : paddingLeft + (index / (values.length - 1)) * usableWidth;

      const y = paddingTop + ((paddedMax - value) / range) * usableHeight;

      return { x, y, value };
    });

    const path = buildChartPath(points);

    const ticks = [paddedMax, paddedMin + range / 2, paddedMin].map((value) => ({
      value,
      y: paddingTop + ((paddedMax - value) / range) * usableHeight,
    }));

    const latest = values.length ? values[values.length - 1] : null;

    return {
      width,
      height,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      points,
      path,
      min: minValue,
      max: maxValue,
      latest,
      ticks,
    };
  }, [chartData]);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p>Loading your latest carbon accounting overview...</p>
          </div>
        </div>

        <div className="dashboard-grid dashboard-grid--kpis">
          <Card>
            <p>Loading KPI cards...</p>
          </Card>
          <Card>
            <p>Loading KPI cards...</p>
          </Card>
          <Card>
            <p>Loading KPI cards...</p>
          </Card>
          <Card>
            <p>Loading KPI cards...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Track your latest emissions snapshot, benchmarking position, and
            month-over-month direction.
          </p>
        </div>

        <div className="page-actions">
          <Link href="/dashboard/assessment" className="button button-primary">
            Start New Assessment
          </Link>
          <Link href="/dashboard/reports" className="button button-secondary">
            View Reports
          </Link>
        </div>
      </div>

      <div className="workflow-strip">
        <span className="workflow-strip-label">Quick navigation</span>
        <div className="workflow-strip-links">
          <Link href="/dashboard" className="workflow-strip-link workflow-strip-link--current">
            Dashboard
          </Link>
          <Link href="/dashboard/assessment" className="workflow-strip-link">
            New Assessment
          </Link>
          <Link href="/dashboard/monthly-tracker" className="workflow-strip-link">
            Monthly Tracker
          </Link>
          <Link href="/dashboard/reports" className="workflow-strip-link">
            Reports
          </Link>
        </div>
      </div>

      {successMessage ? (
        <div className="status-banner status-banner-success status-banner-actionable">
          <div className="status-banner-copy">{successMessage}</div>
          <div className="status-banner-actions">
            <Link href="/dashboard/reports" className="button button-secondary">
              View Reports
            </Link>
            <Link href="/dashboard/monthly-tracker" className="button button-secondary">
              Open Monthly Tracker
            </Link>
            <Link href="/dashboard/assessment" className="button button-primary">
              New Assessment
            </Link>
          </div>
        </div>
      ) : null}

      {latestReport ? (
        <div className="latest-month-highlight latest-report-summary-strip">
          <div className="latest-report-summary-content">
            <p className="latest-month-highlight-eyebrow">Latest month added</p>
            <h2>
              {latestReport.period_label ||
                latestReport.reporting_period ||
                "Latest assessment"}
            </h2>
            <p className="latest-report-summary-subline">
              Latest data from{" "}
              <strong>
                {latestReport.period_label ||
                  latestReport.reporting_period ||
                  "Latest assessment"}
              </strong>
              .
            </p>
            <p>
              Your newest monthly submission is now reflected across Dashboard,
              Reports, and Monthly Tracker.
            </p>

            <div className="latest-report-summary-metrics">
              <div className="latest-report-summary-metric">
                <span className="latest-report-summary-label">Total emissions</span>
                <strong>{formatKgFull(latestReport.total_emissions)}</strong>
              </div>
              <div className="latest-report-summary-metric">
                <span className="latest-report-summary-label">Emissions / employee</span>
                <strong>
                  {formatKgFull(
                    getPerEmployee(
                      latestReport.total_emissions,
                      latestReport.employee_count
                    )
                  )}
                </strong>
              </div>
            </div>

            <div className="latest-month-highlight-actions latest-report-summary-actions">
              <Link
                href={`/dashboard/reports/${latestReport.id}`}
                className="button button-primary"
              >
                Open Latest Report
              </Link>
              <a
                href={`/api/reports/${latestReport.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="button button-secondary"
              >
                Download PDF
              </a>
              <Link
                href="/dashboard/monthly-tracker"
                className="button button-secondary"
              >
                See It in Tracker
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <Card>
          <p>{error}</p>
        </Card>
      ) : null}

      <div className="dashboard-grid dashboard-grid--kpis">
        <Card>
          <div className="kpi-card">
            <p className="kpi-label">Total Emissions</p>
            <div className="kpi-figure">
              <span className="kpi-number">{formatKgValue(metrics.latestTotal)}</span>
              <span className="kpi-unit">kg CO₂e</span>
            </div>
            <p className="kpi-subtext">
              {latestReport?.period_label ||
                latestReport?.reporting_period ||
                "No reporting month"}
            </p>
          </div>
        </Card>

        <Card>
          <div className="kpi-card">
            <p className="kpi-label">Scope 1 Emissions</p>
            <div className="kpi-figure">
              <span className="kpi-number">
                {formatKgValue(metrics.latestScope1)}
              </span>
              <span className="kpi-unit">kg CO₂e</span>
            </div>
            <p className="kpi-subtext">Fuel-based direct emissions</p>
          </div>
        </Card>

        <Card>
          <div className="kpi-card">
            <p className="kpi-label">Scope 2 Emissions</p>
            <div className="kpi-figure">
              <span className="kpi-number">
                {formatKgValue(metrics.latestScope2)}
              </span>
              <span className="kpi-unit">kg CO₂e</span>
            </div>
            <p className="kpi-subtext">Purchased electricity emissions</p>
          </div>
        </Card>

        <Card>
          <div className="kpi-card">
            <p className="kpi-label">Emissions / Employee</p>
            <div className="kpi-figure">
              <span className="kpi-number">
                {metrics.perEmployee == null
                  ? "—"
                  : formatNumber(metrics.perEmployee, 2)}
              </span>
              {metrics.perEmployee != null ? (
                <span className="kpi-unit">kg CO₂e</span>
              ) : null}
            </div>
            <p className="kpi-subtext">
              {metrics.intensityBand ? (
                <>
                  <span className={getIntensityToneClass(metrics.intensityBand.tone)}>
                    {metrics.intensityBand.label} intensity
                  </span>
                  {" · "}
                  {formatWhole(metrics.latestEmployees)} employees
                </>
              ) : (
                "Add employee count in assessments to enable this KPI"
              )}
            </p>
          </div>
        </Card>
      </div>

      <div className="dashboard-grid dashboard-grid--kpis">
        <Card>
          <div className="kpi-card">
            <p className="kpi-label">Change vs Previous</p>
            <div className="kpi-figure">
              <span className="kpi-number">
                {monthComparison.absoluteDelta == null
                  ? "—"
                  : monthComparison.absoluteDelta > 0
                  ? `+${formatKgValue(monthComparison.absoluteDelta)}`
                  : monthComparison.absoluteDelta < 0
                  ? `-${formatKgValue(Math.abs(monthComparison.absoluteDelta))}`
                  : "0"}
              </span>
              {monthComparison.absoluteDelta != null ? (
                <span className="kpi-unit">kg CO₂e</span>
              ) : null}
            </div>
            <p className="kpi-subtext">
              {monthComparison.percentDelta != null ? (
                <span className={getSignalToneClass(monthComparison.tone)}>
                  {monthComparison.label} ·{" "}
                  {monthComparison.percentDelta > 0 ? "+" : ""}
                  {formatNumber(monthComparison.percentDelta, 1)}%
                </span>
              ) : (
                <span className={getSignalToneClass(monthComparison.tone)}>
                  {monthComparison.label}
                </span>
              )}
            </p>
          </div>
        </Card>

        <Card>
          <div className="kpi-card">
            <p className="kpi-label">Recent Average</p>
            <div className="kpi-figure">
              <span className="kpi-number">
                {recentAverage == null ? "—" : formatKgValue(recentAverage)}
              </span>
              {recentAverage != null ? (
                <span className="kpi-unit">kg CO₂e</span>
              ) : null}
            </div>
            <p className="kpi-subtext">
              Average across last {recentComparableReports.length || 0} months
            </p>
          </div>
        </Card>

        <Card>
          <div className="kpi-card">
            <p className="kpi-label">Best Month</p>
            <div className="kpi-figure">
              <span className="kpi-number">
                {bestPeriod?.total_emissions == null
                  ? "—"
                  : formatKgValue(bestPeriod.total_emissions)}
              </span>
              {bestPeriod?.total_emissions != null ? (
                <span className="kpi-unit">kg CO₂e</span>
              ) : null}
            </div>
            <p className="kpi-subtext">
              {bestPeriod?.period_label ||
                bestPeriod?.reporting_period ||
                "Not enough history"}
            </p>
          </div>
        </Card>

        <Card>
          <div className="kpi-card">
            <p className="kpi-label">Worst Month</p>
            <div className="kpi-figure">
              <span className="kpi-number">
                {worstPeriod?.total_emissions == null
                  ? "—"
                  : formatKgValue(worstPeriod.total_emissions)}
              </span>
              {worstPeriod?.total_emissions != null ? (
                <span className="kpi-unit">kg CO₂e</span>
              ) : null}
            </div>
            <p className="kpi-subtext">
              {worstPeriod?.period_label ||
                worstPeriod?.reporting_period ||
                "Not enough history"}
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="section-header">
          <div>
            <h3>{currentYear} Summary</h3>
            <p className="chart-meta-label">
              Current reporting-year rollup based on available months.
            </p>
          </div>
        </div>

        {yearSummary.periods === 0 ? (
          <p>No reports in {currentYear} yet.</p>
        ) : (
          <div className="reports-table">
            <div className="reports-table-head reports-table-head--three">
              <span>Months</span>
              <span>Total Emissions</span>
              <span>Average / Month</span>
            </div>

            <div className="reports-table-row reports-table-row--three">
              <span>{yearSummary.periods}</span>
              <span>{formatKgFull(yearSummary.total)}</span>
              <span>{formatKgFull(yearSummary.average)}</span>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <div className="section-header">
          <div>
            <h3>Total Emissions Trend</h3>
            <p className="chart-meta-label">
              Y-axis: Total emissions (kg CO₂e) · X-axis: Reporting months
            </p>
          </div>
        </div>

        {chartData.length < 2 ? (
          <p>Complete at least two assessments to view a trend chart.</p>
        ) : (
          <div className="trend-chart-wrap">
            <div className="trend-chart-summary">
              <div className="trend-chart-stat">
                <span className="trend-chart-stat-label">Latest</span>
                <strong>
                  {chart.latest == null ? "—" : formatKgFull(chart.latest)}
                </strong>
              </div>
              <div className="trend-chart-stat">
                <span className="trend-chart-stat-label">Range</span>
                <strong>
                  {formatKgValue(chart.min)} - {formatKgValue(chart.max)} kg CO₂e
                </strong>
              </div>
              <div className="trend-chart-stat">
                <span className="trend-chart-stat-label">Months</span>
                <strong>{chartData.length}</strong>
              </div>
            </div>

            <div className="trend-chart">
              <svg
                viewBox={`0 0 ${chart.width} ${chart.height}`}
                role="img"
                aria-label="Total emissions trend over recent reporting months"
                preserveAspectRatio="none"
              >
                {chart.ticks.map((tick, index) => (
                  <g key={`tick-${index}`}>
                    <line
                      x1={chart.paddingLeft}
                      y1={tick.y}
                      x2={chart.width - chart.paddingRight}
                      y2={tick.y}
                      className="trend-chart-grid"
                    />
                    <text
                      x={chart.paddingLeft - 10}
                      y={tick.y + 4}
                      textAnchor="end"
                      className="trend-chart-y-label"
                    >
                      {formatNumber(tick.value, 0)}
                    </text>
                  </g>
                ))}

                <line
                  x1={chart.paddingLeft}
                  y1={chart.paddingTop}
                  x2={chart.paddingLeft}
                  y2={chart.height - chart.paddingBottom}
                  className="trend-chart-axis"
                />
                <line
                  x1={chart.paddingLeft}
                  y1={chart.height - chart.paddingBottom}
                  x2={chart.width - chart.paddingRight}
                  y2={chart.height - chart.paddingBottom}
                  className="trend-chart-axis"
                />

                <path d={chart.path} className="trend-chart-line" />

                {chart.points.map((point, index) => (
                  <g key={`${chartData[index].id}-point`}>
                    <line
                      x1={point.x}
                      y1={chart.height - chart.paddingBottom}
                      x2={point.x}
                      y2={chart.height - chart.paddingBottom + 6}
                      className="trend-chart-axis"
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      className="trend-chart-point"
                    />
                    <text
                      x={point.x}
                      y={chart.height - 18}
                      textAnchor="middle"
                      className="trend-chart-x-label"
                    >
                      {chartData[index].label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div className="trend-chart-labels">
              {chartData.map((item) => (
                <div key={item.id} className="trend-chart-label-item">
                  <span className="trend-chart-label-period">{item.fullLabel}</span>
                  <span className="trend-chart-label-value">
                    {formatKgValue(item.total)} kg CO₂e
                  </span>
                </div>
              ))}
            </div>

            <div className="section-header" style={{ marginTop: "8px" }}>
              <div>
                <h3>Scope 1 vs Scope 2 Breakdown</h3>
                <p className="chart-meta-label">
                  Compare direct fuel emissions against purchased electricity by
                  month.
                </p>
              </div>
            </div>

            <div className="scope-breakdown-list">
              {chartData.map((item) => {
                const total = item.total || 0;
                const scope1Share = total > 0 ? (item.scope1 / total) * 100 : 0;
                const scope2Share = total > 0 ? (item.scope2 / total) * 100 : 0;

                return (
                  <div key={`${item.id}-breakdown`} className="scope-breakdown-item">
                    <div className="scope-breakdown-top">
                      <span className="scope-breakdown-period">{item.fullLabel}</span>
                      <span className="scope-breakdown-total">
                        Total: {formatKgValue(item.total)} kg CO₂e
                      </span>
                    </div>

                    <div className="scope-breakdown-bar">
                      <div
                        className="scope-breakdown-segment scope-breakdown-segment--scope1"
                        style={{ width: `${scope1Share}%` }}
                        title={`Scope 1: ${formatKgValue(item.scope1)} kg CO₂e`}
                      />
                      <div
                        className="scope-breakdown-segment scope-breakdown-segment--scope2"
                        style={{ width: `${scope2Share}%` }}
                        title={`Scope 2: ${formatKgValue(item.scope2)} kg CO₂e`}
                      />
                    </div>

                    <div className="scope-breakdown-meta">
                      <span className="scope-breakdown-chip scope-breakdown-chip--scope1">
                        Scope 1: {formatKgValue(item.scope1)} kg CO₂e
                      </span>
                      <span className="scope-breakdown-chip scope-breakdown-chip--scope2">
                        Scope 2: {formatKgValue(item.scope2)} kg CO₂e
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <div className="dashboard-grid dashboard-grid--main">
        <Card>
          <div className="section-header">
            <h3>Latest Assessment</h3>
          </div>

          {latestReport ? (
            <div className="details-list">
              <div className="details-row">
                <span>Reporting Month</span>
                <strong>
                  {latestReport.period_label ||
                    latestReport.reporting_period ||
                    "—"}
                </strong>
              </div>
              <div className="details-row">
                <span>Employees</span>
                <strong>{formatWhole(latestReport.employee_count)}</strong>
              </div>
              <div className="details-row">
                <span>Electricity Use</span>
                <strong>{formatKwh(metrics.latestElectricity)}</strong>
              </div>
              <div className="details-row">
                <span>Fuel Use</span>
                <strong>{formatLiters(metrics.latestFuel)}</strong>
              </div>
              <div className="details-row">
                <span>Total Emissions</span>
                <strong>{formatKgFull(latestReport.total_emissions)}</strong>
              </div>
              <div className="details-row">
                <span>Emissions / Employee</span>
                <strong>
                  {metrics.perEmployee == null
                    ? "—"
                    : `${formatNumber(metrics.perEmployee, 2)} kg CO₂e`}
                </strong>
              </div>
              <div className="details-row">
                <span>Trend Direction</span>
                <strong>
                  <span className={getSignalToneClass(metrics.trend.tone)}>
                    {metrics.trend.label}
                  </span>
                </strong>
              </div>
              <div className="details-row">
                <span>Dominant Source</span>
                <strong>{metrics.dominantSource.label}</strong>
              </div>
              <div className="details-row">
                <span>Vs Previous Month</span>
                <strong>
                  <span className={getSignalToneClass(monthComparison.tone)}>
                    {monthComparison.absoluteDelta == null
                      ? "No comparison yet"
                      : monthComparison.absoluteDelta > 0
                      ? `+${formatKgValue(monthComparison.absoluteDelta)} kg CO₂e`
                      : monthComparison.absoluteDelta < 0
                      ? `-${formatKgValue(
                          Math.abs(monthComparison.absoluteDelta)
                        )} kg CO₂e`
                      : "No change"}
                  </span>
                </strong>
              </div>

              <div className="section-actions">
                <Link
                  href={`/dashboard/reports/${latestReport.id}`}
                  className="button button-secondary"
                >
                  Open Latest Report
                </Link>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>No monthly assessments yet.</p>
              <p>
                Start your first monthly assessment to generate a report, track
                emissions over time, and unlock benchmarking, trends, and PDF export.
              </p>
              <div
                className="page-actions"
                style={{ justifyContent: "center", marginTop: "12px" }}
              >
                <Link href="/dashboard/assessment" className="button button-primary">
                  Start First Monthly Assessment
                </Link>
                <Link href="/dashboard/reports" className="button button-secondary">
                  View Reports
                </Link>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="section-header">
            <h3>Insights</h3>
          </div>

          {latestReport ? (
            <div className="insights-list">
              <div className="insight-item">
                <strong>Executive summary</strong>
                <p>{metrics.executiveSummary}</p>
              </div>

              <div className="insight-item">
                <strong>
                  Trend{" "}
                  <span className={getSignalToneClass(metrics.trend.tone)}>
                    {metrics.trend.label}
                  </span>
                </strong>
                <p>{metrics.trend.summary}</p>
              </div>

              <div className="insight-item">
                <strong>Monthly comparison</strong>
                <p>{monthComparison.summary}</p>
              </div>

              <div className="insight-item">
                <strong>
                  Benchmark{" "}
                  {metrics.intensityBand ? (
                    <span className={getIntensityToneClass(metrics.intensityBand.tone)}>
                      {metrics.intensityBand.label}
                    </span>
                  ) : null}
                </strong>
                <p>{metrics.benchmarkLabel}</p>
              </div>

              <div className="insight-item">
                <strong>Dominant source</strong>
                <p>{metrics.dominantSource.summary}</p>
              </div>

              <div className="insight-item">
                <strong>Recent baseline</strong>
                <p>{metrics.baselineComparison.summary}</p>
              </div>

              <div className="insight-item">
                <strong>Input coverage</strong>
                <p>{metrics.coverageLabel}</p>
              </div>

              <div className="insight-item">
                <strong>Recommended next actions</strong>
                <ul className="recommendation-list">
                  {metrics.recommendedActions.map((item, index) => (
                    <li key={`dashboard-action-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p>Complete an assessment to unlock dashboard insights.</p>
          )}
        </Card>
      </div>

      <Card>
        <div className="section-header">
          <h3>Recent Reports</h3>
        </div>

        {recentReports.length === 0 ? (
          <p>No reports available yet.</p>
        ) : (
          <div className="reports-table">
            <div className="reports-table-head reports-table-head--three">
              <span>Month</span>
              <span>Total Emissions</span>
              <span>Emissions / Employee</span>
            </div>

            {recentReports.map((report, index) => {
              const rowPerEmployee = getPerEmployee(
                report.total_emissions,
                report.employee_count
              );
              const rowIntensityBand = getIntensityBand(rowPerEmployee);
              const isLatestReport = index === 0;

              return (
                <div
                  key={report.id}
                  className={`reports-table-row reports-table-row--three ${
                    isLatestReport ? "reports-table-row--latest-dashboard" : ""
                  }`}
                >
                  <span>
                    <div className="dashboard-report-period">
                      <span>{report.period_label || report.reporting_period || "—"}</span>
                      {isLatestReport ? (
                        <span className="tracker-latest-badge">Latest</span>
                      ) : null}
                    </div>
                    <div className="report-row-actions">
                      <Link
                        href={`/dashboard/reports/${report.id}`}
                        className="report-row-action report-row-action--open"
                      >
                        Open
                      </Link>
                      <a
                        href={`/api/reports/${report.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        PDF
                      </a>
                      <button
                        type="button"
                        className="report-row-action report-row-action--delete"
                        onClick={() => handleDeleteReport(report.id)}
                        disabled={deletingId === report.id}
                      >
                        {deletingId === report.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </span>
                  <span>{formatKgFull(report.total_emissions)}</span>
                  <span>
                    {rowPerEmployee == null ? (
                      "—"
                    ) : (
                      <>
                        {formatNumber(rowPerEmployee, 2)} kg CO₂e
                        {rowIntensityBand ? (
                          <>
                            {" "}
                            ·{" "}
                            <span className={getIntensityToneClass(rowIntensityBand.tone)}>
                              {rowIntensityBand.label}
                            </span>
                          </>
                        ) : null}
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
