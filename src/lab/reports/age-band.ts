/** L11 / Decision 3 (default, to confirm): HMIS-style bands, age taken on the day the result was verified. */
export enum AgeBand {
  UNDER_5 = 'under_5',
  AGE_5_12 = '5_12',
  AGE_13_17 = '13_17',
  AGE_18_59 = '18_59',
  AGE_60_PLUS = '60_plus',
}

export const AGE_BAND_LABEL: Record<AgeBand, string> = {
  [AgeBand.UNDER_5]: 'Under 5',
  [AgeBand.AGE_5_12]: '5-12',
  [AgeBand.AGE_13_17]: '13-17',
  [AgeBand.AGE_18_59]: '18-59',
  [AgeBand.AGE_60_PLUS]: '60+',
};

export const AGE_BAND_ORDER = Object.values(AgeBand);

/** Whole years at the result date; patients with no date of birth fall into no band. */
export const AGE_AT_RESULT_SQL = `date_part('year', age(item."verifiedAt"::date, patient."dateOfBirth"::date))`;

export const AGE_BAND_SQL = `CASE
  WHEN ${AGE_AT_RESULT_SQL} < 5 THEN '${AgeBand.UNDER_5}'
  WHEN ${AGE_AT_RESULT_SQL} < 13 THEN '${AgeBand.AGE_5_12}'
  WHEN ${AGE_AT_RESULT_SQL} < 18 THEN '${AgeBand.AGE_13_17}'
  WHEN ${AGE_AT_RESULT_SQL} < 60 THEN '${AgeBand.AGE_18_59}'
  WHEN ${AGE_AT_RESULT_SQL} >= 60 THEN '${AgeBand.AGE_60_PLUS}'
END`;
