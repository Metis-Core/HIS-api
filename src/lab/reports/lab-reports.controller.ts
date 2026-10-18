import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { RoleGroups } from 'common/access/role-groups';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRole } from 'common/enums/userRoles.enum';
import { CsvValue, toCsv } from 'common/utils/to-csv';
import { AGE_BAND_LABEL } from './age-band';
import { LabReportRow, LabReportsService } from './lab-reports.service';
import { QueryLabReportDto } from './query-lab-report.dto';

const CSV_COLUMNS: ReadonlyArray<{
  header: string;
  value: (row: LabReportRow) => CsvValue;
}> = [
  { header: 'Test code', value: (r) => r.testCode },
  { header: 'Test', value: (r) => r.testName },
  { header: 'Sex', value: (r) => r.gender },
  {
    header: 'Age band',
    value: (r) => (r.ageBand ? AGE_BAND_LABEL[r.ageBand] : 'Unknown'),
  },
  { header: 'Tests verified', value: (r) => r.total },
  { header: 'Abnormal', value: (r) => r.abnormal },
  { header: 'Critical', value: (r) => r.critical },
];

@Controller('lab/reports')
export class LabReportsController {
  constructor(private readonly reports: LabReportsService) {}

  @Get()
  @Roles(UserRole.LAB_TECH, RoleGroups.ADMINS)
  summary(@Query() query: QueryLabReportDto) {
    return this.reports.summary(query);
  }

  @Get('export')
  @Roles(UserRole.LAB_TECH, RoleGroups.ADMINS)
  async export(@Query() query: QueryLabReportDto, @Res() res: Response) {
    const csv = toCsv(CSV_COLUMNS, await this.reports.rows(query));
    const name = `lab-report_${query.from ?? 'start'}_${query.to ?? 'today'}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(`\uFEFF${csv}`);
  }
}
