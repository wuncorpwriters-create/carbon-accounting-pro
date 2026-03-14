export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { createClient } from "@supabase/supabase-js";
import { formatNumber } from "../../../../../lib/carbonFormat";
import {
  type ReportRow,
  formatDisplayDate,
  formatPeriodLabel,
  getElectricityMethodLabel,
  sortReportsChronologically,
  buildReportIntelligence,
} from "../../../../../lib/reportIntelligence";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PDF_CARBON_UNIT = "kg CO2e";
const PDF_CARBON_UNIT_SHORT = "CO2e";

function formatPdfCarbonKg(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "Not recorded";
  return `${formatNumber(value, 0)} ${PDF_CARBON_UNIT}`;
}

function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatCountryDisplay(country?: string | null) {
  const raw = country?.trim();
  if (!raw) return "Not recorded";

  const normalized = raw.toLowerCase();

  const countryMap: Record<string, string> = {
    ke: "Kenya",
    ug: "Uganda",
    tz: "Tanzania",
    rw: "Rwanda",
    et: "Ethiopia",
    ng: "Nigeria",
    za: "South Africa",
    gh: "Ghana",
    uk: "United Kingdom",
    gb: "United Kingdom",
    us: "United States",
    ae: "United Arab Emirates",
  };

  return countryMap[normalized] || toTitleCase(raw);
}

function formatIndustryDisplay(industry?: string | null) {
  const raw = industry?.trim();
  if (!raw) return "Not recorded";
  return toTitleCase(raw);
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 30,
    paddingHorizontal: 28,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  brand: {
    fontSize: 10,
    color: "#166534",
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 8.5,
    color: "#475569",
    marginBottom: 1,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: "bold",
    marginBottom: 7,
    color: "#111827",
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 8,
  },
  summaryLabel: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#166534",
  },
  twoColumn: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  column: {
    flex: 1,
  },
  detailCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  rowLabel: {
    fontSize: 8.5,
    color: "#475569",
    paddingRight: 8,
  },
  rowValue: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "right",
    maxWidth: "58%",
  },
  insightBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 8,
    backgroundColor: "#f8fafc",
  },
  insightItem: {
    marginBottom: 8,
  },
  insightHeading: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  insightText: {
    fontSize: 8.5,
    lineHeight: 1.35,
    color: "#334155",
  },
  calloutBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 8,
    backgroundColor: "#f8fafc",
    marginBottom: 8,
  },
  calloutTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  bulletList: {
    marginTop: 4,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 6,
  },
  bulletDot: {
    width: 8,
    fontSize: 8.5,
    color: "#334155",
  },
  bulletText: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 1.35,
    color: "#334155",
  },
  noteBox: {
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 6,
    padding: 8,
    backgroundColor: "#eff6ff",
    marginTop: 8,
  },
  noteTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  footer: {
    position: "absolute",
    bottom: 12,
    left: 28,
    right: 28,
    textAlign: "center",
    fontSize: 7.5,
    color: "#94a3b8",
  },
});

