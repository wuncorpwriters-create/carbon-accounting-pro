"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseClient } from "../../../lib/supabaseClient";
import Card from "../../../components/Card";
import { formatCarbonExactKg } from "../../../lib/carbonFormat";
import {
  formatDisplayDate,
  formatPeriodLabel,
  getElectricityMethodLabel,
  parseReportingDateStrict,
  sortReportsChronologically,
  type ReportRow,
} from "../../../lib/reportIntelligence";

function formatKg(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return formatCarbonExactKg(value);
}

function getSelectedYearLabel(selectedYear: string) {
  return selectedYear === "all" ? "All years" : selectedYear;
}

function getPeriodYear(report: ReportRow) {
  const parsed = parseReportingDateStrict(report);
  if (!parsed) return null;
  return parsed.getFullYear();
}

export default function ReportsPage() {
  const [deletedFromDetail, setDeletedFromDetail] = useState(false);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [reportToDelete, setReportToDelete] = useState<ReportRow | null>(null);

  const shouldShowDeletedFromDetail = useMemo(
    () => deletedFromDetail && !successMessage,
    [deletedFromDetail, successMessage]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDeletedFromDetail(params.get("deleted") === "1");
  }, []);

  useEffect(() => {
    async function loadReports() {
      const supabase = createSupabaseClient();

      const { data, error } = await supabase
        .from("report_results")
        .select(
          "id, period_label, reporting_period, total_emissions, created_at, company_name, country, industry, electricity_method, fuel_type"
        )
        .order("id", { ascending: false });

      if (error) {
        console.error("Error loading reports:", error);
        setErrorMessage("Failed to load reports.");
      } else {
        const sortedReports = sortReportsChronologically(
          ((data as ReportRow[]) || []).map((report) => ({
            ...report,
            employee_count: null,
            electricity_kwh: null,
            electricity_factor: null,
            fuel_liters: null,
            fuel_factor: null,
            scope1_emissions: null,
            scope2_emissions: null,
          }))
        ).reverse();

        setReports(sortedReports);
      }

      setLoading(false);
    }

    loadReports();
  }, []);

  useEffect(() => {
    if (deletedFromDetail) {
      setSuccessMessage("Report deleted successfully.");

      const timer = window.setTimeout(() => {
        setSuccessMessage("");
        window.history.replaceState({}, "", "/dashboard/reports");
      }, 3000);

      return () => window.clearTimeout(timer);
    }
  }, [deletedFromDetail]);

  useEffect(() => {
    if (!successMessage || deletedFromDetail) return;

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [successMessage, deletedFromDetail]);

  useEffect(() => {
    if (!errorMessage) return;

    const timer = window.setTimeout(() => {
      setErrorMessage("");
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [errorMessage]);

  const availableYears = useMemo(() => {
    return Array.from(
      new Set(
        reports
          .map((report) => getPeriodYear(report))
          .filter((year): year is number => year != null)
      )
    ).sort((a, b) => b - a);
  }, [reports]);

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
    if (selectedYear === "all") return reports;

    return reports.filter(
      (report) => String(getPeriodYear(report)) === selectedYear
    );
  }, [reports, selectedYear]);

  const selectedYearSummary = useMemo(() => {
    const reportsWithTotals = filteredReports.filter(
      (report) => report.total_emissions != null
    );

    if (!reportsWithTotals.length) {
      return {
        count: 0,
        total: null as number | null,
        average: null as number | null,
        best: null as ReportRow | null,
        worst: null as ReportRow | null,
      };
    }

    const total = reportsWithTotals.reduce(
      (sum, report) => sum + (report.total_emissions ?? 0),
      0
    );

    let best = reportsWithTotals[0];
    let worst = reportsWithTotals[0];

    reportsWithTotals.forEach((report) => {
      const current = report.total_emissions ?? 0;
      const bestValue = best.total_emissions ?? 0;
      const worstValue = worst.total_emissions ?? 0;

      if (current < bestValue) best = report;
      if (current > worstValue) worst = report;
    });

    return {
      count: reportsWithTotals.length,
      total,
      average: total / reportsWithTotals.length,
      best,
      worst,
    };
  }, [filteredReports]);

  async function confirmDelete() {
    if (!reportToDelete) return;

    const label = formatPeriodLabel(reportToDelete);
    setDeletingId(reportToDelete.id);

    try {
      const response = await fetch(`/api/reports/${reportToDelete.id}`, {
        method: "DELETE",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Failed to delete report.");
      }

      setReports((current) =>
        current.filter((item) => item.id !== reportToDelete.id)
      );
      setSuccessMessage(`"${label}" deleted successfully.`);
    } catch (error) {
      console.error("Error deleting report:", error);
      setErrorMessage("Failed to delete report. Please try again.");
    } finally {
      setDeletingId(null);
      setReportToDelete(null);
    }
  }

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>
            Review completed carbon reports, open details, download PDFs, or
            remove test entries.
          </p>
        </div>

        <Link href="/dashboard/assessment" className="dashboard-btn-primary">
          New Assessment
        </Link>
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
            className="workflow-strip-link"
          >
            Monthly Tracker
          </Link>
          <Link
            href="/dashboard/reports"
            className="workflow-strip-link workflow-strip-link--current"
          >
            Reports
          </Link>
        </div>
      </div>

      {(successMessage || shouldShowDeletedFromDetail) && (
        <div className="status-banner status-banner-success">
          {successMessage || "Report deleted successfully."}
        </div>
      )}

      {errorMessage && (
        <div className="status-banner status-banner-error">{errorMessage}</div>
      )}

      {!loading && reports.length > 0 && (
        <Card>
          <div className="section-header">
            <div>
              <h3>Report Filters</h3>
              <p className="chart-meta-label">
                Focus reports on a single year or review all available reporting
                months.
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
      )}

      {loading && (
        <Card title="Loading">
          <p className="dashboard-insight-text">Loading reports...</p>
        </Card>
      )}

      {!loading && reports.length === 0 && (
        <Card title="No Reports">
          <p className="dashboard-insight-text">
            No reports yet. Complete an assessment to generate your first
            report.
          </p>

          <div className="dashboard-actions reports-actions-spacer">
            <Link href="/dashboard/assessment" className="dashboard-btn-primary">
              Start New Assessment
            </Link>
          </div>
        </Card>
      )}

      {!loading && reports.length > 0 && filteredReports.length === 0 && (
        <Card title="No Reports in View">
          <p className="dashboard-insight-text">
            No reports match the selected year.
          </p>
        </Card>
      )}

      {!loading && filteredReports.length > 0 && (
        <>
          <div className="filter-status-bar">
            <span className="filter-status-label">Year view</span>
            <span className="filter-status-chip">
              {getSelectedYearLabel(selectedYear)}
            </span>
          </div>

          <div className="year-summary-bar">
            <div className="year-summary-bar-header">
              <div>
                <p className="year-summary-bar-eyebrow">Selected year summary</p>
                <h2>{getSelectedYearLabel(selectedYear)}</h2>
              </div>
              <p className="chart-meta-label">
                Snapshot based on the reports currently in view.
              </p>
            </div>

            <div className="year-summary-bar-grid">
              <div className="year-summary-bar-card">
                <span className="year-summary-bar-label">Reports in View</span>
                <strong>{selectedYearSummary.count}</strong>
              </div>

              <div className="year-summary-bar-card">
                <span className="year-summary-bar-label">Total Emissions</span>
                <strong>
                  {formatCarbonExactKg(selectedYearSummary.total, 2)}
                </strong>
              </div>

              <div className="year-summary-bar-card">
                <span className="year-summary-bar-label">Average / Report</span>
                <strong>
                  {formatCarbonExactKg(selectedYearSummary.average, 2)}
                </strong>
              </div>

              <div className="year-summary-bar-card">
                <span className="year-summary-bar-label">Lowest Month</span>
                <strong>
                  {selectedYearSummary.best
                    ? formatPeriodLabel(selectedYearSummary.best)
                    : "—"}
                </strong>
              </div>

              <div className="year-summary-bar-card">
                <span className="year-summary-bar-label">Highest Month</span>
                <strong>
                  {selectedYearSummary.worst
                    ? formatPeriodLabel(selectedYearSummary.worst)
                    : "—"}
                </strong>
              </div>
            </div>
          </div>

          <div className="reports-list">
            {filteredReports.map((report, index) => {
              const period = formatPeriodLabel(report);
              const createdDate = formatDisplayDate(report.created_at);
              const isDeleting = deletingId === report.id;
              const isLatestReport = index === 0;

              return (
                <div
                  key={report.id}
                  className={isLatestReport ? "report-card-latest-wrap" : ""}
                >
                  {isLatestReport ? (
                    <div className="report-card-latest-label">Latest</div>
                  ) : null}
                  <Card title={period}>
                    <div className="report-row-meta">
                      <p className="dashboard-insight-text">
                        Total Emissions:{" "}
                        <strong>{formatKg(report.total_emissions)}</strong>
                      </p>

                      <p className="dashboard-insight-text">
                        Created: {createdDate}
                      </p>

                      <p className="dashboard-insight-text">
                        Company:{" "}
                        <strong>
                          {report.company_name?.trim() || "Not recorded"}
                        </strong>
                      </p>

                      <p className="dashboard-insight-text">
                        Country / Industry:{" "}
                        <strong>
                          {report.country?.trim() || "Not recorded"} /{" "}
                          {report.industry?.trim() || "Not recorded"}
                        </strong>
                      </p>

                      <p className="dashboard-insight-text">
                        Method / Fuel:{" "}
                        <strong>
                          {getElectricityMethodLabel(report.electricity_method)}{" "}
                          / {report.fuel_type?.trim() || "Not recorded"}
                        </strong>
                      </p>
                    </div>

                    <div className="report-card-actions reports-actions-spacer">
                      <Link
                        href={`/dashboard/reports/${report.id}`}
                        className="dashboard-btn-secondary report-card-action"
                      >
                        View Report
                      </Link>

                      <a
                        href={`/api/reports/${report.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="dashboard-btn-secondary report-card-action"
                      >
                        Download PDF
                      </a>

                      <button
                        type="button"
                        onClick={() => setReportToDelete(report)}
                        disabled={isDeleting}
                        className="dashboard-btn-danger-outline report-card-action"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </>
      )}

      {reportToDelete && (
        <div
          className="app-modal-overlay"
          onClick={() => deletingId == null && setReportToDelete(null)}
        >
          <div className="app-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Delete Report</h3>
            <p>
              Delete report <strong>"{formatPeriodLabel(reportToDelete)}"</strong>?
            </p>
            <p className="app-modal-note">This action cannot be undone.</p>

            <div className="app-modal-actions">
              <button
                type="button"
                className="dashboard-btn-secondary"
                onClick={() => setReportToDelete(null)}
                disabled={deletingId === reportToDelete.id}
              >
                Cancel
              </button>

              <button
                type="button"
                className="dashboard-btn-danger-solid"
                onClick={confirmDelete}
                disabled={deletingId === reportToDelete.id}
              >
                {deletingId === reportToDelete.id
                  ? "Deleting..."
                  : "Delete Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}