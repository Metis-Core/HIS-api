import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { BaseCrudService } from 'common/services/crud.service';
import { IPagination } from 'common/response-format';
import { AvailabilityStatus } from 'common/enums/availability-status.enum';
import { Department } from 'common/enums/department.enum';
import { UserRole } from 'common/enums/userRoles.enum';
import { AccountStatus } from 'common/enums/userStatus.enum';
import { User } from 'src/users/entities/user.entity';
import { AvailabilityPeriodsService } from './availability-periods.service';
import { QueryStaffAvailabilityDto } from './dto/query-staff-availability.dto';

export interface StaffAvailability {
  id: string;
  username: string;
  role: UserRole;
  department: Department;
  availability: AvailabilityStatus;
  until: Date | null;
  note: string | null;
}

@Injectable()
export class StaffAvailabilityService extends BaseCrudService<User> {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly periods: AvailabilityPeriodsService,
  ) {
    super(users);
  }

  async search(
    query: QueryStaffAvailabilityDto,
  ): Promise<IPagination<StaffAvailability>> {
    const base: FindOptionsWhere<User> = {
      status: AccountStatus.ACTIVE,
      ...(query.role ? { role: query.role } : {}),
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
    const statuses = await this.periods.statusFor(page.items.map((u) => u.id));
    const items = page.items.map((user) => {
      const resolved = statuses.get(user.id)!;
      return {
        id: user.id,
        username: user.username,
        role: user.role,
        department: user.department,
        availability: resolved.status,
        until: resolved.until,
        note: resolved.note,
      };
    });
    return { ...page, items };
  }
}
