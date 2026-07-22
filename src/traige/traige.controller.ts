import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TraigeService } from './traige.service';
import { CreateTraigeDto } from './dto/create-traige.dto';
import { UpdateTraigeDto } from './dto/update-traige.dto';

@Controller('traige')
export class TraigeController {
  constructor(private readonly traigeService: TraigeService) {}

  @Post()
  create(@Body() createTraigeDto: CreateTraigeDto) {
    return this.traigeService.create(createTraigeDto);
  }

  @Get()
  findAll() {
    return this.traigeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.traigeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTraigeDto: UpdateTraigeDto) {
    return this.traigeService.update(+id, updateTraigeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.traigeService.remove(+id);
  }
}
