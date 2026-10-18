import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from 'common/enums/department.enum';
import { UserRole } from 'common/enums/userRoles.enum';
import { AccountStatus } from 'common/enums/userStatus.enum';
import { QueueEntry } from 'src/queue/entities/queue-entry.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { AssignmentSource } from 'src/queue/enums/assignment-source.enum';
import { QueueEntryStatus } from 'src/queue/enums/queue-entry-status.enum';
import { VisitTypeEnum } from 'src/queue/enums/visit-type.enum';
import { DoctorDirectoryService } from './doctor-directory.service';
import { isAssignable, pickDoctor } from './doctor-selection';
import { ReassignVisitDto } from './dto/reassign-visit.dto';
import { DoctorAssignedEvent } from './events/doctor-assigned.event';
import { DoctorRequestUnavailableEvent } from './events/doctor-request-unavailable.event';

const READY_AND_UNSTARTED = `entry.status IN (:...unstarted) AND NOT EXISTS (
  SELECT 1 FROM "queue_entries" earlier
  WHERE earlier."visitId" = entry."visitId"
    AND earlier."deletedAt" IS NULL
    AND earlier."sequenceNumber" < entry."sequenceNumber"
    AND earlier."status" IN (:...open))`;

const OPEN_STATUSES = [
  QueueEntryStatus.WAITING,
  QueueEntryStatus.CALLED,
  QueueEntryStatus.IN_SERVICE,
];

const REQUESTED_REASON = 'Asked for by the patient';

interface AssignmentTrail {
  source: AssignmentSource;
  byId?: string;
  reason?: string;
}

@Injectable()
export class DoctorAssignmentService {
  private tail: Promise<unknown> = Promise.resolve();

  constructor(
    @InjectRepository(Visit)
    private readonly visits: Repository<Visit>,
    private readonly directory: DoctorDirectoryService,
    private readonly events: EventEmitter2,
  ) {}

  assignIfNeeded(visitId: string): Promise<Visit> {
    return this.serial(async () => {
      const visit = await this.loadVisit(visitId);
      if (await this.directory.isEligible(visit.assignedDoctorId)) return visit;
      return this.pickFor(visit);
    });
  }

  assignEmergency(visitId: string): Promise<Visit | null> {
    return this.serial(async () => {
      const visit = await this.loadVisit(visitId);
      if (visit.visitType !== VisitTypeEnum.EMERGENCY) return null;
      if (await this.directory.isEligible(visit.assignedDoctorId)) return visit;
      return this.pickFor(visit);
    });
  }

  rebalance(visitId: string): Promise<Visit> {
    return this.serial(async () => this.pickFor(await this.loadVisit(visitId)));
  }

  assignManually(
    visitId: string,
    dto: ReassignVisitDto,
    byId: string,
  ): Promise<Visit> {
    return this.serial(async () => {
      const visit = await this.loadVisit(visitId);
      const doctor = await this.directory.findOne(dto.doctorId);
      if (
        doctor.role !== UserRole.DOCTOR ||
        doctor.status !== AccountStatus.ACTIVE
      ) {
        throw new BadRequestException('Pick an active doctor');
      }
      const candidates = await this.directory.candidates();
      const candidate = candidates.find((c) => c.id === doctor.id);
      if (!candidate || !isAssignable(candidate.availability)) {
        throw new BadRequestException(
          `${doctor.username} is ${candidate?.availability.replaceAll('_', ' ') ?? 'unavailable'}`,
        );
      }
      return this.apply(visit, doctor.id, {
        source: AssignmentSource.MANUAL,
        byId,
        reason: dto.reason.trim(),
      });
    });
  }

  /** Gives the patient to the doctor they asked for; if that doctor cannot take them, the usual choice applies and reception is told. */
  assignRequested(
    visitId: string,
    doctorId: string,
    byId: string,
  ): Promise<Visit> {
    return this.serial(async () => {
      const visit = await this.loadVisit(visitId);
      const candidates = await this.directory.candidates();
      const candidate = candidates.find((c) => c.id === doctorId);
      if (candidate && isAssignable(candidate.availability)) {
        return this.apply(
          visit,
          doctorId,
          { source: AssignmentSource.MANUAL, byId, reason: REQUESTED_REASON },
          true,
        );
      }
      const fallback = await this.pickFor(visit);
      this.events.emit(
        DoctorRequestUnavailableEvent.channel,
        new DoctorRequestUnavailableEvent(
          visitId,
          doctorId,
          byId,
          fallback.assignedDoctorId,
        ),
      );
      return fallback;
    });
  }