function ReportPDF({
  report,
  previousComparableReport,
  comparisonHistory,
}: {
  report: ReportRow;
  previousComparableReport: ReportRow | null;
  comparisonHistory: ReportRow[];
}) {
  const reportingPeriod = formatPeriodLabel(report);
  const previousPeriodLabel = formatPeriodLabel(previousComparableReport);

  const totalEmissions = formatPdfCarbonKg(report.total_emissions);
  const scope1 = formatPdfCarbonKg(report.scope1_emissions);
  const scope2 = formatPdfCarbonKg(report.scope2_emissions);
  const electricity = formatNumber(report.electricity_kwh);
  const fuel = formatNumber(report.fuel_liters);
  const employees =
    report.employee_count !== null && report.employee_count !== undefined
      ? String(report.employee_count)
      : "N/A";

  const intelligence = buildReportIntelligence(
    report,
    previousComparableReport,
    comparisonHistory
  );

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} wrap={false}>
          <Text style={styles.brand}>Carbon Accounting Pro</Text>
          <Text style={styles.title}>Emissions Report</Text>
          <Text style={styles.subtitle}>Reporting Month: {reportingPeriod}</Text>
          <Text style={styles.subtitle}>Created: {formatDisplayDate(report.created_at)}</Text>
          <Text style={styles.subtitle}>
            Company: {report.company_name?.trim() || "Not recorded"}
          </Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Emissions</Text>
            <Text style={styles.summaryValue}>{totalEmissions}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Scope 1</Text>
            <Text style={styles.summaryValue}>{scope1}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Scope 2</Text>
            <Text style={styles.summaryValue}>{scope2}</Text>
          </View>
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Assessment Details</Text>

            <View style={styles.detailCard}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Company</Text>
                <Text style={styles.rowValue}>
                  {report.company_name?.trim() || "Not recorded"}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Country</Text>
                <Text style={styles.rowValue}>
                  {formatCountryDisplay(report.country)}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Industry</Text>
                <Text style={styles.rowValue}>
                  {formatIndustryDisplay(report.industry)}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Reporting Month</Text>
                <Text style={styles.rowValue}>{reportingPeriod}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Electricity Usage</Text>
                <Text style={styles.rowValue}>{electricity} kWh</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Fuel Usage</Text>
                <Text style={styles.rowValue}>{fuel} liters</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Employee Count</Text>
                <Text style={styles.rowValue}>{employees}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Total Emissions</Text>
                <Text style={styles.rowValue}>{totalEmissions}</Text>
              </View>

              {intelligence.perEmployee != null ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Emissions per Employee</Text>
                  <Text style={styles.rowValue}>
                    {formatNumber(intelligence.perEmployee, 1)} {PDF_CARBON_UNIT}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Methodology Basis</Text>

            <View style={styles.detailCard}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Electricity Method</Text>
                <Text style={styles.rowValue}>
                  {getElectricityMethodLabel(report.electricity_method)}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Electricity Factor</Text>
                <Text style={styles.rowValue}>
                  {report.electricity_factor == null
                    ? "Not recorded"
                    : `${formatNumber(report.electricity_factor, 4)} ${PDF_CARBON_UNIT_SHORT} / kWh`}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Fuel Type</Text>
                <Text style={styles.rowValue}>
                  {formatIndustryDisplay(report.fuel_type)}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Fuel Factor</Text>
                <Text style={styles.rowValue}>
                  {report.fuel_factor == null
                    ? "Not recorded"
                    : `${formatNumber(report.fuel_factor, 4)} ${PDF_CARBON_UNIT_SHORT} / liter`}
                </Text>
              </View>
            </View>

            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>Important note</Text>
              <Text style={styles.insightText}>
                This report should be interpreted using the recorded electricity
                and fuel factors shown above. Factors can differ by grid,
                supplier, fuel type, and reporting method.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Performance Summary</Text>

            <View style={styles.insightBox}>
              <View style={styles.insightItem}>
                <Text style={styles.insightHeading}>Executive summary</Text>
                <Text style={styles.insightText}>
                  {intelligence.executiveSummary}
                </Text>
              </View>

              <View style={styles.insightItem}>
                <Text style={styles.insightHeading}>
                  Benchmark
                  {intelligence.intensityBand
                    ? ` · ${intelligence.intensityBand.label}`
                    : ""}
                </Text>
                <Text style={styles.insightText}>
                  {intelligence.benchmarkSummary}
                </Text>
              </View>

              <View style={styles.insightItem}>
                <Text style={styles.insightHeading}>
                  Trend · {intelligence.trend.label}
                </Text>
                <Text style={styles.insightText}>
                  {intelligence.trend.summary}
                </Text>
              </View>

              <View style={styles.insightItem}>
                <Text style={styles.insightHeading}>Dominant source</Text>
                <Text style={styles.insightText}>
                  {intelligence.dominantSource.summary}
                </Text>
              </View>

              <View style={styles.insightItem}>
                <Text style={styles.insightHeading}>Recent baseline</Text>
                <Text style={styles.insightText}>
                  {intelligence.baselineComparison.summary}
                </Text>
              </View>

              <View style={styles.insightItem}>
                <Text style={styles.insightHeading}>Coverage</Text>
                <Text style={styles.insightText}>{intelligence.coverage}</Text>
              </View>
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Recommended Actions</Text>

            <View style={styles.calloutBox}>
              <Text style={styles.calloutTitle}>Next best move</Text>
              <Text style={styles.insightText}>
                {intelligence.dominantSource.action}
              </Text>
            </View>

            <View style={styles.calloutBox}>
              <Text style={styles.calloutTitle}>Trend response</Text>
              <Text style={styles.insightText}>{intelligence.trend.action}</Text>
            </View>

            {previousComparableReport ? (
              <View style={styles.calloutBox}>
                <Text style={styles.calloutTitle}>Comparison month</Text>
                <Text style={styles.insightText}>
                  This report is being compared against {previousPeriodLabel}.
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Action Checklist</Text>

          <View style={styles.insightBox}>
            <View style={styles.bulletList}>
              {intelligence.recommendedActions.map((item, index) => (
                <View key={`pdf-action-${index}`} style={styles.bulletItem}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.footer} fixed>
          Generated by Carbon Accounting Pro
        </Text>
      </Page>
    </Document>
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const [reportResponse, comparisonResponse] = await Promise.all([
      supabase.from("report_results").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("report_results")
        .select(
          "id, created_at, period_label, reporting_period, employee_count, electricity_kwh, fuel_liters, scope1_emissions, scope2_emissions, total_emissions"
        )
        .order("id", { ascending: false })
        .limit(36),
    ]);

    const report = reportResponse.data as ReportRow | null;

    if (reportResponse.error || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (comparisonResponse.error) {
      console.error("Comparison fetch error:", comparisonResponse.error);
      return NextResponse.json(
        { error: "Failed to load comparison context" },
        { status: 500 }
      );
    }

    const comparisonReports = (comparisonResponse.data as ReportRow[]) || [];
    const orderedReports = sortReportsChronologically(comparisonReports);

    const currentIndex = orderedReports.findIndex((item) => item.id === report.id);
    const previousComparableReport =
      currentIndex > 0 ? orderedReports[currentIndex - 1] : null;

    const comparisonHistory =
      currentIndex > 0
        ? orderedReports
            .slice(Math.max(0, currentIndex - 3), currentIndex)
            .filter((item) => item.total_emissions != null)
        : [];

    const doc = (
      <ReportPDF
        report={report}
        previousComparableReport={previousComparableReport}
        comparisonHistory={comparisonHistory}
      />
    );

    const pdfBuffer = await pdf(doc).toBuffer();

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="carbon-report-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
