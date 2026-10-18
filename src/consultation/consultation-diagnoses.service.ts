import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { DiagnosisCodesService } from 'src/diagnoses/diagnosis-codes.service';
import { ConsultationDiagnosisDTO } from './dto/consultation-diagnosis.dto';
import { ConsultationDiagnosis } from './entities/consultation-diagnosis.entity';

export type DiagnosisRow = Pick<
  ConsultationDiagnosis,
  'diagnosisCodeId' | 'system' | 'code' | 'title' | 'isPrimary' | 'rank'
>;

/** Validates picked catalogue codes and stores them as the consultation's coded diagnoses. */
@Injectable()
export class ConsultationDiagnosesService {
  constructor(private readonly codes: DiagnosisCodesService) {}

  async resolve(items: ConsultationDiagnosisDTO[]): Promise<DiagnosisRow[]> {
    const ids = items.map((item) => item.codeId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Each diagnosis can be added only once');
    }
    if (items.filter((item) => item.isPrimary).length > 1) {
      throw new BadRequestException('Only one diagnosis can be primary');
    }
    const found = new Map(
      (await this.codes.findByIds(ids)).map((code) => [code.id, code]),
    );
    if (found.size !== ids.length) {
      throw new BadRequestException('One or more diagnosis codes do not exist');
    }
    const primaryIndex = Math.max(
      0,
      items.findIndex((item) => item.isPrimary),
    );
    return items.map((item, rank) => {
      const code = found.get(item.codeId)!;
      return {
        diagnosisCodeId: code.id,
        system: code.system,
        code: code.code,
        title: code.title,
        isPrimary: rank === primaryIndex,
        rank,
      };
    });
  }

  async replace(
    manager: EntityManager,
    consultationId: string,
    rows: DiagnosisRow[],
  ): Promise<void> {
    await manager.delete(ConsultationDiagnosis, { consultationId });
    if (rows.length === 0) return;
    await manager.save(
      rows.map((row) =>
        manager.create(ConsultationDiagnosis, { ...row, consultationId }),
      ),
    );
  }
}
