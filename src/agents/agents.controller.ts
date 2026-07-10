import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('agents')
export class AgentsController {
  constructor(private prisma: PrismaService) {}

  @Get('status')
  async status() {
    const logs = await this.prisma.agentRunLog.findMany();
    return logs.map((l) => ({
      agentName: l.agentName,
      service: 'Ledger Service',
      schedule: this.getSchedule(l.agentName),
      lastRunAt: l.lastRunAt,
      lastRunDurationMs: l.lastRunDurationMs,
      lastRunRecordsProcessed: l.lastRunRecordsProcessed,
      status: this.isStale(l.lastRunAt) ? 'STALE' : l.status,
    }));
  }

  private getSchedule(agentName: string): string {
    const schedules: Record<string, string> = {
      'Payout Readiness Agent': 'Every 1 minute',
      'Payment Verification Agent': 'Every 5 minutes',
    };
    return schedules[agentName] || 'Unknown';
  }

  private isStale(lastRunAt: Date): boolean {
    return Date.now() - new Date(lastRunAt).getTime() > 5 * 60 * 1000;
  }
}
