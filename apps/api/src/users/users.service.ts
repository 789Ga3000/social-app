import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomStoreService } from '../storage/custom-store.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly store: CustomStoreService) {}

  async getProfile(userId: string) {
    const user = await this.store.getProfile(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.enhanceProfileWithGamification(user);
  }

  async recordLogin(userId: string) {
    return this.store.recordLogin(userId);
  }

  private enhanceProfileWithGamification(user: any) {
    if (!user || !user.profile) return user;
    const { lifetimeStars, createdAt } = user.profile;
    
    let creatorLevel = 'Bronze Creator 🥉';
    if (lifetimeStars >= 25000) creatorLevel = 'Diamond Creator 💎';
    else if (lifetimeStars >= 5000) creatorLevel = 'Gold Creator 🥇';
    else if (lifetimeStars >= 1000) creatorLevel = 'Silver Creator 🥈';

    const accountAgeDays = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));

    return {
      ...user,
      profile: {
        ...user.profile,
        creatorLevel,
        accountAgeDays,
      }
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.store.updateProfile(userId, dto);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getWalletTransactions(userId: string) {
    const transactions = await this.store.getTransactions(userId);
    const profile = await this.store.getProfile(userId);
    return {
      balance: profile?.profile?.starsBalance || 0,
      lifetime: profile?.profile?.lifetimeStars || 0,
      transactions,
    };
  }

  async spinLuckyWheel(userId: string) {
    const reward = await this.store.spinLuckyWheel(userId);
    return { reward };
  }

  async getDailyMissions(userId: string) {
    const missions = await this.store.getDailyMissions(userId);
    return { missions };
  }

  async claimMission(userId: string, missionId: string) {
    await this.store.claimMission(userId, missionId);
    return { success: true };
  }

  async getLeaderboard() {
    return this.store.getLeaderboard();
  }

  async withdrawStars(userId: string, amount: number) {
    await this.store.withdrawStars(userId, amount);
    return { success: true };
  }
  
  async getPublicProfileByUsername(username: string, requestingUserId: string) {
    const user = await this.store.findUserByUsername(username);
    if (!user || user.deletedAt) throw new NotFoundException('User not found');

    const isBlocked = await this.store.isBlocked(requestingUserId, user.id);
    if (isBlocked) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.store.getProfile(user.id);
    const isFollowing = !!(await this.store.findFollow(requestingUserId, user.id));

    return { ...this.enhanceProfileWithGamification(profile), isFollowing };
  }

  async searchUsers(query: string, requestingUserId: string) {
    const users = await this.store.searchUsers(query);
    const filtered = [];
    for (const u of users) {
      const blocked = await this.store.isBlocked(requestingUserId, u.id);
      if (!blocked) {
        filtered.push(u);
      }
    }
    return {
      users: filtered.map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
      }))
    };
  }

  async deleteAccount(userId: string) {
    return this.store.deleteUserAccount(userId);
  }
}
