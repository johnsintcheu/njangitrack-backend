import { Controller, Get, Post, Body } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  findAll() {
    return this.reportsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateReportDto) {
    return this.reportsService.create(dto);
  }
}
