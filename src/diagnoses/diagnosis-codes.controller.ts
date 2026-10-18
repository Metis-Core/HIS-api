import { Controller, Get, Query } from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { Roles } from 'common/decorators/roles.decorator';
import { DiagnosisCodesService } from './diagnosis-codes.service';
import { QueryDiagnosisCodesDTO } from './dto/query-diagnosis-codes.dto';

@Controller('icd')
export class DiagnosisCodesController {
  constructor(private readonly codes: DiagnosisCodesService) {}

  @Get()
  @Roles(RoleGroups.CLINICAL_STAFF)
  search(@Query() query: QueryDiagnosisCodesDTO) {
    return this.codes.search(query);
  }
}
