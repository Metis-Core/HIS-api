import { Consultation } from 'src/consultation/entities/consultation.entity';
import { renderDischargeSummary } from './discharge.template';

const consultation = (overrides: Partial<Consultation>) =>
  ({
    chiefComplaint: 'Fever',
    completedAt: new Date('2026-10-18T09:00:00Z'),
    ...overrides,
  }) as Consultation;

describe('renderDischargeSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prints the merged examination and assessment, escaped', () => {
    // Arrange
    const merged = 'Temp 39C <pale>\n\nLikely malaria';

    // Act
    const html = renderDischargeSummary({
      consultation: consultation({ examinationAndAssessment: merged }),
      labOrders: [],
      prescriptions: [],
    });

    // Assert
    expect(html).toContain('Examination and assessment');
    expect(html).toContain('Temp 39C &lt;pale&gt;');
  });

  it('leaves the section out when nothing was recorded', () => {
    // Arrange
    const empty = consultation({ examinationAndAssessment: null });

    // Act
    const html = renderDischargeSummary({
      consultation: empty,
      labOrders: [],
      prescriptions: [],
    });

    // Assert
    expect(html).not.toContain('Examination and assessment');
  });
});
