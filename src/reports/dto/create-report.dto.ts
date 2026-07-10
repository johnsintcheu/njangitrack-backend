export class CreateReportDto {
  groupId: string;
  title: string;
  meetingDate: string;
  authorId: string;
  authorName: string;
  summary: string;
  contributionsTotalXAF: number;
  finesTotalXAF: number;
  socialFundBalanceXAF: number;
  beneficiaryName?: string;
  attendeesCount: number;
  decisions?: string;
}
