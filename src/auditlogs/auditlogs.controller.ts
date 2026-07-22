import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuditlogsService } from './auditlogs.service';
import { CreateAuditlogDto } from './dto/create-auditlog.dto';
import { UpdateAuditlogDto } from './dto/update-auditlog.dto';

@Controller('auditlogs')
export class AuditlogsController {
  constructor(private readonly auditlogsService: AuditlogsService) {}

  @Post()
  create(@Body() createAuditlogDto: CreateAuditlogDto) {
    return this.auditlogsService.create(createAuditlogDto);
  }

  @Get()
  findAll() {
    return this.auditlogsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditlogsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuditlogDto: UpdateAuditlogDto) {
    return this.auditlogsService.update(+id, updateAuditlogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.auditlogsService.remove(+id);
  }
}
