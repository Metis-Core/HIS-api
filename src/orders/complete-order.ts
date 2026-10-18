import { BadRequestException } from '@nestjs/common';
import {
  interpretResult,
  LabPatientContext,
} from 'src/lab/results/interpret-result';
import {
  CRITICAL_FLAGS,
  LabResultData,
  LabResultFlags,
  LabResultSchema,
} from 'src/lab/results/result-schema.types';
import { validateResultData } from 'src/lab/results/validate-result-data';
import { OrderKind } from './enums/order-kind.enum';
import { ResultClassification } from './enums/result-classification.enum';

const MIN_TEXT = 3;

export interface CompletionInput {
  kind: OrderKind;
  schema: LabResultSchema | null | undefined;
  resultData?: LabResultData;
  classification?: ResultClassification;
  impression?: string;
  report?: string;
  patient: LabPatientContext;
}

export interface Completion {
  resultData: LabResultData | null;
  resultFlags: LabResultFlags;
  classification: ResultClassification | null;
  impression: string | null;
  report: string | null;
}

const clean = (value: string | undefined): string | null =>
  value?.trim() || null;

export function buildCompletion(input: CompletionInput): Completion {
  const radiology = input.kind === OrderKind.RADIOLOGY;
  const schema = input.schema?.fields?.length ? input.schema : null;
  const report = clean(input.report);
  const impression = clean(input.impression);
  const resultData = schema
    ? validateResultData(schema, input.resultData ?? {}, {
        requireComplete: true,
      })
    : null;
  if (!schema && (report?.length ?? 0) < MIN_TEXT) {
    throw new BadRequestException(
      radiology
        ? 'Write the findings before completing the study'
        : 'Write the procedure notes before completing the order',
    );
  }
  if (radiology && (impression?.length ?? 0) < MIN_TEXT) {
    throw new BadRequestException(
      'Write the impression before completing the study',
    );
  }
  const resultFlags =
    schema && resultData
      ? interpretResult(schema, resultData, input.patient)
      : {};
  const classification = input.classification ?? null;
  if (radiology && !classification) {
    throw new BadRequestException(
      'Classify the result as normal, abnormal or critical',
    );
  }
  const flagged = Object.values(resultFlags);
  if (classification === ResultClassification.NORMAL && flagged.length > 0) {
    throw new BadRequestException(
      'Some findings are outside the normal pattern; classify the result as abnormal or critical',
    );
  }
  if (
    flagged.some((flag) => CRITICAL_FLAGS.includes(flag)) &&
    classification !== ResultClassification.CRITICAL
  ) {
    throw new BadRequestException(
      'A critical value was entered; classify the result as critical',
    );
  }
  return { resultData, resultFlags, classification, impression, report };
}
