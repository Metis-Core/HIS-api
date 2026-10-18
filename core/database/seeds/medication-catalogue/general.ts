import { med, SeedMedication } from './fields';

export const PAIN_AND_FEVER: SeedMedication[] = [
  med('PCM500T', 'Paracetamol', '500 mg', 'Tablet', 50, 100, {
    minStock: 1000,
  }),
  med('PCM120S', 'Paracetamol', '120 mg/5 mL', 'Syrup 100 mL', 2500, 10),
  med('PCM1GI', 'Paracetamol', '1 g/100 mL', 'Infusion', 6000, 10),
  med('IBU400T', 'Ibuprofen', '400 mg', 'Tablet', 100, 100, { minStock: 300 }),
  med('IBU100S', 'Ibuprofen', '100 mg/5 mL', 'Suspension 100 mL', 4000, 10),
  med('DIC50T', 'Diclofenac', '50 mg', 'Tablet', 150, 100),
  med('DIC75I', 'Diclofenac', '75 mg/3 mL', 'Injection ampoule', 1000, 10),
  med('ASA300T', 'Aspirin', '300 mg', 'Tablet', 100, 100),
  med('TRA50C', 'Tramadol', '50 mg', 'Capsule', 500, 100, { controlled: true }),
  med('MOR10I', 'Morphine', '10 mg/mL', 'Injection ampoule', 5000, 10, {
    controlled: true,
  }),
  med('PET50I', 'Pethidine', '50 mg/mL', 'Injection ampoule', 3000, 10, {
    controlled: true,
  }),
];

export const GASTROINTESTINAL: SeedMedication[] = [
  med('OME20C', 'Omeprazole', '20 mg', 'Capsule', 300, 100),
  med('OME40I', 'Omeprazole', '40 mg', 'Injection vial', 8000, 10),
  med(
    'ANT500T',
    'Aluminium hydroxide/Magnesium trisilicate',
    '250/250 mg',
    'Tablet',
    100,
    100,
  ),
  med('MCP10T', 'Metoclopramide', '10 mg', 'Tablet', 100, 100),
  med('ONS4T', 'Ondansetron', '4 mg', 'Tablet', 500, 10),
  med('ONS4I', 'Ondansetron', '4 mg/2 mL', 'Injection ampoule', 2000, 10),
  med('HYO10T', 'Hyoscine butylbromide', '10 mg', 'Tablet', 300, 100),
  med('LOP2C', 'Loperamide', '2 mg', 'Capsule', 300, 100),
  med('BIS5T', 'Bisacodyl', '5 mg', 'Tablet', 100, 100),
  med('LAC667S', 'Lactulose', '3.35 g/5 mL', 'Syrup 200 mL', 15000, 10),
  med('ORS1S', 'Oral rehydration salts', '20.5 g', 'Sachet', 500, 100),
  med('ZNC20T', 'Zinc sulfate', '20 mg', 'Dispersible tablet', 300, 100),
];

export const RESPIRATORY_AND_ALLERGY: SeedMedication[] = [
  med('SAL4T', 'Salbutamol', '4 mg', 'Tablet', 100, 100),
  med('SAL100H', 'Salbutamol', '100 mcg/dose', 'Inhaler 200 doses', 12000, 10),
  med('SAL25N', 'Salbutamol', '2.5 mg/2.5 mL', 'Nebuliser solution', 1500, 20),
  med('PRD5T', 'Prednisolone', '5 mg', 'Tablet', 100, 100),
  med('DEX4I', 'Dexamethasone', '4 mg/mL', 'Injection ampoule', 1000, 10),
  med('HCT100I', 'Hydrocortisone', '100 mg', 'Injection vial', 3000, 10),
  med('CPM4T', 'Chlorphenamine', '4 mg', 'Tablet', 50, 100),
  med('LOR10T', 'Loratadine', '10 mg', 'Tablet', 300, 100),
  med('CET10T', 'Cetirizine', '10 mg', 'Tablet', 300, 100),
  med('PMZ25I', 'Promethazine', '25 mg/mL', 'Injection ampoule', 1500, 10),
  med('CGH100S', 'Cough expectorant', '100 mL', 'Syrup', 4000, 10),
];

export const GENERAL: SeedMedication[] = [
  ...PAIN_AND_FEVER,
  ...GASTROINTESTINAL,
  ...RESPIRATORY_AND_ALLERGY,
];
