import { UnitOfMeasure } from 'src/inventory/enums/uintMeasure.enum';
import { med, SeedMedication } from './fields';

export const CARDIOVASCULAR_AND_DIABETES: SeedMedication[] = [
  med('AML5T', 'Amlodipine', '5 mg', 'Tablet', 150, 30, { minStock: 300 }),
  med('NIF20T', 'Nifedipine', '20 mg', 'Retard tablet', 150, 100),
  med('ATE50T', 'Atenolol', '50 mg', 'Tablet', 150, 100),
  med('ENA5T', 'Enalapril', '5 mg', 'Tablet', 200, 100),
  med('LOS50T', 'Losartan', '50 mg', 'Tablet', 400, 30),
  med('HCZ25T', 'Hydrochlorothiazide', '25 mg', 'Tablet', 100, 100),
  med('FUR40T', 'Furosemide', '40 mg', 'Tablet', 100, 100),
  med('FUR20I', 'Furosemide', '20 mg/2 mL', 'Injection ampoule', 800, 10),
  med('ASA75T', 'Aspirin', '75 mg', 'Tablet', 100, 100),
  med('ATV20T', 'Atorvastatin', '20 mg', 'Tablet', 600, 30),
  med('MET500T', 'Metformin', '500 mg', 'Tablet', 150, 100, { minStock: 300 }),
  med('GLB5T', 'Glibenclamide', '5 mg', 'Tablet', 100, 100),
  med('GLC80T', 'Gliclazide', '80 mg', 'Tablet', 400, 60),
  med(
    'INSR100V',
    'Insulin soluble',
    '100 IU/mL',
    'Injection vial 10 mL',
    35000,
    1,
    { minStock: 3, packUnit: UnitOfMeasure.PCS },
  ),
  med(
    'INSN100V',
    'Insulin isophane',
    '100 IU/mL',
    'Injection vial 10 mL',
    35000,
    1,
    { minStock: 3, packUnit: UnitOfMeasure.PCS },
  ),
  med('DEX50I', 'Dextrose', '50%', 'Injection 50 mL', 3000, 10),
];

export const NEUROLOGY_AND_PSYCHIATRY: SeedMedication[] = [
  med('PHB30T', 'Phenobarbital', '30 mg', 'Tablet', 100, 100, {
    controlled: true,
  }),
  med('CBZ200T', 'Carbamazepine', '200 mg', 'Tablet', 200, 100),
  med('PHT100T', 'Phenytoin', '100 mg', 'Tablet', 200, 100),
  med('DZP5T', 'Diazepam', '5 mg', 'Tablet', 200, 100, { controlled: true }),
  med('DZP10I', 'Diazepam', '10 mg/2 mL', 'Injection ampoule', 1500, 10, {
    controlled: true,
  }),
  med('AMT25T', 'Amitriptyline', '25 mg', 'Tablet', 100, 100),
  med('HAL5T', 'Haloperidol', '5 mg', 'Tablet', 200, 100),
  med(
    'MGS50I',
    'Magnesium sulfate',
    '50% (10 mL)',
    'Injection ampoule',
    3000,
    10,
  ),
];

