import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.sessionReport.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateReportDto) {
    const report = await this.prisma.sessionReport.create({
      data: {
        groupId: dto.groupId,
        title: dto.title,
        meetingDate: new Date(dto.meetingDate),
        authorId: dto.authorId,
        authorName: dto.authorName,
        summary: dto.summary,
        contributionsTotalXAF: dto.contributionsTotalXAF,
        finesTotalXAF: dto.finesTotalXAF,
        socialFundBalanceXAF: dto.socialFundBalanceXAF,
        beneficiaryName: dto.beneficiaryName,
        attendeesCount: dto.attendeesCount,
        decisions: dto.decisions,
      },
    });

    this.logger.log(`📝 Report saved: ${report.title} (${report.id})`);
    return report;
  }
}
