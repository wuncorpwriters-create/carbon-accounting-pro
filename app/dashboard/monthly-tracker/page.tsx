"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseClient } from "../../../lib/supabaseClient";
import Card from "../../../components/Card";
import {
  formatNumber,
  formatCarbonExactKg,
} from "../../../lib/carbonFormat";

const supabase = createSupabaseClient();

type ReportRow = {
  id: string;
  period_label?: string | null;
  reporting_period?: string | null;
  total_emissions?: number | null;
  scope1_emissions?: number | null;
  scope2_emissions?: number | null;
  employee_count?: number | null;
  electricity_kwh?: number | null;
  fuel_liters?: number | null;
  created_at?: string | null;
};


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

function parseReportingDateStrict(report: ReportRow): Date | null {
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

function parseSortDate(report: ReportRow): Date | null {
  const strict = parseReportingDateStrict(report);
  if (strict) return strict;

  if (report.created_at) {
    const created = new Date(report.created_at);
    if (!Number.isNaN(created.getTime())) return created;
  }

  return null;
}

function getPeriodYear(report: ReportRow) {
  const parsed = parseReportingDateStrict(report);
  if (!parsed) return null;
  return parsed.getFullYear();
}

function getPerEmployee(
  total: number | null | undefined,
  employees: number | null | undefined
) {
  if (total == null || employees == null || employees <= 0) return null;
  return total / employees;
}

function compareChronologically(a: ReportRow, b: ReportRow) {
  const dateA = parseSortDate(a);
  const dateB = parseSortDate(b);

  if (dateA && dateB) {
    return dateA.getTime() - dateB.getTime();
  }

  if (dateA && !dateB) return -1;
  if (!dateA && dateB) return 1;

  const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
  const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;

  if (createdA !== createdB) {
    return createdA - createdB;
  }

  return a.id.localeCompare(b.id);
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
    return [...reports].sort(compareChronologically);
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
          <Link href="/dashboard/monthly-tracker" className="workflow-strip-link workflow-strip-link--current">
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
        <Card>
          <div className="empty-state">
            <p>No monthly reports available yet.</p>
            <p>
              Complete your first monthly assessment to start tracking emissions
              over time, compare months, and identify your best and worst months.
            </p>
            <div className="page-actions" style={{ justifyContent: "center", marginTop: "12px" }}>
              <Link href="/dashboard/assessment" className="button button-primary">
                Start First Monthly Assessment
              </Link>
              <Link href="/dashboard/reports" className="button button-secondary">
                View Reports
              </Link>
            </div>
          </div>
        </Card>
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
              </div>
            </Card>

            <Card>
              <div className="section-header">
                <h3>Tracker Insights</h3>
              </div>

              <div className="insights-list">
                <div className="insight-item">
                  <strong>Best month</strong>
                  <p>
                    {summary.best
                      ? `${formatPeriodLabel(summary.best)} has the lowest recorded total at ${formatKgValue(
                          summary.best.total_emissions
                        )}.`
                      : "Not enough history yet to identify the best month."}
                  </p>
                </div>

                <div className="insight-item">
                  <strong>Worst month</strong>
                  <p>
                    {summary.worst
                      ? `${formatPeriodLabel(summary.worst)} has the highest recorded total at ${formatKgValue(
                          summary.worst.total_emissions
                        )}.`
                      : "Not enough history yet to identify the worst month."}
                  </p>
                </div>

                <div className="insight-item">
                  <strong>Average baseline</strong>
                  <p>
                    {summary.average == null
                      ? "There is not enough data to calculate an average baseline."
                      : `Average emissions for the current view are ${formatKgValue(
                          summary.average
                        )} per reporting month.`}
                  </p>
                </div>

                <div className="insight-item">
                  <strong>Latest movement</strong>
                  <p>
                    {periodComparison.delta == null
                      ? "Add at least two months in the selected view to compare movement."
                      : periodComparison.delta < 0
                      ? `The latest month improved by ${formatKgValue(
                          Math.abs(periodComparison.delta)
                        )} compared with the previous one.`
                      : periodComparison.delta > 0
                      ? `The latest month increased by ${formatKgValue(
                          periodComparison.delta
                        )} compared with the previous one.`
                      : "The latest month is unchanged compared with the previous one."}
                  </p>
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