  claim(
    visitId: string,
    doctorId: string,
    mayTakeOver: boolean,
  ): Promise<Visit> {
    return this.serial(async () => {
      const visit = await this.loadVisit(visitId);
      if (visit.assignedDoctorId === doctorId) return visit;
      if (visit.assignedDoctorId && !mayTakeOver) {
        throw new ForbiddenException(
          `This patient is assigned to ${(await this.loadWithDoctor(visitId)).assignedDoctor?.username ?? 'another doctor'}`,
        );
      }
      return this.apply(visit, doctorId, {
        source: AssignmentSource.CLAIMED,
        byId: doctorId,
      });
    });
  }

  reconcile(): Promise<number> {
    return this.serial(async () => {
      const waiting = await this.unstartedConsultations();
      let moved = 0;
      for (const visit of waiting) {
        if (await this.directory.isEligible(visit.assignedDoctorId)) continue;
        const updated = await this.pickFor(visit);
        if (updated.assignedDoctorId !== visit.assignedDoctorId) moved++;
      }
      return moved;
    });
  }

  private unstartedConsultations(): Promise<Visit[]> {
    return this.visits
      .createQueryBuilder('visit')
      .innerJoin(
        QueueEntry,
        'entry',
        `entry.visitId = visit.id AND entry.department = :department AND ${READY_AND_UNSTARTED}`,
        {
          department: Department.OUTPATIENT_CLINIC,
          unstarted: [QueueEntryStatus.WAITING, QueueEntryStatus.CALLED],
          open: OPEN_STATUSES,
        },
      )
      .orderBy('visit.priority', 'DESC')
      .addOrderBy('visit.createdAt', 'ASC')
      .getMany();
  }

  private async pickFor(visit: Visit): Promise<Visit> {
    const candidates = await this.directory.candidates();
    const doctorId = pickDoctor(candidates);
    if (doctorId) {
      return this.apply(visit, doctorId, { source: AssignmentSource.AUTO });
    }
    return visit.assignedDoctorId ? this.release(visit) : visit;
  }

  private async apply(
    visit: Visit,
    doctorId: string,
    trail: AssignmentTrail,
    requested = false,
  ): Promise<Visit> {
    const previousDoctorId = visit.assignedDoctorId;
    visit.assignedDoctorId = doctorId;
    visit.assignedAt = new Date();
    visit.assignmentSource = trail.source;
    visit.metadata = {
      ...((visit.metadata ?? {}) as Record<string, unknown>),
      lastAssignment: {
        from: previousDoctorId,
        to: doctorId,
        at: visit.assignedAt.toISOString(),
        ...trail,
      },
    };
    await this.visits.save(visit);
    if (previousDoctorId !== doctorId) {
      this.events.emit(
        DoctorAssignedEvent.channel,
        new DoctorAssignedEvent(
          visit.id,
          doctorId,
          previousDoctorId,
          requested,
        ),
      );
    }
    return this.loadWithDoctor(visit.id);
  }

  private async release(visit: Visit): Promise<Visit> {
    visit.metadata = {
      ...((visit.metadata ?? {}) as Record<string, unknown>),
      lastAssignment: {
        from: visit.assignedDoctorId,
        to: null,
        at: new Date().toISOString(),
        source: AssignmentSource.AUTO,
        reason: 'No doctor available',
      },
    };
    visit.assignedDoctorId = null;
    visit.assignedAt = null;
    visit.assignmentSource = null;
    await this.visits.save(visit);
    return this.loadWithDoctor(visit.id);
  }

  private async loadVisit(visitId: string): Promise<Visit> {
    const visit = await this.visits.findOne({ where: { id: visitId } });
    if (!visit) throw new NotFoundException('Visit not found');
    return visit;
  }

  private async loadWithDoctor(visitId: string): Promise<Visit> {
    const visit = await this.visits.findOne({
      where: { id: visitId },
      relations: { assignedDoctor: true },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    return visit;
  }

  private serial<T>(work: () => Promise<T>): Promise<T> {
    const run = this.tail.then(work, work);
    this.tail = run.catch(() => undefined);
    return run;
  }
}
