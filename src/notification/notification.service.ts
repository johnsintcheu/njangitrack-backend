import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private africastalking: any;

  constructor(private prisma: PrismaService) {
    this.initAfricasTalking();
  }

  private initAfricasTalking() {
    try {
      const AT_API_KEY = process.env.AT_API_KEY;
      const AT_USERNAME = process.env.AT_USERNAME || 'sandbox';

      if (AT_API_KEY) {
        const AfricasTalking = require('africastalking');
        const at = AfricasTalking({
          apiKey: AT_API_KEY,
          username: AT_USERNAME,
        });
        this.africastalking = at.SMS;
        this.logger.log('✅ Africa\'s Talking SMS initialized');
      } else {
        this.logger.warn('⚠️  AT_API_KEY not set — running in simulation mode');
      }
    } catch (e) {
      this.logger.warn('⚠️  Africa\'s Talking not available — simulation mode');
    }
  }

  async sendNotification(data: {
    recipientId: string;
    type: string;
    channel: 'SMS' | 'PUSH';
    messageContent: string;
    phoneNumber?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        recipientId: data.recipientId,
        type: data.type,
        channel: data.channel,
        messageContent: data.messageContent,
        deliveryStatus: 'PENDING',
      },
    });

    this.logger.log(
      `📨 Sending ${data.channel} to member ${data.recipientId}: ${data.messageContent}`,
    );

    try {
      if (data.channel === 'SMS' && this.africastalking && data.phoneNumber) {
        // Send real SMS via Africa's Talking
        await this.africastalking.send({
          to: [data.phoneNumber],
          message: data.messageContent,
          from: process.env.AT_SENDER_ID || 'NjangiTrack',
        });
        this.logger.log(`📱 Real SMS sent to ${data.phoneNumber}`);
      } else {
        // Simulation mode
        this.logger.log(`🔄 Simulation: SMS would be sent to member ${data.recipientId}`);
      }

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          deliveryStatus: 'SENT',
          sentAt: new Date(),
        },
      });

      this.logger.log(`✅ Notification sent successfully to ${data.recipientId}`);
    } catch (e) {
      this.logger.error(`❌ Failed to send notification: ${e.message}`);
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { deliveryStatus: 'FAILED' },
      });
    }

    return notification;
  }

  async getNotificationsByMember(recipientId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async retryFailedNotifications() {
    const failed = await this.prisma.notification.findMany({
      where: { deliveryStatus: 'FAILED', retryCount: { lt: 3 } },
    });

    for (const notification of failed) {
      this.logger.log(`🔄 Retrying notification ${notification.id}...`);
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          deliveryStatus: 'RETRYING',
          retryCount: notification.retryCount + 1,
        },
      });
    }

    return failed.length;
  }
}
