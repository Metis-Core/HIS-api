import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import { BaseCrudService } from 'common/services/crud.service';
import { IPagination } from 'common/response-format';
import { Department } from 'common/enums/department.enum';
import { AvailabilityStatus } from 'common/enums/availability-status.enum';
import { UserRole } from 'common/enums/userRoles.enum';
import { AccountStatus } from 'common/enums/userStatus.enum';
import { QueueEntry } from 'src/queue/entities/queue-entry.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { QueueEntryStatus } from 'src/queue/enums/queue-entry-status.enum';
import { User } from 'src/users/entities/user.entity';
import { QueryDoctorsDto } from './dto/query-doctors.dto';
import { AvailabilityPeriodsService } from 'src/availability/availability-periods.service';
import { DoctorCandidate, isAssignable } from './doctor-selection';

const WORKLOAD_WINDOW_DAYS = 7;
const OPEN_STATUSES = [
  QueueEntryStatus.WAITING,
  QueueEntryStatus.CALLED,
  QueueEntryStatus.IN_SERVICE,
];

export interface DoctorSummary {
  id: string;
  username: string;
  email: string;
  department: Department;
  availability: AvailabilityStatus;
  availabilityNote: string | null;
  availableAgainAt: Date | null;
  assignable: boolean;
  waiting: number;
}

interface Workload {
  waiting: number;
  lastAssignedAt: Date | null;
}

@Injectable()
export class DoctorDirectoryService extends BaseCrudService<User> {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Visit)
    private readonly visits: Repository<Visit>,
    private readonly availability: AvailabilityPeriodsService,
  ) {
    super(users);
  }

  async search(query: QueryDoctorsDto): Promise<IPagination<DoctorSummary>> {
    const base: FindOptionsWhere<User> = {
      role: UserRole.DOCTOR,
      status: AccountStatus.ACTIVE,
    };
    const term = query.search?.trim();
    const where = term
      ? [
          { ...base, username: ILike(`%${term}%`) },
          { ...base, email: ILike(`%${term}%`) },
        ]
      : base;
    const page = await this.findPage(
      { where, order: { username: 'ASC', id: 'ASC' } },
      query,
    );
    const ids = page.items.map((user) => user.id);
    const [workload, statuses] = await Promise.all([
      this.workloadFor(ids),
      this.availability.statusFor(ids),
    ]);
    const items = page.items.map((user) => {
      const resolved = statuses.get(user.id)!;
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        department: user.department,
        availability: resolved.status,
        availabilityNote: resolved.note,
        availableAgainAt: resolved.until,
        assignable: isAssignable(resolved.status),
        waiting: workload.get(user.id)?.waiting ?? 0,
      };
    });
    return { ...page, items };
  }

  async candidates(): Promise<DoctorCandidate[]> {
    const doctors = await this.users.find({
      where: { role: UserRole.DOCTOR, status: AccountStatus.ACTIVE },
    });
    const ids = doctors.map((user) => user.id);
    const [workload, statuses] = await Promise.all([
      this.workloadFor(ids),
      this.availability.statusFor(ids),
    ]);
    return doctors.map((user) => ({
      id: user.id,
      availability: statuses.get(user.id)!.status,
      waiting: workload.get(user.id)?.waiting ?? 0,
      lastAssignedAt: workload.get(user.id)?.lastAssignedAt ?? null,
    }));
  }

  async isEligible(doctorId: string | null): Promise<boolean> {
    if (!doctorId) return false;
    const candidates = await this.candidates();
    const doctor = candidates.find((candidate) => candidate.id === doctorId);
    return Boolean(doctor && isAssignable(doctor.availability));
  }

  private async workloadFor(
    doctorIds: string[],
  ): Promise<Map<string, Workload>> {
    if (doctorIds.length === 0) return new Map();
    const since = new Date(Date.now() - WORKLOAD_WINDOW_DAYS * 86_400_000);
    const rows = await this.visits
      .createQueryBuilder('visit')
      .leftJoin(
        QueueEntry,
        'entry',
        'entry.visitId = visit.id AND entry.department = :department AND entry.status IN (:...open)',
        { department: Department.OUTPATIENT_CLINIC, open: OPEN_STATUSES },
      )
      .select('visit.assignedDoctorId', 'doctorId')
      .addSelect('COUNT(DISTINCT entry.visitId)', 'waiting')
      .addSelect('MAX(visit.assignedAt)', 'lastAssignedAt')
      .where({ assignedDoctorId: In(doctorIds) })
      .andWhere('visit.assignedAt >= :since', { since })
      .groupBy('visit.assignedDoctorId')
      .getRawMany<{
        doctorId: string;
        waiting: string;
        lastAssignedAt: Date | null;
      }>();
    return new Map(
      rows.map((row) => [
        row.doctorId,
        {
          waiting: Number(row.waiting),
          lastAssignedAt: row.lastAssignedAt
            ? new Date(row.lastAssignedAt)
            : null,
        },
      ]),
    );
  }
}
