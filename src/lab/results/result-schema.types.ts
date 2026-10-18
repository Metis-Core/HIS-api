export type LabResultFieldType = 'number' | 'text' | 'select' | 'boolean';

export type LabRangeSex = 'male' | 'female';

/** One reference interval; sex and age bounds narrow who it applies to. */
export interface LabReferenceRange {
  sex?: LabRangeSex;
  minAgeYears?: number;
  maxAgeYears?: number;
  low?: number;
  high?: number;
  criticalLow?: number;
  criticalHigh?: number;
}

export interface LabResultField {
  key: string;
  label: string;
  type: LabResultFieldType;
  unit?: string;
  options?: string[];
  required?: boolean;
  helpText?: string;
  group?: string;
  ranges?: LabReferenceRange[];
  // For select/text/boolean fields: any other answer is outside the normal pattern.
  normalValues?: string[];
}

export interface LabResultSchema {
  fields: LabResultField[];
}

export type LabResultValue = string | number | boolean;

export type LabResultData = Record<string, LabResultValue>;

export enum LabResultFlag {
  LOW = 'low',
  HIGH = 'high',
  CRITICAL_LOW = 'critical_low',
  CRITICAL_HIGH = 'critical_high',
  ABNORMAL = 'abnormal',
}

export type LabResultFlags = Record<string, LabResultFlag>;

export const CRITICAL_FLAGS: readonly LabResultFlag[] = [
  LabResultFlag.CRITICAL_LOW,
  LabResultFlag.CRITICAL_HIGH,
];
