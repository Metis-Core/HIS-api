import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { Service } from '../entities/service.entity';

@Exclude()
export class ServiceResponseDTO {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  fee: number;

  @Expose()
  description: string | null;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  static fromEntity(service: Service): ServiceResponseDTO {
    return plainToInstance(ServiceResponseDTO, service, {
      excludeExtraneousValues: true,
    });
  }

  static fromEntities(services: Service[]): ServiceResponseDTO[] {
    return services.map((service) => ServiceResponseDTO.fromEntity(service));
  }
}
