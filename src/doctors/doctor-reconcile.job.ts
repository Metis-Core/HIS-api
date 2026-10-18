import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DoctorAssignmentService } from './doctor-assignment.service';

@Injectable()
export class DoctorReconcileJob {
  private readonly logger = new Logger(DoctorReconcileJob.name);

  constructor(private readonly assignment: DoctorAssignmentService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async run(): Promise<void> {
    try {
      const moved = await this.assignment.reconcile();
      if (moved > 0) this.logger.log(`Re-assigned ${moved} waiting patient(s)`);
    } catch (error) {
      this.logger.error('Doctor reconcile failed', error as Error);
    }
  }
}
