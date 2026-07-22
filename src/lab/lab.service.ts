import { Injectable } from '@nestjs/common';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';

@Injectable()
export class LabService {
  create(createLabDto: CreateLabDto) {
    return 'This action adds a new lab';
  }

  findAll() {
    return `This action returns all lab`;
  }

  findOne(id: number) {
    return `This action returns a #${id} lab`;
  }

  update(id: number, updateLabDto: UpdateLabDto) {
    return `This action updates a #${id} lab`;
  }

  remove(id: number) {
    return `This action removes a #${id} lab`;
  }
}