export const WOMENS_HEALTH_AND_NUTRITION: SeedMedication[] = [
  med('OXY10I', 'Oxytocin', '10 IU/mL', 'Injection ampoule', 2500, 10),
  med('MSP200T', 'Misoprostol', '200 mcg', 'Tablet', 3000, 4),
  med('MDP250T', 'Methyldopa', '250 mg', 'Tablet', 300, 100),
  med('FES200T', 'Ferrous sulfate', '200 mg', 'Tablet', 50, 1000, {
    minStock: 500,
  }),
  med(
    'FEF200T',
    'Ferrous sulfate/Folic acid',
    '200/0.4 mg',
    'Tablet',
    80,
    1000,
    { minStock: 500 },
  ),
  med('FOL5T', 'Folic acid', '5 mg', 'Tablet', 50, 1000, { minStock: 500 }),
  med(
    'COC28T',
    'Combined oral contraceptive',
    '28-day',
    'Pill cycle',
    3000,
    50,
  ),
  med(
    'DMPA150I',
    'Medroxyprogesterone',
    '150 mg/mL',
    'Injection vial',
    5000,
    10,
  ),
  med('LNG15T', 'Levonorgestrel', '1.5 mg', 'Tablet', 5000, 10),
  med('VITA200C', 'Vitamin A', '200,000 IU', 'Capsule', 500, 100),
  med('VITBCT', 'Vitamin B complex', '', 'Tablet', 50, 1000, { minStock: 500 }),
  med('VITC100T', 'Vitamin C', '100 mg', 'Tablet', 50, 1000, { minStock: 500 }),
  med('MVS100S', 'Multivitamin', '100 mL', 'Syrup', 6000, 10),
  med(
    'VITK10I',
    'Phytomenadione (Vitamin K)',
    '10 mg/mL',
    'Injection ampoule',
    2000,
    10,
  ),
];

export const EMERGENCY_AND_ANAESTHETIC: SeedMedication[] = [
  med('ADR1I', 'Adrenaline', '1 mg/mL', 'Injection ampoule', 2000, 10, {
    minStock: 20,
  }),
  med('ATR1I', 'Atropine', '1 mg/mL', 'Injection ampoule', 1500, 10),
  med(
    'TXA500I',
    'Tranexamic acid',
    '500 mg/5 mL',
    'Injection ampoule',
    3000,
    10,
  ),
  med('LID2I', 'Lidocaine', '2% (20 mL)', 'Injection vial', 3000, 10),
  med('KET50I', 'Ketamine', '50 mg/mL (10 mL)', 'Injection vial', 15000, 10, {
    controlled: true,
  }),
  med('TT05I', 'Tetanus toxoid', '0.5 mL', 'Injection vial', 5000, 10),
];

export const FLUIDS: SeedMedication[] = [
  med('NS500F', 'Sodium chloride', '0.9% (500 mL)', 'Infusion', 3500, 20, {
    minStock: 40,
  }),
  med('RL500F', "Ringer's lactate", '500 mL', 'Infusion', 3500, 20, {
    minStock: 40,
  }),
  med('D5500F', 'Dextrose', '5% (500 mL)', 'Infusion', 3500, 20),
  med(
    'DNS500F',
    'Dextrose/Sodium chloride',
    '5%/0.9% (500 mL)',
    'Infusion',
    3500,
    20,
  ),
  med('WFI10I', 'Water for injection', '10 mL', 'Ampoule', 500, 100),
];

export const TOPICALS_AND_EYE: SeedMedication[] = [
  med('POV10L', 'Povidone iodine', '10% (500 mL)', 'Solution', 12000, 12),
  med('SSD1C', 'Silver sulfadiazine', '1%', 'Cream 50 g', 12000, 10),
  med('HCT1C', 'Hydrocortisone', '1%', 'Cream 15 g', 4000, 10),
  med('BTM1C', 'Betamethasone', '0.1%', 'Cream 15 g', 4000, 10),
  med('CAL100L', 'Calamine', '100 mL', 'Lotion', 4000, 10),
  med('TET1E', 'Tetracycline', '1%', 'Eye ointment 5 g', 2500, 10),
  med('CHL05E', 'Chloramphenicol', '0.5%', 'Eye drops 10 mL', 3000, 10),
  med('CIP03E', 'Ciprofloxacin', '0.3%', 'Eye drops 5 mL', 3500, 10),
];

export const CHRONIC_AND_OTHER: SeedMedication[] = [
  ...CARDIOVASCULAR_AND_DIABETES,
  ...NEUROLOGY_AND_PSYCHIATRY,
  ...WOMENS_HEALTH_AND_NUTRITION,
  ...EMERGENCY_AND_ANAESTHETIC,
  ...FLUIDS,
  ...TOPICALS_AND_EYE,
];
