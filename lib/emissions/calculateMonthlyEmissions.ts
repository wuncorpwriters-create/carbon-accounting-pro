export type MonthlyEmissionsInput = {
  electricityKwh: number;
  fuelLiters: number;
  vehicleKm: number;
};

export type MonthlyEmissionsResult = {
  scope1: number;
  scope2: number;
  total: number;
};

const EMISSION_FACTOR_ELECTRICITY_KG_CO2E_PER_KWH = 0.4;
const EMISSION_FACTOR_FUEL_KG_CO2E_PER_LITER = 2.3;
const EMISSION_FACTOR_VEHICLE_KG_CO2E_PER_KM = 0.21;

export const calculateMonthlyEmissions = (
  input: MonthlyEmissionsInput
): MonthlyEmissionsResult => {
  const scope1 =
    input.fuelLiters * EMISSION_FACTOR_FUEL_KG_CO2E_PER_LITER +
    input.vehicleKm * EMISSION_FACTOR_VEHICLE_KG_CO2E_PER_KM;
  const scope2 =
    input.electricityKwh * EMISSION_FACTOR_ELECTRICITY_KG_CO2E_PER_KWH;
  const total = scope1 + scope2;

  return { scope1, scope2, total };
};
