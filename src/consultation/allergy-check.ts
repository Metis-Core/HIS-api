export interface PrescribedMedication {
  name: string;
  genericName?: string | null;
}

export interface AllergyMatch {
  allergy: string;
  medication: string;
}

const MIN_WORD = 4;
const IGNORED = new Set([
  'none',
  'known',
  'drug',
  'drugs',
  'food',
  'allergy',
  'allergic',
  'allergies',
  'mild',
  'severe',
  'rash',
  'reaction',
  'tablet',
  'tablets',
  'capsule',
  'capsules',
  'syrup',
  'injection',
]);

const words = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= MIN_WORD && !IGNORED.has(word));

/** The patient's recorded allergies as separate entries, from the free-text field. */
export function allergyEntries(allergies: string | null | undefined): string[] {
  return (allergies ?? '')
    .split(/[,;\n]+/)
    .map((entry) => entry.trim())
    .filter((entry) => words(entry).length > 0);
}

// Name-based only: "penicillin" flags Benzylpenicillin but not amoxicillin (no drug classes yet).
export function findAllergyMatches(
  allergies: string | null | undefined,
  medications: readonly PrescribedMedication[],
): AllergyMatch[] {
  const entries = allergyEntries(allergies);
  return medications.flatMap((medication) => {
    const haystack = words(
      `${medication.name} ${medication.genericName ?? ''}`,
    );
    return entries
      .filter((entry) =>
        words(entry).some((term) =>
          haystack.some((word) => word.includes(term)),
        ),
      )
      .map((allergy) => ({ allergy, medication: medication.name }));
  });
}
