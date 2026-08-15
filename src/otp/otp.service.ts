import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomInt, randomUUID } from 'crypto';
import { BaseCrudService } from '../../common/services/crud.service';
import { OneTimePassword } from './entities/otp.entity';
import { VerifyOtpDto } from './dto/verify-otp.dto';

const OTP_LENGTH = 4;
const OTP_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 5;

@Injectable()
export class OtpService extends BaseCrudService<OneTimePassword> {
  constructor(
    @InjectRepository(OneTimePassword)
    private readonly otpRepository: Repository<OneTimePassword>,
  ) {
    super(otpRepository);
  }

  async generate(userId: string): Promise<{ verificationToken: string; expiresAt: Date }> {
    const code = randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
    const verificationToken = randomUUID();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.create({
      userId,
      verificationToken,
      codeHash: this.hashCode(code),
      expiresAt,
    });

    // delivery integration (SMS/email) happens elsewhere; log for now
    console.log(`OTP for user ${userId}: ${code}`);

    return { verificationToken, expiresAt };
  }

  async verify(dto: VerifyOtpDto): Promise<{ verified: true }> {
    const otp = await this.otpRepository.findOne({
      where: { verificationToken: dto.verificationToken },
    });
    if (!otp) {
      throw new NotFoundException('Verification token not found');
    }
    if (otp.verifiedAt) {
      throw new BadRequestException('OTP already verified');
    }
    if (otp.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('OTP has expired');
    }
    if (otp.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException('Maximum verification attempts exceeded');
    }

    if (otp.codeHash !== this.hashCode(dto.code)) {
      await this.otpRepository.update(otp.id, { attempts: otp.attempts + 1 });
      throw new BadRequestException('Invalid OTP code');
    }

    await this.otpRepository.update(otp.id, { verifiedAt: new Date() });
    return { verified: true };
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }
}
