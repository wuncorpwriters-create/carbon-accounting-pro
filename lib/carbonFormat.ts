export function formatNumber(
  value: number | null | undefined,
  maximumFractionDigits = 2
) {
  if (value == null || Number.isNaN(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

export function formatKgValue(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${formatNumber(value, 2)} kg CO₂e`;
}

export function formatTonnesValue(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${formatNumber(value / 1000, 2)} tCO₂e`;
}

export function formatCarbonAuto(
  value: number | null | undefined,
  tonneThresholdKg = 1000
) {
  if (value == null || Number.isNaN(value)) {
    return {
      value: "—",
      unit: "",
      full: "—",
      rawKg: null as number | null,
      displayValue: null as number | null,
      isTonnes: false,
    };
  }

  if (value >= tonneThresholdKg) {
    const displayValue = value / 1000;
    const formatted = formatNumber(displayValue, 2);

    return {
      value: formatted,
      unit: "tCO₂e",
      full: `${formatted} tCO₂e`,
      rawKg: value,
      displayValue,
      isTonnes: true,
    };
  }

  const formatted = formatNumber(value, 2);

  return {
    value: formatted,
    unit: "kg CO₂e",
    full: `${formatted} kg CO₂e`,
    rawKg: value,
    displayValue: value,
    isTonnes: false,
  };
}

export function formatCarbonExactKg(
  value: number | null | undefined,
  maximumFractionDigits = 2
) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${formatNumber(value, maximumFractionDigits)} kg CO₂e`;
}
