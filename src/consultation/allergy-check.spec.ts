import { allergyEntries, findAllergyMatches } from './allergy-check';

describe('allergy check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('splits the free-text allergies into entries', () => {
    // Arrange
    const recorded = 'Penicillin (rash); sulfa drugs\nPeanuts';

    // Act
    const entries = allergyEntries(recorded);

    // Assert
    expect(entries).toEqual(['Penicillin (rash)', 'sulfa drugs', 'Peanuts']);
  });

  it('ignores "none known" style entries', () => {
    // Arrange / Act
    const entries = allergyEntries('None known');

    // Assert
    expect(entries).toEqual([]);
  });

  it('flags a medication whose name contains an allergy word', () => {
    // Arrange
    const medications = [
      { name: 'Benzylpenicillin 1MU injection', genericName: null },
      { name: 'Paracetamol 500mg', genericName: 'Paracetamol' },
    ];

    // Act
    const matches = findAllergyMatches('Penicillin', medications);

    // Assert
    expect(matches).toEqual([
      { allergy: 'Penicillin', medication: 'Benzylpenicillin 1MU injection' },
    ]);
  });

  it('matches on the generic name too', () => {
    // Arrange
    const medications = [{ name: 'Septrin', genericName: 'Sulfamethoxazole' }];

    // Act
    const matches = findAllergyMatches('sulfa', medications);

    // Assert
    expect(matches).toEqual([{ allergy: 'sulfa', medication: 'Septrin' }]);
  });

  it('finds nothing when no allergies are recorded', () => {
    // Arrange / Act
    const matches = findAllergyMatches(null, [{ name: 'Amoxicillin' }]);

    // Assert
    expect(matches).toEqual([]);
  });
});
