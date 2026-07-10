import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  sendNotification(
    @Body()
    body: {
      recipientId: string;
      type: string;
      channel: 'SMS' | 'PUSH';
      messageContent: string;
    },
  ) {
    return this.notificationService.sendNotification(body);
  }

  @Get('member/:recipientId')
  getNotificationsByMember(@Param('recipientId') recipientId: string) {
    return this.notificationService.getNotificationsByMember(recipientId);
  }
}
