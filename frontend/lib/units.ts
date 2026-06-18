// ── Unit Conversions Utility ──────────────────────────────────

export const LBS_TO_KG_FACTOR = 0.45359237;

/**
 * Converts pounds to kilograms.
 */
export function lbsToKg(lbs: number): number {
  return lbs * LBS_TO_KG_FACTOR;
}

/**
 * Converts kilograms to pounds.
 */
export function kgToLbs(kg: number): number {
  return kg / LBS_TO_KG_FACTOR;
}

/**
 * Formats a weight based on the user's unit preference, rounding to the given decimal place.
 */
export function formatWeight(lbs: number, targetUnit: string, precision: number = 1): number {
  const factor = Math.pow(10, precision);
  if (targetUnit === "kg") {
    return Math.round(lbsToKg(lbs) * factor) / factor;
  }
  return Math.round(lbs * factor) / factor;
}

/**
 * Converts centimeters to inches.
 */
export function cmToInches(cm: number): number {
  return cm / 2.54;
}

/**
 * Converts inches to centimeters.
 */
export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

/**
 * Converts centimeters to feet and inches.
 */
export function cmToFtIn(cm: number): { ft: number; in: number } {
  const inches = cmToInches(cm);
  return {
    ft: Math.floor(inches / 12),
    in: Math.round(inches % 12),
  };
}

/**
 * Converts feet and inches to centimeters.
 */
export function ftInToCm(ft: number, inch: number): number {
  const totalInches = ft * 12 + inch;
  return inchesToCm(totalInches);
}
