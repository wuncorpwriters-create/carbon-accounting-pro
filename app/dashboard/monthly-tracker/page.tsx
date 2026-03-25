"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseClient } from "../../../lib/supabaseClient";
import Card from "../../../components/Card";
import {
  formatNumber,
  formatCarbonExactKg,
} from "../../../lib/carbonFormat";
import {
  sortReportsChronologically,
  buildReportIntelligence,
  getComparisonSummary,
  type ReportRow,
} from "../../../lib/reportIntelligence";

const supabase = createSupabaseClient();

function formatKgValue(value: number | null | undefined) {
  return formatCarbonExactKg(value, 2);
}

function formatDisplayDate(dateString: string | null | undefined) {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getSelectedYearLabel(selectedYear: string) {
  return selectedYear === "all" ? "All years" : selectedYear;
}

function formatPeriodLabel(report: ReportRow) {
  if (report.period_label && report.period_label.trim()) {
    return report.period_label.trim();
  }

  if (report.reporting_period && report.reporting_period.trim()) {
    return report.reporting_period.trim();
  }

  return formatDisplayDate(report.created_at);
}

function getPeriodYear(report: ReportRow) {
  const label = formatPeriodLabel(report);

  const monthYearMatch = label.match(/\b([A-Za-z]{3,9})\s+(\d{4})\b/);
  if (monthYearMatch) {
    return Number(monthYearMatch[2]);
  }

  const isoMonthMatch = label.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (isoMonthMatch) {
    return Number(isoMonthMatch[1]);
  }

  if (report.created_at) {
    const created = new Date(report.created_at);
    if (!Number.isNaN(created.getTime())) {
      return created.getFullYear();
    }
  }

  return null;
}

function getPerEmployee(
  total: number | null | undefined,
  employees: number | null | undefined
) {
  if (total == null || employees == null || employees <= 0) return null;
  return total / employees;
}

function getSignalToneClass(tone: "positive" | "negative" | "neutral") {
  if (tone === "positive") return "signal-chip signal-chip--positive";
  if (tone === "negative") return "signal-chip signal-chip--negative";
  return "signal-chip signal-chip--neutral";
}

export default function MonthlyTrackerPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadReports() {
      setLoading(true);

      const { data, error } = await supabase
        .from("report_results")
        .select(`
          id,
          period_label,
          reporting_period,
          total_emissions,
          scope1_emissions,
          scope2_emissions,
          employee_count,
          electricity_kwh,
          fuel_liters,
          created_at
        `)
        .order("id", { ascending: false });

      if (error) {
        console.error("Error loading monthly tracker:", error);
        setErrorMessage("Failed to load monthly tracker data.");
        setReports([]);
      } else {
        setReports((data as ReportRow[]) || []);
      }

      setLoading(false);
    }

    loadReports();
  }, []);

  useEffect(() => {
    if (!errorMessage) return;

    const timer = window.setTimeout(() => {
      setErrorMessage("");
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [errorMessage]);

  async function handleDeleteReport(reportId: string) {
    const confirmed = window.confirm(
      "Delete this monthly report? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeletingId(reportId);
      setErrorMessage("");

      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete report.");
      }

      setReports((current) => current.filter((report) => report.id !== reportId));
    } catch (error) {
      console.error("Delete report failed:", error);
      setErrorMessage("Unable to delete this report right now. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  const chronologicalReports = useMemo(() => {
    return sortReportsChronologically(reports);
  }, [reports]);

  const availableYears = useMemo(() => {
    return Array.from(
      new Set(
        chronologicalReports
          .map((report) => getPeriodYear(report))
          .filter((year): year is number => year != null)
      )
    ).sort((a, b) => b - a);
  }, [chronologicalReports]);

  useEffect(() => {
    if (availableYears.length === 0) {
      if (selectedYear !== "all") {
        setSelectedYear("all");
      }
      return;
    }

    const latestYear = String(availableYears[0]);

    if (!selectedYear) {
      setSelectedYear(latestYear);
      return;
    }

    if (
      selectedYear !== "all" &&
      !availableYears.some((year) => String(year) === selectedYear)
    ) {
      setSelectedYear(latestYear);
    }
  }, [availableYears, selectedYear]);

  const filteredReports = useMemo(() => {
    if (selectedYear === "all") return chronologicalReports;

    return chronologicalReports.filter(
      (report) => String(getPeriodYear(report)) === selectedYear
    );
  }, [chronologicalReports, selectedYear]);

  const summary = useMemo(() => {
    const reportsWithTotals = filteredReports.filter(
      (report) => report.total_emissions != null
    );

    if (!reportsWithTotals.length) {
      return {
        periods: 0,
        total: null as number | null,
        average: null as number | null,
        best: null as ReportRow | null,
        worst: null as ReportRow | null,
        latest: null as ReportRow | null,
        previous: null as ReportRow | null,
      };
    }

    const total = reportsWithTotals.reduce(
      (sum, report) => sum + (report.total_emissions ?? 0),
      0
    );

    const best = reportsWithTotals.reduce((lowest, current) => {
      const lowestValue = lowest.total_emissions ?? Number.POSITIVE_INFINITY;
      const currentValue = current.total_emissions ?? Number.POSITIVE_INFINITY;
      return currentValue < lowestValue ? current : lowest;
    });

    const worst = reportsWithTotals.reduce((highest, current) => {
      const highestValue = highest.total_emissions ?? Number.NEGATIVE_INFINITY;
      const currentValue = current.total_emissions ?? Number.NEGATIVE_INFINITY;
      return currentValue > highestValue ? current : highest;
    });

    const latest = reportsWithTotals[reportsWithTotals.length - 1] ?? null;
    const previous =
      reportsWithTotals.length > 1
        ? reportsWithTotals[reportsWithTotals.length - 2]
        : null;

    return {
      periods: reportsWithTotals.length,
      total,
      average: total / reportsWithTotals.length,
      best,
      worst,
      latest,
      previous,
    };
  }, [filteredReports]);

  const periodComparison = useMemo(() => {
    const latestTotal = summary.latest?.total_emissions ?? null;
    const previousTotal = summary.previous?.total_emissions ?? null;

    if (latestTotal == null || previousTotal == null) {
      return {
        delta: null as number | null,
        percent: null as number | null,
        label: "Need more history",
      };
    }

    const delta = latestTotal - previousTotal;
    const percent = previousTotal > 0 ? (delta / previousTotal) * 100 : null;

    if (delta < 0) {
      return {
        delta,
        percent,
        label: "Lower than previous month",
      };
    }

    if (delta > 0) {
      return {
        delta,
        percent,
        label: "Higher than previous month",
      };
    }

    return {
      delta,
      percent,
      label: "Same as previous month",
    };
  }, [summary]);

  const trackerComparisonHistory = useMemo(() => {
    if (!summary.latest) return [];

    return filteredReports
      .filter(
        (report) =>
          report.id !== summary.latest?.id && report.total_emissions != null
      )
      .slice(-6);
  }, [filteredReports, summary.latest]);

  const trackerIntelligence = useMemo(() => {
    return buildReportIntelligence(
      summary.latest,
      summary.previous,
      trackerComparisonHistory
    );
  }, [summary.latest, summary.previous, trackerComparisonHistory]);

  const trackerComparisonSummary = useMemo(() => {
    return getComparisonSummary(summary.latest, summary.previous);
  }, [summary.latest, summary.previous]);

  const rankedReports = useMemo(() => {
    return [...filteredReports]
      .filter((report) => report.total_emissions != null)
      .sort((a, b) => {
        const totalA = a.total_emissions ?? Number.POSITIVE_INFINITY;
        const totalB = b.total_emissions ?? Number.POSITIVE_INFINITY;
        return totalA - totalB;
      });
  }, [filteredReports]);

  const recentReports = useMemo(() => {
    return [...filteredReports].reverse();
  }, [filteredReports]);

  const comparisonByReportId = useMemo(() => {
    const map = new Map<
      string,
      {
        delta: number | null;
        percent: number | null;
        tone: "positive" | "negative" | "neutral";
        label: string;
      }
    >();

    filteredReports.forEach((report, index) => {
      const previous = index > 0 ? filteredReports[index - 1] : null;
      const currentTotal = report.total_emissions ?? null;
      const previousTotal = previous?.total_emissions ?? null;
      const previousLabel = previous ? formatPeriodLabel(previous) : "previous month";

      if (currentTotal == null || previousTotal == null) {
        map.set(report.id, {
          delta: null,
          percent: null,
          tone: "neutral",
          label: "Need previous month",
        });
        return;
      }

      const delta = currentTotal - previousTotal;
      const percent = previousTotal > 0 ? (delta / previousTotal) * 100 : null;

      if (delta < 0) {
        map.set(report.id, {
          delta,
          percent,
          tone: "positive",
          label:
            percent == null
              ? `Down vs ${previousLabel}`
              : `Down vs ${previousLabel} · ${formatNumber(Math.abs(percent), 1)}%`,
        });
        return;
      }

      if (delta > 0) {
        map.set(report.id, {
          delta,
          percent,
          tone: "negative",
          label:
            percent == null
              ? `Up vs ${previousLabel}`
              : `Up vs ${previousLabel} · ${formatNumber(percent, 1)}%`,
        });
        return;
      }

      map.set(report.id, {
        delta,
        percent,
        tone: "neutral",
        label: `Flat vs ${previousLabel}`,
      });
    });

    return map;
  }, [filteredReports]);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Monthly Emissions Tracker</h1>
          <p>
            Review reporting months, compare totals over time, and identify your
            best and worst months faster.
          </p>
        </div>

        <div className="page-actions">
          <Link href="/dashboard/assessment" className="button button-primary">
            New Assessment
          </Link>
          <Link href="/dashboard/reports" className="button button-secondary">
            View Reports
          </Link>
        </div>
      </div>

      <div className="workflow-strip">
        <span className="workflow-strip-label">Quick navigation</span>
        <div className="workflow-strip-links">
          <Link href="/dashboard" className="workflow-strip-link">
            Dashboard
          </Link>
          <Link href="/dashboard/assessment" className="workflow-strip-link">
            New Assessment
          </Link>
          <Link
            href="/dashboard/monthly-tracker"
            className="workflow-strip-link workflow-strip-link--current"
          >
            Monthly Tracker
          </Link>
          <Link href="/dashboard/reports" className="workflow-strip-link">
            Reports
          </Link>
        </div>
      </div>

      {errorMessage ? (
        <div className="status-banner status-banner-error">{errorMessage}</div>
      ) : null}

      {loading ? (
        <Card>
          <p>Loading tracker data...</p>
        </Card>
      ) : null}

      {!loading && reports.length === 0 ? (
        <>
          <section className="dashboard-onboarding-hero tracker-onboarding-hero">
            <div className="dashboard-onboarding-copy">
              <p className="dashboard-onboarding-eyebrow">Monthly tracker</p>
              <h2>Track month-vs-month movement once you start building history.</h2>
              <p className="dashboard-onboarding-lead">
                The tracker becomes valuable after your first reporting months are
                in place. It helps you review changes over time, spot your best
                and worst months, and understand whether the latest month is
                improving, worsening, or staying near baseline.
              </p>

              <div className="dashboard-onboarding-actions">
                <Link href="/dashboard/assessment" className="button button-primary">
                  Start First Monthly Assessment
                </Link>
                <Link href="/dashboard/reports" className="button button-secondary">
                  See Where Reports Appear
                </Link>
              </div>
            </div>

            <div className="dashboard-onboarding-checklist">
              <div className="dashboard-onboarding-checklist-card">
                <strong>What this page shows later</strong>
                <ul className="recommendation-list recommendation-list--compact">
                  <li>Months in view for a selected year or all years</li>
                  <li>Best and worst reporting months</li>
                  <li>Average emissions across the months in view</li>
                  <li>Month-vs-month movement cues</li>
                </ul>
              </div>

              <div className="dashboard-onboarding-checklist-card">
                <strong>Why it matters</strong>
                <ul className="recommendation-list recommendation-list--compact">
                  <li>See whether the latest month is improving</li>
                  <li>Build a simple operating baseline over time</li>
                  <li>Review months in ranked and chronological order</li>
                  <li>Strengthen your reporting rhythm month by month</li>
                </ul>
              </div>
            </div>
          </section>

          <div className="dashboard-grid dashboard-grid--kpis">
            <Card>
              <div className="kpi-card">
                <p className="kpi-label">Months in View</p>
                <div className="kpi-figure">
                  <span className="kpi-number">—</span>
                </div>
                <p className="kpi-subtext">Populates after your first months are added</p>
              </div>
            </Card>

            <Card>
              <div className="kpi-card">
                <p className="kpi-label">Average Emissions</p>
                <div className="kpi-figure">
                  <span className="kpi-number">—</span>
                </div>
                <p className="kpi-subtext">Average per selected month range</p>
              </div>
            </Card>

            <Card>
              <div className="kpi-card">
                <p className="kpi-label">Best Month</p>
                <div className="kpi-figure">
                  <span className="kpi-number">—</span>
                </div>
                <p className="kpi-subtext">Lowest emissions month in view</p>
              </div>
            </Card>

            <Card>
              <div className="kpi-card">
                <p className="kpi-label">Worst Month</p>
                <div className="kpi-figure">
                  <span className="kpi-number">—</span>
                </div>
                <p className="kpi-subtext">Highest emissions month in view</p>
              </div>
            </Card>
          </div>

          <div className="dashboard-grid dashboard-grid--main">
            <Card>
              <div className="section-header">
                <div>
                  <h3>How month-vs-month cues work</h3>
                  <p className="chart-meta-label">
                    The tracker becomes more useful after month two.
                  </p>
                </div>
              </div>

              <div className="insights-list">
                <div className="insight-item">
                  <strong>Down vs previous month</strong>
                  <p>
                    A lower latest month usually signals improvement relative to
                    the prior reporting month.
                  </p>
                </div>

                <div className="insight-item">
                  <strong>Up vs previous month</strong>
                  <p>
                    A higher latest month can indicate increased activity,
                    higher energy use, or a change in fuel usage.
                  </p>
                </div>

                <div className="insight-item">
                  <strong>Need previous month</strong>
                  <p>
                    The tracker needs at least two chronological months before
                    direct month-vs-month cues can appear.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="section-header">
                <div>
                  <h3>What gets stronger over time</h3>
                  <p className="chart-meta-label">
                    Repeated monthly reporting creates baseline context.
                  </p>
                </div>
              </div>

              <div className="insights-list">
                <div className="insight-item">
                  <strong>Better ranked views</strong>
                  <p>
                    You can quickly see your lowest and highest emissions months
                    instead of reviewing reports one by one.
                  </p>
                </div>

                <div className="insight-item">
                  <strong>Cleaner review rhythm</strong>
                  <p>
                    A monthly cadence makes it easier to detect operational
                    changes earlier.
                  </p>
                </div>

                <div className="insight-item">
                  <strong>More reliable baseline context</strong>
                  <p>
                    As reporting history grows, the tracker becomes a stronger
                    operational review tool instead of a one-off snapshot.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="section-header">
              <div>
                <h3>What you do here later</h3>
                <p className="chart-meta-label">
                  Use the tracker as your ongoing monthly review layer.
                </p>
              </div>
            </div>

            <div className="dashboard-onboarding-benefits">
              <div className="dashboard-onboarding-benefit">
                <strong>Review ranked months</strong>
                <p>
                  Open the lowest and highest months quickly to understand what
                  changed.
                </p>
              </div>

              <div className="dashboard-onboarding-benefit">
                <strong>Monitor the latest month</strong>
                <p>
                  Check whether the newest reporting month improved or worsened
                  against the one before it.
                </p>
              </div>

              <div className="dashboard-onboarding-benefit">
                <strong>Keep building history</strong>
                <p>
                  Every added month improves the quality of your tracker view
                  and later reporting decisions.
                </p>
              </div>
            </div>
          </Card>
        </>
      ) : null}

      {!loading && reports.length > 0 ? (
        <>
          <div className="year-summary-bar">
            <div className="year-summary-bar-header">
              <div>
                <p className="year-summary-bar-eyebrow">Reporting view</p>
                <h2>{getSelectedYearLabel(selectedYear)}</h2>
              </div>
              <div className="year-summary-bar-status">
                <span className="filter-status-label">Year view</span>
                <span className="filter-status-chip">
                  {getSelectedYearLabel(selectedYear)}
                </span>
              </div>
            </div>

            <p className="chart-meta-label">
              Snapshot based on the reporting months currently in view.
            </p>

            <div className="year-summary-bar-grid">
              <div className="year-summary-bar-card">
                <span className="year-summary-bar-label">Months in View</span>
                <strong>{summary.periods}</strong>
              </div>

              <div className="year-summary-bar-card">
                <span className="year-summary-bar-label">Total Emissions</span>
                <strong>{formatKgValue(summary.total)}</strong>
              </div>

              <div className="year-summary-bar-card">
                <span className="year-summary-bar-label">Average / Month</span>
                <strong>{formatKgValue(summary.average)}</strong>
              </div>

              <div className="year-summary-bar-card">
                <span className="year-summary-bar-label">Lowest Month</span>
                <strong>{summary.best ? formatPeriodLabel(summary.best) : "—"}</strong>
              </div>

              <div className="year-summary-bar-card">
                <span className="year-summary-bar-label">Highest Month</span>
                <strong>{summary.worst ? formatPeriodLabel(summary.worst) : "—"}</strong>
              </div>
            </div>
          </div>

          {summary.latest ? (
            <div className="latest-month-highlight">
              <div className="latest-month-highlight-copy">
                <p className="latest-month-highlight-eyebrow">Latest month added</p>
                <h2>{formatPeriodLabel(summary.latest)}</h2>
                <p>
                  This is the freshest reporting month in your tracker and is now
                  included in your comparisons and insights.
                </p>
                <p>
                  <span className={getSignalToneClass(trackerIntelligence.managementSignal.tone)}>
                    {trackerIntelligence.managementSignal.label}
                  </span>
                  {" · "}
                  <span className={getSignalToneClass(trackerIntelligence.consistencySignal.tone)}>
                    {trackerIntelligence.consistencySignal.label}
                  </span>
                </p>
              </div>
              <div className="latest-month-highlight-actions">
                <Link
                  href={`/dashboard/reports/${summary.latest.id}`}
                  className="button button-primary"
                >
                  Open Latest Report
                </Link>
                <Link
                  href="/dashboard/assessment"
                  className="button button-secondary"
                >
                  Add Another Month
                </Link>
              </div>
            </div>
          ) : null}

          <Card>
            <div className="section-header">
              <div>
                <h3>Tracker Filters</h3>
                <p className="chart-meta-label">
                  Focus the tracker on a single year or review all available
                  reporting months.
                </p>
              </div>
            </div>

            <div className="details-list">
              <div className="details-row">
                <span>Year View</span>
                <strong>
                  <select
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(event.target.value)}
                    className="assessment-input"
                    style={{ minWidth: "160px" }}
                  >
                    <option value="all">All years</option>
                    {availableYears.map((year) => (
                      <option key={year} value={String(year)}>
                        {year}
                      </option>
                    ))}
                  </select>
                </strong>
              </div>
            </div>
          </Card>

          <div className="dashboard-grid dashboard-grid--kpis">
            <Card>
              <div className="kpi-card">
                <p className="kpi-label">Months in View</p>
                <div className="kpi-figure">
                  <span className="kpi-number">{summary.periods}</span>
                </div>
                <p className="kpi-subtext">
                  {selectedYear === "all"
                    ? "Across all reporting years"
                    : `Reporting months in ${selectedYear}`}
                </p>
              </div>
            </Card>

            <Card>
              <div className="kpi-card">
                <p className="kpi-label">Average Emissions</p>
                <div className="kpi-figure">
                  <span className="kpi-number">
                    {summary.average == null ? "—" : formatNumber(summary.average, 2)}
                  </span>
                  {summary.average != null ? (
                    <span className="kpi-unit">kg CO₂e</span>
                  ) : null}
                </div>
                <p className="kpi-subtext">Average per selected month range</p>
              </div>
            </Card>

            <Card>
              <div className="kpi-card">
                <p className="kpi-label">Best Month</p>
                <div className="kpi-figure">
                  <span className="kpi-number">
                    {summary.best?.total_emissions == null
                      ? "—"
                      : formatNumber(summary.best.total_emissions, 2)}
                  </span>
                  {summary.best?.total_emissions != null ? (
                    <span className="kpi-unit">kg CO₂e</span>
                  ) : null}
                </div>
                <p className="kpi-subtext">
                  {summary.best ? formatPeriodLabel(summary.best) : "Not enough data"}
                </p>
              </div>
            </Card>

            <Card>
              <div className="kpi-card">
                <p className="kpi-label">Worst Month</p>
                <div className="kpi-figure">
                  <span className="kpi-number">
                    {summary.worst?.total_emissions == null
                      ? "—"
                      : formatNumber(summary.worst.total_emissions, 2)}
                  </span>
                  {summary.worst?.total_emissions != null ? (
                    <span className="kpi-unit">kg CO₂e</span>
                  ) : null}
                </div>
                <p className="kpi-subtext">
                  {summary.worst
                    ? formatPeriodLabel(summary.worst)
                    : "Not enough data"}
                </p>
              </div>
            </Card>
          </div>

          <div className="dashboard-grid dashboard-grid--main">
            <Card>
              <div className="section-header">
                <h3>Summary</h3>
              </div>

              <div className="details-list">
                <div className="details-row">
                  <span>Total Emissions in View</span>
                  <strong>{formatKgValue(summary.total)}</strong>
                </div>
                <div className="details-row">
                  <span>Average per Month</span>
                  <strong>{formatKgValue(summary.average)}</strong>
                </div>
                <div className="details-row">
                  <span>Latest Month</span>
                  <strong>
                    {summary.latest ? formatPeriodLabel(summary.latest) : "—"}
                  </strong>
                </div>
                <div className="details-row">
                  <span>Latest Total</span>
                  <strong>{formatKgValue(summary.latest?.total_emissions)}</strong>
                </div>
                <div className="details-row">
                  <span>Month Comparison</span>
                  <strong>{periodComparison.label}</strong>
                </div>
                <div className="details-row">
                  <span>Change vs Previous</span>
                  <strong>
                    {periodComparison.delta == null
                      ? "—"
                      : periodComparison.delta > 0
                      ? `+${formatNumber(periodComparison.delta, 2)} kg CO₂e`
                      : periodComparison.delta < 0
                      ? `-${formatNumber(Math.abs(periodComparison.delta), 2)} kg CO₂e`
                      : "0 kg CO₂e"}
                  </strong>
                </div>
                <div className="details-row">
                  <span>Management read</span>
                  <strong>
                    <span className={getSignalToneClass(trackerIntelligence.managementSignal.tone)}>
                      {trackerIntelligence.managementSignal.label}
                    </span>
                  </strong>
                </div>
                <div className="details-row">
                  <span>Recent pattern</span>
                  <strong>
                    <span className={getSignalToneClass(trackerIntelligence.consistencySignal.tone)}>
                      {trackerIntelligence.consistencySignal.label}
                    </span>
                  </strong>
                </div>
                <div className="details-row">
                  <span>Normal vs unusual</span>
                  <strong>
                    <span className={getSignalToneClass(trackerIntelligence.anomalySignal.tone)}>
                      {trackerIntelligence.anomalySignal.label}
                    </span>
                  </strong>
                </div>
                <div className="details-row">
                  <span>Recent position</span>
                  <strong>
                    <span className={getSignalToneClass(trackerIntelligence.recentPositionSignal.tone)}>
                      {trackerIntelligence.recentPositionSignal.label}
                    </span>
                  </strong>
                </div>
                <div className="details-row">
                  <span>Performance streak</span>
                  <strong>
                    <span className={getSignalToneClass(trackerIntelligence.deteriorationStreakSignal.tone)}>
                      {trackerIntelligence.deteriorationStreakSignal.label}
                    </span>
                  </strong>
                </div>
                <div className="details-row">
                  <span>Persistent source pattern</span>
                  <strong>
                    <span className={getSignalToneClass(trackerIntelligence.persistentSourceSignal.tone)}>
                      {trackerIntelligence.persistentSourceSignal.label}
                    </span>
                  </strong>
                </div>
                <div className="details-row">
                  <span>Recent trajectory</span>
                  <strong>
                    <span className={getSignalToneClass(trackerIntelligence.recentTrajectorySignal.tone)}>
                      {trackerIntelligence.recentTrajectorySignal.label}
                    </span>
                  </strong>
                </div>

                <div className="details-row">
                  <span>Recovery progress</span>
                  <strong>
                    <span className={getSignalToneClass(trackerIntelligence.recoveryProgressSignal.tone)}>
                      {trackerIntelligence.recoveryProgressSignal.label}
                    </span>
                  </strong>
                </div>
                <div className="details-row">
                  <span>Change driver</span>
                  <strong>
                    <span className={getSignalToneClass(trackerIntelligence.changeDriverSignal.tone)}>
                      {trackerIntelligence.changeDriverSignal.label}
                    </span>
                  </strong>
                </div>
                <div className="details-row">
                  <span>Biggest opportunity</span>
                  <strong>
                    <span className={getSignalToneClass(trackerIntelligence.opportunitySignal.tone)}>
                      {trackerIntelligence.opportunitySignal.label}
                    </span>
                  </strong>
                </div>
                <div className="details-row">
                  <span>Best recent month</span>
                  <strong>
                    {trackerIntelligence.benchmarkDepthSignal.bestPeriodLabel || "—"}
                  </strong>
                </div>
                <div className="details-row">
                  <span>Gap to best recent month</span>
                  <strong>
                    {trackerIntelligence.benchmarkDepthSignal.gapToBest == null
                      ? "—"
                      : trackerIntelligence.benchmarkDepthSignal.gapToBest > 0
                      ? `+${formatNumber(trackerIntelligence.benchmarkDepthSignal.gapToBest, 2)} kg CO₂e`
                      : trackerIntelligence.benchmarkDepthSignal.gapToBest < 0
                      ? `-${formatNumber(Math.abs(trackerIntelligence.benchmarkDepthSignal.gapToBest), 2)} kg CO₂e`
                      : "0 kg CO₂e"}
                  </strong>
                </div>
                <div className="details-row">
                  <span>Benchmark position</span>
                  <strong>
                    <span className={getSignalToneClass(trackerIntelligence.benchmarkPositionSignal.tone)}>
                      {trackerIntelligence.benchmarkPositionSignal.label}
                    </span>
                  </strong>
                </div>
              </div>
            </Card>

            <Card>
            <div className="section-header">
              <h3>Tracker Insights</h3>
            </div>

            <div className="summary-callout" style={{ marginBottom: "16px" }}>
              <strong>Executive summary</strong>
              <p>{trackerIntelligence.executiveSummary}</p>
            </div>

            <div className="summary-callout" style={{ marginBottom: "16px" }}>
              <strong>Priority Actions</strong>

              {trackerIntelligence.priorityActions?.length ? (
                trackerIntelligence.priorityActions.map((action, index) => (
                  <div
                    key={`${action.title}-${index}`}
                    className="insight-item"
                    style={index === trackerIntelligence.priorityActions.length - 1 ? { paddingBottom: 0 } : undefined}
                  >
                    <strong>{action.title}</strong>
                    <p>{action.summary}</p>
                  </div>
                ))
              ) : (
                <p>No priority actions yet.</p>
              )}

              {trackerIntelligence.biggestOpportunity ? (
                <p>
                  <strong>Biggest opportunity:</strong> {trackerIntelligence.biggestOpportunity}
                </p>
              ) : null}

              {trackerIntelligence.nextBestStep ? (
                <p>
                  <strong>Next best step:</strong> {trackerIntelligence.nextBestStep}
                </p>
              ) : null}
            </div>

            <div className="details-list" style={{ marginBottom: "16px" }}>
              <div className="details-row">
                <span>Management read</span>
                <strong>
                  <span className={getSignalToneClass(trackerIntelligence.managementSignal.tone)}>
                    {trackerIntelligence.managementSignal.label}
                  </span>
                </strong>
              </div>

              <div className="details-row">
                <span>Recent pattern</span>
                <strong>
                  <span className={getSignalToneClass(trackerIntelligence.consistencySignal.tone)}>
                    {trackerIntelligence.consistencySignal.label}
                  </span>
                </strong>
              </div>

              <div className="details-row">
                <span>Normal vs unusual</span>
                <strong>
                  <span className={getSignalToneClass(trackerIntelligence.anomalySignal.tone)}>
                    {trackerIntelligence.anomalySignal.label}
                  </span>
                </strong>
              </div>
            </div>

            <div className="insights-list">
              <div className="insight-item">
                <strong>Management context</strong>
                <p>{trackerIntelligence.managementSignal.summary}</p>
                <p>{trackerIntelligence.managementSignal.action}</p>
              </div>

              <div className="insight-item">
                <strong>Main watchout</strong>
                <p>{trackerIntelligence.sourceWatchout.summary}</p>
                <p>{trackerIntelligence.sourceWatchout.action}</p>
              </div>

              <div className="insight-item">
                <strong>Comparison summary</strong>
                <p>
                  {trackerComparisonSummary?.summary ||
                    "Add at least two chronological months in the current view to unlock a stronger comparison summary."}
                </p>
                {trackerComparisonSummary?.action ? (
                  <p>{trackerComparisonSummary.action}</p>
                ) : null}
              </div>

              <div className="insight-item">
                <strong>Recent position</strong>
                <p>{trackerIntelligence.recentPositionSignal.summary}</p>
                <p>{trackerIntelligence.recentPositionSignal.action}</p>
              </div>

              <div className="insight-item">
                <strong>Performance streak</strong>
                <p>{trackerIntelligence.deteriorationStreakSignal.summary}</p>
                <p>{trackerIntelligence.deteriorationStreakSignal.action}</p>
              </div>

              <div className="insight-item">
                <strong>Persistent source pattern</strong>
                <p>{trackerIntelligence.persistentSourceSignal.summary}</p>
                <p>{trackerIntelligence.persistentSourceSignal.action}</p>
              </div>

              <div className="insight-item">
                <strong>Recent trajectory</strong>
                <p>{trackerIntelligence.recentTrajectorySignal.summary}</p>
                <p>{trackerIntelligence.recentTrajectorySignal.action}</p>
              </div>

              <div className="insight-item">
                <strong>Recovery Progress</strong>
                <p>{trackerIntelligence.recoveryProgressSignal.summary}</p>
                <p>{trackerIntelligence.recoveryProgressSignal.action}</p>
              </div>

              <div className="insight-item">
                <strong>Multi-month management read</strong>
                <p>
                  <span className={getSignalToneClass(trackerIntelligence.multiMonthSignal.tone)}>
                    {trackerIntelligence.multiMonthSignal.label}
                  </span>
                </p>
                <p>{trackerIntelligence.multiMonthSignal.summary}</p>
                <p>{trackerIntelligence.multiMonthSignal.action}</p>
                <p>
                  <strong>Window:</strong> {trackerIntelligence.multiMonthSignal.windowLabel}
                </p>
              </div>

              <div className="insight-item">
                <strong>Change driver</strong>
                <p>{trackerIntelligence.changeDriverSignal.summary}</p>
                <p>{trackerIntelligence.changeDriverSignal.action}</p>
              </div>

              <div className="insight-item">
                <strong>Biggest opportunity</strong>
                <p>{trackerIntelligence.opportunitySignal.summary}</p>
                <p>{trackerIntelligence.opportunitySignal.action}</p>
              </div>

              <div className="insight-item">
                <strong>{trackerIntelligence.benchmarkDepthSignal.title}</strong>
                <p>{trackerIntelligence.benchmarkDepthSignal.summary}</p>
                <p>{trackerIntelligence.benchmarkDepthSignal.action}</p>
              </div>

              <div className="insight-item">
                <strong>Benchmark Position</strong>
                <p>{trackerIntelligence.benchmarkPositionSignal.summary}</p>
                <p>
                  <strong>Rank in history:</strong>{" "}
                  {trackerIntelligence.benchmarkPositionSignal.rank != null
                    ? `${trackerIntelligence.benchmarkPositionSignal.rank} of ${trackerIntelligence.benchmarkPositionSignal.totalCount}`
                    : "Not enough data"}
                </p>
                <p>
                  <strong>Gap to best:</strong>{" "}
                  {trackerIntelligence.benchmarkPositionSignal.deltaToBest != null
                    ? formatKgValue(trackerIntelligence.benchmarkPositionSignal.deltaToBest)
                    : "Not enough data"}
                </p>
                <p>
                  <strong>Gap to average:</strong>{" "}
                  {trackerIntelligence.benchmarkPositionSignal.deltaToAverage != null
                    ? formatKgValue(trackerIntelligence.benchmarkPositionSignal.deltaToAverage)
                    : "Not enough data"}
                </p>
                <p>{trackerIntelligence.benchmarkPositionSignal.action}</p>
              </div>

              <div className="insight-item">
                <strong>Vs Best Month</strong>
                <p>{trackerIntelligence.bestMonthReference.summary}</p>
                <p>
                  <strong>Best recent month:</strong>{" "}
                  {trackerIntelligence.bestMonthReference.bestMonthLabel}
                </p>
                <p>
                  <strong>Gap vs best:</strong>{" "}
                  {trackerIntelligence.bestMonthReference.gapKg != null
                    ? formatKgValue(trackerIntelligence.bestMonthReference.gapKg)
                    : "Not enough data"}
                </p>
                <p>
                  <strong>Driver:</strong>{" "}
                  {trackerIntelligence.bestMonthReference.driverSignal.label}
                </p>
                <p>{trackerIntelligence.bestMonthReference.nextStep}</p>
              </div>
            </div>
          </Card>
          </div>

          <Card>
            <div className="section-header">
              <div>
                <h3>Ranked Months</h3>
                <p className="chart-meta-label">
                  Lowest total emissions first, highest last.
                </p>
              </div>
            </div>

            <div className="reports-table">
              <div className="reports-table-head reports-table-head--four">
                <span>Rank</span>
                <span>Month</span>
                <span>Total Emissions</span>
                <span>Emissions / Employee</span>
              </div>

              {rankedReports.map((report, index) => {
                const perEmployee = getPerEmployee(
                  report.total_emissions,
                  report.employee_count
                );

                return (
                  <Link
                    key={`ranked-${report.id}`}
                    href={`/dashboard/reports/${report.id}`}
                    className="reports-table-row reports-table-row--four"
                  >
                    <span>#{index + 1}</span>
                    <span>{formatPeriodLabel(report)}</span>
                    <span>{formatKgValue(report.total_emissions)}</span>
                    <span>
                      {perEmployee == null
                        ? "—"
                        : `${formatNumber(perEmployee, 2)} kg CO₂e`}
                    </span>
                  </Link>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="section-header">
              <div>
                <h3>Months in View</h3>
                <p className="chart-meta-label">
                  Most recent first for operational review.
                </p>
              </div>
            </div>

            <div className="reports-table">
              <div className="reports-table-head reports-table-head--four">
                <span>Month</span>
                <span>Total Emissions</span>
                <span>Recorded</span>
                <span>Open</span>
              </div>

              {recentReports.map((report) => {
                const isLatestMonth = summary.latest?.id === report.id;
                const comparisonCue = comparisonByReportId.get(report.id);

                return (
                  <div
                    key={report.id}
                    className={`reports-table-row reports-table-row--four ${
                      isLatestMonth ? "reports-table-row--latest" : ""
                    }`}
                  >
                    <span className="tracker-month-cell">
                      <span>{formatPeriodLabel(report)}</span>
                      {isLatestMonth ? (
                        <span className="tracker-latest-badge">Latest</span>
                      ) : null}
                      {comparisonCue ? (
                        <span
                          className={getSignalToneClass(comparisonCue.tone)}
                          style={{ marginTop: "8px", width: "fit-content" }}
                        >
                          {comparisonCue.label}
                        </span>
                      ) : null}
                    </span>
                    <span>{formatKgValue(report.total_emissions)}</span>
                    <span>{formatDisplayDate(report.created_at)}</span>
                    <span className="tracker-row-actions">
                      <Link
                        href={`/dashboard/reports/${report.id}`}
                        className="button button-secondary"
                      >
                        View Report
                      </Link>
                      <a
                        href={`/api/reports/${report.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="button button-secondary"
                      >
                        Download PDF
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteReport(report.id)}
                        disabled={deletingId === report.id}
                        className="button button-danger-outline"
                      >
                        {deletingId === report.id ? "Deleting..." : "Delete"}
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      ) : null}
    </main>
  );
}