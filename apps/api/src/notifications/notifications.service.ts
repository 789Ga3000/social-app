import { Injectable } from '@nestjs/common';
import { CustomStoreService } from '../storage/custom-store.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly store: CustomStoreService) {}

  async list(userId: string) {
    const notifications = await this.store.listNotifications(userId);
    return {
      notifications: await Promise.all(notifications.map(async (n) => {
        const actor = await this.store.findUserById(n.actorId);
        const actorProfile = actor ? await this.store.getProfile(actor.id) : null;
        return {
          id: n.id,
          type: n.type,
          actor: actor ? {
            id: actor.id,
            username: actor.username,
            displayName: actor.displayName,
            avatarUrl: actorProfile?.profile?.avatarUrl || null,
          } : { id: 'unknown', username: 'unknown', displayName: 'Unknown User', avatarUrl: null },
          postId: n.postId,
          read: n.read,
          createdAt: n.createdAt,
        };
      }))
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.store.markNotificationAsRead(notificationId, userId);
  }

  async markAllAsRead(userId: string) {
    await this.store.markAllNotificationsAsRead(userId);
  }

  async countUnread(userId: string) {
    const count = await this.store.countUnreadNotifications(userId);
    return { count };
  }
}
