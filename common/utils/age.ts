/** Whole years between a date of birth (YYYY-MM-DD or Date) and a moment; null when unknown. */
export function ageInYears(
  dateOfBirth: string | Date | null | undefined,
  at: Date,
): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  let years = at.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    at.getUTCMonth() < dob.getUTCMonth() ||
    (at.getUTCMonth() === dob.getUTCMonth() &&
      at.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) years -= 1;
  return years >= 0 ? years : null;
}
