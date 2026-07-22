import { Injectable } from '@nestjs/common';
import { CreateTraigeDto } from './dto/create-traige.dto';
import { UpdateTraigeDto } from './dto/update-traige.dto';

@Injectable()
export class TraigeService {
  create(createTraigeDto: CreateTraigeDto) {
    return 'This action adds a new traige';
  }

  findAll() {
    return `This action returns all traige`;
  }

  findOne(id: number) {
    return `This action returns a #${id} traige`;
  }

  update(id: number, updateTraigeDto: UpdateTraigeDto) {
    return `This action updates a #${id} traige`;
  }

  remove(id: number) {
    return `This action removes a #${id} traige`;
  }
}
