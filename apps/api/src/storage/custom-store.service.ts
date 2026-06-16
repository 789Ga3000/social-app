import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import { dirname, isAbsolute, join, resolve } from 'path';
import {
  CreateMessageInput,
  CreateRefreshTokenInput,
  CreateUserInput,
  DuplicateRecordError,
  MissingRecordError,
  ProfilePatch,
  PublicProfile,
  StoreSnapshot,
  StoredConversation,
  StoredMessage,
  StoredProfile,
  StoredRefreshToken,
  StoredUser,
  StoredPost,
  StoredLike,
  StoredComment,
  StoredFollow,
  StoredNotification,
  CreatePostInput,
  CreateCommentInput,
  CreateNotificationInput,
  StoredTransaction,
  TransactionReason,
  StoredMission,
  MissionType,
  StoredReport,
  StoredBlock,
  CreateReportInput,
  ReportType,
} from './types';

@Injectable()
export class CustomStoreService implements OnModuleInit {
  private data!: StoreSnapshot;
  private loadPromise?: Promise<void>;
  private writeChain: Promise<void> = Promise.resolve();
  private pendingViewers: Record<string, Set<string>> = {};
  private viewFlushTimeout: NodeJS.Timeout | null = null;
  private readonly storePath: string;

  constructor(private readonly config: ConfigService) {
    this.storePath = this.resolveStorePath();
  }

  async onModuleInit() {
    await this.ensureLoaded();
  }

  getPath() {
    return this.storePath;
  }

  async createUserWithProfile(input: CreateUserInput): Promise<StoredUser> {
    await this.ensureLoaded();

    return this.mutate(() => {
      const email = this.normalizeIdentity(input.email);
      const username = this.normalizeIdentity(input.username);

      if (
        this.data.users.some(
          (user) =>
            this.normalizeIdentity(user.email) === email ||
            this.normalizeIdentity(user.username) === username,
        )
      ) {
        throw new DuplicateRecordError('Email or username is already taken');
      }

      let referrerUserId = null;
      if (input.referredBy) {
        const referrer = this.data.users.find((candidate) => candidate.username === input.referredBy);
        if (referrer) {
          referrerUserId = referrer.id;
          this.appendTransaction(referrer.id, 25, 'REFERRAL_JOIN');
        }
      }

      const now = this.now();
      const user: StoredUser = {
        id: randomUUID(),
        email,
        username,
        displayName: input.displayName,
        passwordHash: input.passwordHash,
        role: 'USER',
        isEmailVerified: false,
        isPrivate: false,
        isDisabled: false,
        referredBy: referrerUserId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      const profile: StoredProfile = {
        userId: user.id,
        avatarUrl: null,
        bio: null,
        websiteUrl: null,
        location: null,
        visibility: 'PUBLIC',
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
        starsBalance: 0,
        lifetimeStars: 0,
        lastLoginDate: null,
        currentStreak: 0,
        lastSpinDate: null,
        createdAt: now,
        updatedAt: now,
      };

      this.data.users.push(user);
      this.data.profiles.push(profile);

      return this.clone(user);
    });
  }

  async findUserByEmail(email: string): Promise<StoredUser | null> {
    await this.ensureLoaded();
    const normalized = this.normalizeIdentity(email);
    const user =
      this.data.users.find(
        (candidate) => this.normalizeIdentity(candidate.email) === normalized,
      ) ?? null;

    return this.cloneOrNull(user);
  }

  async findUserById(id: string): Promise<StoredUser | null> {
    await this.ensureLoaded();
    return this.cloneOrNull(
      this.data.users.find((candidate) => candidate.id === id) ?? null,
    );
  }

  async createRefreshToken(
    input: CreateRefreshTokenInput,
  ): Promise<StoredRefreshToken> {
    await this.ensureLoaded();

    return this.mutate(() => {
      const token: StoredRefreshToken = {
        ...input,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: this.now(),
      };

      this.data.refreshTokens.push(token);
      return this.clone(token);
    });
  }

  async findRefreshTokenWithUser(
    id: string,
  ): Promise<{ token: StoredRefreshToken; user: StoredUser } | null> {
    await this.ensureLoaded();
    const token = this.data.refreshTokens.find((candidate) => candidate.id === id);
    if (!token) {
      return null;
    }

    const user = this.data.users.find((candidate) => candidate.id === token.userId);
    if (!user) {
      return null;
    }

    return this.clone({ token, user });
  }

  async revokeRefreshToken(
    id: string,
    replacedByTokenId?: string,
  ): Promise<void> {
    await this.ensureLoaded();

    await this.mutate(() => {
      const token = this.data.refreshTokens.find((candidate) => candidate.id === id);
      if (!token) {
        return;
      }

      token.revokedAt = this.now();
      token.replacedByTokenId = replacedByTokenId ?? token.replacedByTokenId;
    });
  }

  async revokeRefreshTokenIfActive(id: string): Promise<void> {
    await this.ensureLoaded();

    await this.mutate(() => {
      const token = this.data.refreshTokens.find(
        (candidate) => candidate.id === id && candidate.revokedAt === null,
      );
      if (token) {
        token.revokedAt = this.now();
      }
    });
  }

  async getProfile(userId: string): Promise<PublicProfile | null> {
    await this.ensureLoaded();
    const user = this.data.users.find((candidate) => candidate.id === userId);
    if (!user) {
      return null;
    }

    const profile =
      this.data.profiles.find((candidate) => candidate.userId === userId) ?? null;

    return this.toPublicProfile(user, profile);
  }

  async updateProfile(
    userId: string,
    patch: ProfilePatch,
  ): Promise<PublicProfile | null> {
    await this.ensureLoaded();

    return this.mutate(() => {
      const user = this.data.users.find((candidate) => candidate.id === userId);
      if (!user) {
        return null;
      }

      const now = this.now();
      if (patch.displayName !== undefined) {
        user.displayName = patch.displayName;
      }
      if (patch.isPrivate !== undefined) {
        user.isPrivate = patch.isPrivate;
      }
      user.updatedAt = now;

      let profile = this.data.profiles.find(
        (candidate) => candidate.userId === userId,
      );
      if (!profile) {
        profile = {
          userId,
          avatarUrl: null,
          bio: null,
          websiteUrl: null,
          location: null,
          visibility: patch.isPrivate ? 'PRIVATE' : 'PUBLIC',
          postsCount: 0,
          followersCount: 0,
          followingCount: 0,
          starsBalance: 0,
          lifetimeStars: 0,
          lastLoginDate: null,
          currentStreak: 0,
          lastSpinDate: null,
          createdAt: now,
          updatedAt: now,
        };
        this.data.profiles.push(profile);
      }

      if (patch.avatarUrl !== undefined) {
        profile.avatarUrl = patch.avatarUrl;
      }
      if (patch.bio !== undefined) {
        profile.bio = patch.bio;
      }
      if (patch.websiteUrl !== undefined) {
        profile.websiteUrl = patch.websiteUrl;
      }
      if (patch.location !== undefined) {
        profile.location = patch.location;
      }
      if (patch.isPrivate !== undefined) {
        profile.visibility = patch.isPrivate ? 'PRIVATE' : 'PUBLIC';
      }
      profile.updatedAt = now;

      return this.toPublicProfile(user, profile);
    });
  }

  async joinConversation(
    conversationId: string,
    userId: string,
  ): Promise<StoredConversation> {
    await this.ensureLoaded();

    return this.mutate(() => {
      const user = this.data.users.find((candidate) => candidate.id === userId);
      if (!user || user.deletedAt || user.isDisabled) {
        throw new MissingRecordError('User not found');
      }

      const now = this.now();
      let conversation = this.data.conversations.find(
        (candidate) => candidate.id === conversationId,
      );

      if (!conversation) {
        conversation = {
          id: conversationId,
          type: 'GROUP',
          title: null,
          createdBy: userId,
          createdAt: now,
          updatedAt: now,
        };
        this.data.conversations.push(conversation);
      }

      const isMember = this.data.conversationMembers.some(
        (member) =>
          member.conversationId === conversationId && member.userId === userId,
      );

      if (!isMember) {
        this.data.conversationMembers.push({
          conversationId,
          userId,
          joinedAt: now,
          lastReadMessageId: null,
          mutedUntil: null,
        });
      }

      return this.clone(conversation);
    });
  }

  async isConversationMember(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    await this.ensureLoaded();

    return this.data.conversationMembers.some(
      (member) => member.conversationId === conversationId && member.userId === userId,
    );
  }

  async listMessages(
    conversationId: string,
    userId: string,
    limit: number,
  ): Promise<StoredMessage[]> {
    await this.ensureLoaded();

    if (!(await this.isConversationMember(conversationId, userId))) {
      throw new MissingRecordError('Conversation not found');
    }

    const safeLimit = Math.max(1, Math.min(limit, 100));
    const messages = this.data.messages
      .filter(
        (message) =>
          message.conversationId === conversationId && message.deletedAt === null,
      )
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .slice(-safeLimit);

    return this.clone(messages);
  }

  async createMessage(input: CreateMessageInput): Promise<StoredMessage> {
    await this.ensureLoaded();

    return this.mutate(() => {
      const isMember = this.data.conversationMembers.some(
        (member) =>
          member.conversationId === input.conversationId &&
          member.userId === input.senderId,
      );
      if (!isMember) {
        throw new MissingRecordError('Conversation not found');
      }

      const now = this.now();
      const message: StoredMessage = {
        id: randomUUID(),
        conversationId: input.conversationId,
        senderId: input.senderId,
        type: 'TEXT',
        body: input.body,
        mediaUrl: null,
        replyToId: input.replyToId ?? null,
        clientMessageId: input.clientMessageId ?? null,
        createdAt: now,
        editedAt: null,
        deletedAt: null,
      };

      this.data.messages.push(message);
      const conversation = this.data.conversations.find(
        (candidate) => candidate.id === input.conversationId,
      );
      if (conversation) {
        conversation.updatedAt = now;
      }

      return this.clone(message);
    });
  }

  // --- User Lookup ---
  async findUserByUsername(username: string): Promise<StoredUser | null> {
    await this.ensureLoaded();
    const normalized = this.normalizeIdentity(username);
    const user = this.data.users.find((c) => this.normalizeIdentity(c.username) === normalized && !c.deletedAt) ?? null;
    return this.cloneOrNull(user);
  }

  async searchUsers(query: string, limit = 20): Promise<StoredUser[]> {
    await this.ensureLoaded();
    const normalizedQuery = this.normalizeIdentity(query);
    if (!normalizedQuery) return [];
    
    const users = this.data.users
      .filter((u) => !u.deletedAt && this.normalizeIdentity(u.username).includes(normalizedQuery))
      .slice(0, Math.max(1, limit));
    return this.clone(users);
  }

  // --- Posts ---
  async createPost(input: CreatePostInput): Promise<StoredPost> {
    await this.ensureLoaded();
    return this.mutate(() => {
      const now = this.now();
      const post: StoredPost = {
        id: randomUUID(),
        userId: input.userId,
        caption: input.caption,
        imageUrl: input.imageUrl ?? null,
        viewsCount: 0,
        viewers: [],
        createdAt: now,
        deletedAt: null,
      };
      this.data.posts.push(post);
      
      const profile = this.data.profiles.find((p) => p.userId === input.userId);
      if (profile) profile.postsCount++;
      
      this.appendTransaction(input.userId, 5, 'CREATE_POST');
      this.progressMission(input.userId, 'UPLOAD_POST', 1);
      
      return this.clone(post);
    });
  }

  async findPostById(id: string): Promise<StoredPost | null> {
    await this.ensureLoaded();
    const post = this.data.posts.find((p) => p.id === id && !p.deletedAt) ?? null;
    return this.cloneOrNull(post);
  }

  async listPostsByUser(userId: string): Promise<StoredPost[]> {
    await this.ensureLoaded();
    const posts = this.data.posts
      .filter((p) => p.userId === userId && !p.deletedAt)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return this.clone(posts);
  }

  async listFeedPosts(userId: string): Promise<StoredPost[]> {
    await this.ensureLoaded();
    const followingIds = new Set(
      this.data.follows.filter((f) => f.followerId === userId).map((f) => f.followingId)
    );
    followingIds.add(userId);

    const blocks = this.data.blocks ?? [];
    const blockedIds = new Set(
      blocks
        .filter((b) => b.blockerId === userId || b.blockedId === userId)
        .map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId))
    );

    const posts = this.data.posts
      .filter((p) => !p.deletedAt && !blockedIds.has(p.userId))
      .sort((a, b) => {
        const aFollowed = followingIds.has(a.userId) ? 1 : 0;
        const bFollowed = followingIds.has(b.userId) ? 1 : 0;
        if (aFollowed !== bFollowed) {
          return bFollowed - aFollowed; // Prioritize followed users' posts
        }
        return b.createdAt.localeCompare(a.createdAt); // Secondary sort: newest first
      })
      .slice(0, 50);
    return this.clone(posts);
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    await this.ensureLoaded();
    return this.mutate(() => {
      const post = this.data.posts.find((p) => p.id === postId && p.userId === userId && !p.deletedAt);
      if (post) {
        post.deletedAt = this.now();
        const profile = this.data.profiles.find((p) => p.userId === userId);
        if (profile && profile.postsCount > 0) profile.postsCount--;
      }
    });
  }

  // --- Likes ---
  async createLike(postId: string, userId: string): Promise<{ record: StoredLike; isNew: boolean }> {
    await this.ensureLoaded();
    return this.mutate(() => {
      const existing = this.data.likes.find((l) => l.postId === postId && l.userId === userId);
      if (existing) return { record: this.clone(existing), isNew: false };

      const like: StoredLike = {
        id: randomUUID(),
        postId,
        userId,
        createdAt: this.now(),
      };
      this.data.likes.push(like);

      const post = this.data.posts.find((p) => p.id === postId);
      if (post && post.userId !== userId) {
        this.appendTransaction(post.userId, 1, 'LIKE_RECEIVED');
        this.progressMission(post.userId, 'RECEIVE_LIKES', 1);
      }

      return { record: this.clone(like), isNew: true };
    });
  }

  async removeLike(postId: string, userId: string): Promise<void> {
    await this.ensureLoaded();
    return this.mutate(() => {
      this.data.likes = this.data.likes.filter((l) => !(l.postId === postId && l.userId === userId));
    });
  }

  async findLike(postId: string, userId: string): Promise<StoredLike | null> {
    await this.ensureLoaded();
    const like = this.data.likes.find((l) => l.postId === postId && l.userId === userId) ?? null;
    return this.cloneOrNull(like);
  }

  async countLikes(postId: string): Promise<number> {
    await this.ensureLoaded();
    return this.data.likes.filter((l) => l.postId === postId).length;
  }

  async getLikersByPost(postId: string): Promise<string[]> {
    await this.ensureLoaded();
    return this.data.likes.filter((l) => l.postId === postId).map((l) => l.userId);
  }

  // --- Comments ---
  async createComment(input: CreateCommentInput): Promise<StoredComment> {
    await this.ensureLoaded();
    return this.mutate(() => {
      const comment: StoredComment = {
        id: randomUUID(),
        postId: input.postId,
        userId: input.userId,
        text: input.text,
        createdAt: this.now(),
        deletedAt: null,
      };
      this.data.comments.push(comment);

      const post = this.data.posts.find((p) => p.id === input.postId);
      if (post && post.userId !== input.userId) {
        this.appendTransaction(post.userId, 2, 'COMMENT_RECEIVED');
      }
      this.progressMission(input.userId, 'WRITE_COMMENTS', 1);

      return this.clone(comment);
    });
  }

  async listCommentsByPost(postId: string): Promise<StoredComment[]> {
    await this.ensureLoaded();
    const comments = this.data.comments
      .filter((c) => c.postId === postId && !c.deletedAt)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return this.clone(comments);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    await this.ensureLoaded();
    return this.mutate(() => {
      const comment = this.data.comments.find((c) => c.id === commentId && c.userId === userId && !c.deletedAt);
      if (comment) {
        comment.deletedAt = this.now();
      }
    });
  }

  // --- Follows ---
  async createFollow(followerId: string, followingId: string): Promise<{ record: StoredFollow; isNew: boolean }> {
    await this.ensureLoaded();
    if (followerId === followingId) throw new Error('Cannot follow yourself');

    return this.mutate(() => {
      const existing = this.data.follows.find((f) => f.followerId === followerId && f.followingId === followingId);
      if (existing) return { record: this.clone(existing), isNew: false };

      const follow: StoredFollow = {
        id: randomUUID(),
        followerId,
        followingId,
        createdAt: this.now(),
      };
      this.data.follows.push(follow);

      const followerProfile = this.data.profiles.find((p) => p.userId === followerId);
      if (followerProfile) followerProfile.followingCount++;

      const followingProfile = this.data.profiles.find((p) => p.userId === followingId);
      if (followingProfile) followingProfile.followersCount++;

      return { record: this.clone(follow), isNew: true };
    });
  }

  async removeFollow(followerId: string, followingId: string): Promise<void> {
    await this.ensureLoaded();
    return this.mutate(() => {
      const initialLength = this.data.follows.length;
      this.data.follows = this.data.follows.filter((f) => !(f.followerId === followerId && f.followingId === followingId));
      
      if (this.data.follows.length < initialLength) {
        const followerProfile = this.data.profiles.find((p) => p.userId === followerId);
        if (followerProfile && followerProfile.followingCount > 0) followerProfile.followingCount--;

        const followingProfile = this.data.profiles.find((p) => p.userId === followingId);
        if (followingProfile && followingProfile.followersCount > 0) followingProfile.followersCount--;
      }
    });
  }

  async findFollow(followerId: string, followingId: string): Promise<StoredFollow | null> {
    await this.ensureLoaded();
    const follow = this.data.follows.find((f) => f.followerId === followerId && f.followingId === followingId) ?? null;
    return this.cloneOrNull(follow);
  }

  async getFollowers(userId: string): Promise<string[]> {
    await this.ensureLoaded();
    return this.data.follows.filter((f) => f.followingId === userId).map((f) => f.followerId);
  }

  async getFollowing(userId: string): Promise<string[]> {
    await this.ensureLoaded();
    return this.data.follows.filter((f) => f.followerId === userId).map((f) => f.followingId);
  }

  async countFollowers(userId: string): Promise<number> {
    await this.ensureLoaded();
    return this.data.follows.filter((f) => f.followingId === userId).length;
  }

  async countFollowing(userId: string): Promise<number> {
    await this.ensureLoaded();
    return this.data.follows.filter((f) => f.followerId === userId).length;
  }

  // --- Notifications ---
  async createNotification(input: CreateNotificationInput): Promise<StoredNotification | null> {
    await this.ensureLoaded();
    if (input.recipientId === input.actorId) return null;

    return this.mutate(() => {
      const notification: StoredNotification = {
        id: randomUUID(),
        recipientId: input.recipientId,
        actorId: input.actorId,
        type: input.type,
        postId: input.postId ?? null,
        commentId: input.commentId ?? null,
        read: false,
        createdAt: this.now(),
      };
      this.data.notifications.push(notification);
      return this.clone(notification);
    });
  }

  async listNotifications(userId: string, limit = 50): Promise<StoredNotification[]> {
    await this.ensureLoaded();
    const notifications = this.data.notifications
      .filter((n) => n.recipientId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
    return this.clone(notifications);
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    await this.ensureLoaded();
    return this.mutate(() => {
      const notification = this.data.notifications.find((n) => n.id === notificationId && n.recipientId === userId);
      if (notification) notification.read = true;
    });
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await this.ensureLoaded();
    return this.mutate(() => {
      this.data.notifications
        .filter((n) => n.recipientId === userId && !n.read)
        .forEach((n) => { n.read = true; });
    });
  }

  async countUnreadNotifications(userId: string): Promise<number> {
    await this.ensureLoaded();
    return this.data.notifications.filter((n) => n.recipientId === userId && !n.read).length;
  }

  // --- Transactions / Wallet ---
  async getTransactions(userId: string, limit = 50): Promise<StoredTransaction[]> {
    await this.ensureLoaded();
    const txs = this.data.transactions
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
    return this.clone(txs);
  }

  private appendTransaction(userId: string, amount: number, reason: TransactionReason): StoredTransaction | null {
    const profile = this.data.profiles.find((p) => p.userId === userId);
    if (!profile) return null;
    
    if (profile.starsBalance == null || Number.isNaN(profile.starsBalance)) {
      profile.starsBalance = 0;
    }
    if (profile.lifetimeStars == null || Number.isNaN(profile.lifetimeStars)) {
      profile.lifetimeStars = 0;
    }

    profile.starsBalance += amount;
    if (amount > 0) {
      profile.lifetimeStars += amount;
    }

    const tx: StoredTransaction = {
      id: randomUUID(),
      userId,
      amount,
      reason,
      createdAt: this.now(),
    };
    this.data.transactions.push(tx);
    return tx;
  }

  async recordLogin(userId: string): Promise<void> {
    await this.ensureLoaded();
    await this.mutate(() => {
      const profile = this.data.profiles.find((p) => p.userId === userId);
      if (!profile) return;

      const now = new Date();
      const todayStr = this.getLocalDateString(now);

      if (!profile.lastLoginDate) {
        // First login ever
        profile.lastLoginDate = todayStr;
        profile.currentStreak = 1;
        this.appendTransaction(userId, 2, 'DAILY_LOGIN');
        return;
      }

      if (profile.lastLoginDate === todayStr) {
        // Already logged in today
        return;
      }

      const lastLogin = new Date(profile.lastLoginDate);
      const today = new Date(todayStr);
      const utc1 = Date.UTC(lastLogin.getUTCFullYear(), lastLogin.getUTCMonth(), lastLogin.getUTCDate());
      const utc2 = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
      const diffDays = Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive login
        profile.currentStreak++;
      } else {
        // Streak broken
        profile.currentStreak = 1;
      }
      profile.lastLoginDate = todayStr;

      // Award based on streak
      let reward = 2;
      const cycleDay = profile.currentStreak % 7 || 7;
      if (cycleDay === 1) reward = 2;
      else if (cycleDay === 2) reward = 4;
      else if (cycleDay === 3) reward = 6;
      else if (cycleDay === 4) reward = 8;
      else if (cycleDay === 5) reward = 10;
      else if (cycleDay === 6) reward = 15;
      else if (cycleDay === 7) reward = 25;

      this.appendTransaction(userId, reward, 'DAILY_LOGIN');
    });
  }

  // --- Lucky Spin ---
  async spinLuckyWheel(userId: string): Promise<number> {
    await this.ensureLoaded();
    return this.mutate(() => {
      const profile = this.data.profiles.find((p) => p.userId === userId);
      if (!profile) throw new Error('Profile not found');

      const todayStr = this.getLocalDateString();
      if (profile.lastSpinDate === todayStr) {
        throw new Error('Already spun today');
      }

      // 50% for 2⭐, 25% for 5⭐, 15% for 10⭐, 7% for 20⭐, 2% for 50⭐, 1% for 100⭐
      const rand = Math.random();
      let reward = 2;
      if (rand > 0.5) reward = 5;
      if (rand > 0.75) reward = 10;
      if (rand > 0.90) reward = 20;
      if (rand > 0.97) reward = 50;
      if (rand > 0.99) reward = 100;

      profile.lastSpinDate = todayStr;
      this.appendTransaction(userId, reward, 'SPIN_REWARD');
      return reward;
    });
  }

  // --- Daily Missions ---
  async getDailyMissions(userId: string): Promise<StoredMission[]> {
    await this.ensureLoaded();
    return this.mutate(() => {
      const todayStr = this.getLocalDateString();
      let todayMissions = this.data.missions.filter((m) => m.userId === userId && m.dateStr === todayStr);

      if (todayMissions.length === 0) {
        // Generate 3 missions
        todayMissions = [
          { id: randomUUID(), userId, dateStr: todayStr, type: 'UPLOAD_POST', target: 1, progress: 0, rewardStars: 10, completed: false, claimed: false },
          { id: randomUUID(), userId, dateStr: todayStr, type: 'RECEIVE_LIKES', target: 5, progress: 0, rewardStars: 5, completed: false, claimed: false },
          { id: randomUUID(), userId, dateStr: todayStr, type: 'WRITE_COMMENTS', target: 3, progress: 0, rewardStars: 15, completed: false, claimed: false },
        ];
        this.data.missions.push(...todayMissions);
      }
      return this.clone(todayMissions);
    });
  }

  async claimMission(userId: string, missionId: string): Promise<void> {
    await this.ensureLoaded();
    return this.mutate(() => {
      const mission = this.data.missions.find((m) => m.id === missionId && m.userId === userId);
      if (!mission) throw new Error('Mission not found');
      if (!mission.completed) throw new Error('Mission not completed');
      if (mission.claimed) throw new Error('Mission already claimed');

      mission.claimed = true;
      this.appendTransaction(userId, mission.rewardStars, 'MISSION_REWARD');
    });
  }

  private progressMission(userId: string, type: MissionType, amount: number) {
    const todayStr = this.getLocalDateString();
    const mission = this.data.missions.find((m) => m.userId === userId && m.dateStr === todayStr && m.type === type);
    if (mission && !mission.completed) {
      mission.progress += amount;
      if (mission.progress >= mission.target) {
        mission.progress = mission.target;
        mission.completed = true;
      }
    }
  }

  // --- Leaderboard & Withdrawal ---
  async getLeaderboard(limit: number = 50) {
    await this.ensureLoaded();
    const sortedProfiles = [...this.data.profiles].sort((a, b) => b.lifetimeStars - a.lifetimeStars).slice(0, limit);
    
    return sortedProfiles.map(p => {
      const user = this.data.users.find(u => u.id === p.userId);
      return {
        userId: p.userId,
        username: user?.username || 'Unknown',
        displayName: user?.displayName || null,
        lifetimeStars: p.lifetimeStars,
        avatarUrl: p.avatarUrl,
      };
    });
  }

  async withdrawStars(userId: string, amount: number) {
    if (amount <= 0) throw new Error('Invalid amount');
    await this.ensureLoaded();
    return this.mutate(() => {
      const profile = this.data.profiles.find(p => p.userId === userId);
      if (!profile) throw new Error('Profile not found');
      
      if (profile.starsBalance < amount) {
        throw new Error('Insufficient balance');
      }
      
      this.appendTransaction(userId, -amount, 'WITHDRAWAL');
    });
  }

  // --- Views Engine ---
  async registerPostView(postId: string, viewerId: string, durationMs: number) {
    if (durationMs < 5000) return; // Ignore views under 5s
    
    if (!this.pendingViewers[postId]) {
      this.pendingViewers[postId] = new Set();
    }
    
    if (this.pendingViewers[postId].has(viewerId)) return;
    this.pendingViewers[postId].add(viewerId);

    if (!this.viewFlushTimeout) {
      this.viewFlushTimeout = setTimeout(() => this.flushViews(), 5000);
    }
  }

  private async flushViews() {
    this.viewFlushTimeout = null;
    const viewsToProcess = this.pendingViewers;
    this.pendingViewers = {}; // reset

    const postIds = Object.keys(viewsToProcess);
    if (postIds.length === 0) return;

    await this.ensureLoaded();
    await this.mutate(() => {
      for (const postId of postIds) {
        const post = this.data.posts.find(p => p.id === postId);
        if (!post) continue;
        
        const newViewers = viewsToProcess[postId];
        let newCount = 0;
        
        for (const viewerId of newViewers) {
          if (post.userId === viewerId) continue; // Anti-fraud: No self view
          if (!post.viewers) post.viewers = [];
          if (!post.viewers.includes(viewerId)) {
            post.viewers.push(viewerId);
            post.viewsCount++;
            newCount++;
          }
        }
        
        if (newCount > 0) {
          // Award 1⭐ for every 100 views
          const oldMilestone = Math.floor((post.viewsCount - newCount) / 100);
          const newMilestone = Math.floor(post.viewsCount / 100);
          if (newMilestone > oldMilestone) {
            const starsToAward = newMilestone - oldMilestone;
            this.appendTransaction(post.userId, starsToAward, 'POST_VIEW');
          }
        }
      }
    });
  }

  private async ensureLoaded(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = this.load();
    }

    await this.loadPromise;
  }

  private async load(): Promise<void> {
    if (!existsSync(this.storePath)) {
      this.data = this.emptySnapshot();
      await this.persist();
      return;
    }

    const raw = await readFile(this.storePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreSnapshot>;
    this.data = {
      ...this.emptySnapshot(),
      ...parsed,
      version: 1,
      users: (parsed.users ?? []).map((u, idx) => ({
        ...u,
        role: u.role ?? (idx === 0 || u.username?.toLowerCase() === 'admin' || u.email?.toLowerCase().includes('admin') ? 'ADMIN' : 'USER'),
      })),
      profiles: (parsed.profiles ?? []).map(p => {
        const starsBalance = p.starsBalance == null || Number.isNaN(p.starsBalance) ? 0 : p.starsBalance;
        const lifetimeStars = p.lifetimeStars == null || Number.isNaN(p.lifetimeStars) ? 0 : p.lifetimeStars;
        return {
          ...p,
          starsBalance,
          lifetimeStars,
          currentStreak: p.currentStreak ?? 0,
          lastLoginDate: p.lastLoginDate ?? null,
          lastSpinDate: p.lastSpinDate ?? null,
        };
      }),
      refreshTokens: parsed.refreshTokens ?? [],
      conversations: parsed.conversations ?? [],
      conversationMembers: parsed.conversationMembers ?? [],
      messages: parsed.messages ?? [],
      posts: parsed.posts ?? [],
      likes: parsed.likes ?? [],
      comments: parsed.comments ?? [],
      follows: parsed.follows ?? [],
      notifications: parsed.notifications ?? [],
      transactions: parsed.transactions ?? [],
      missions: parsed.missions ?? [],
      reports: parsed.reports ?? [],
      blocks: parsed.blocks ?? [],
    };

    // Self-repair: Sync profiles' starsBalance and lifetimeStars with transactions
    const txs = this.data.transactions ?? [];
    for (const profile of this.data.profiles) {
      const userTxs = txs.filter(t => t.userId === profile.userId);
      const calculatedBalance = userTxs.reduce((sum, t) => sum + t.amount, 0);
      const calculatedLifetime = userTxs.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      profile.starsBalance = calculatedBalance;
      profile.lifetimeStars = calculatedLifetime;
    }

    const hasAdmin = this.data.users.some(u => u.email === 'admin@social.com');
    if (!hasAdmin) {
      const now = this.now();
      const adminId = randomUUID();
      this.data.users.push({
        id: adminId,
        email: 'admin@social.com',
        username: 'admin',
        displayName: 'Admin Moderator',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummy',
        role: 'ADMIN',
        isEmailVerified: true,
        isPrivate: false,
        isDisabled: false,
        referredBy: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
      this.data.profiles.push({
        userId: adminId,
        avatarUrl: null,
        bio: 'System Admin Moderator',
        websiteUrl: null,
        location: null,
        visibility: 'PUBLIC',
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
        starsBalance: 0,
        lifetimeStars: 0,
        lastLoginDate: null,
        currentStreak: 0,
        lastSpinDate: null,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  private async mutate<T>(operation: () => T | Promise<T>): Promise<T> {
    let result: T;
    const nextWrite = this.writeChain.then(async () => {
      result = await operation();
      await this.persist();
    });

    this.writeChain = nextWrite.catch(() => undefined);
    await nextWrite;

    return result!;
  }

  private async persist(): Promise<void> {
    await mkdir(dirname(this.storePath), { recursive: true });
    const tempPath = `${this.storePath}.${process.pid}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(this.data, null, 2)}\n`, 'utf8');
    await rename(tempPath, this.storePath);
  }

  private resolveStorePath(): string {
    const configured = this.config.get<string>('CUSTOM_STORE_PATH');
    if (configured) {
      return isAbsolute(configured) ? configured : resolve(process.cwd(), configured);
    }

    return join(this.findWorkspaceRoot(process.cwd()), 'work', 'custom-store', 'social-store.json');
  }

  private findWorkspaceRoot(start: string): string {
    let current = start;

    while (true) {
      if (existsSync(join(current, 'pnpm-workspace.yaml'))) {
        return current;
      }

      const parent = dirname(current);
      if (parent === current) {
        return start;
      }
      current = parent;
    }
  }

  private emptySnapshot(): StoreSnapshot {
    return {
      version: 1,
      users: [],
      profiles: [],
      refreshTokens: [],
      conversations: [],
      conversationMembers: [],
      messages: [],
      posts: [],
      likes: [],
      comments: [],
      follows: [],
      notifications: [],
      transactions: [],
      missions: [],
      reports: [],
      blocks: [],
    };
  }

  async listAllUsersAdmin(): Promise<PublicProfile[]> {
    await this.ensureLoaded();
    const result: PublicProfile[] = [];
    for (const user of this.data.users) {
      const profile = this.data.profiles.find(p => p.userId === user.id) ?? null;
      result.push(this.toPublicProfile(user, profile));
    }
    return result;
  }

  async toggleUserDisableStatus(userId: string, isDisabled: boolean): Promise<void> {
    await this.ensureLoaded();
    await this.mutate(() => {
      const user = this.data.users.find(u => u.id === userId);
      if (user) {
        user.isDisabled = isDisabled;
        user.updatedAt = this.now();
      }
    });
  }

  async changeUserRole(userId: string, role: 'USER' | 'ADMIN'): Promise<void> {
    await this.ensureLoaded();
    await this.mutate(() => {
      const user = this.data.users.find(u => u.id === userId);
      if (user) {
        user.role = role;
        user.updatedAt = this.now();
      }
    });
  }

  async listAllPostsAdmin(): Promise<(StoredPost & { author: { id: string; username: string; displayName: string | null } })[]> {
    await this.ensureLoaded();
    const posts = this.data.posts;
    const enriched = posts.map(post => {
      const user = this.data.users.find(u => u.id === post.userId);
      return this.clone({
        ...post,
        author: {
          id: post.userId,
          username: user?.username ?? 'deleted_user',
          displayName: user?.displayName ?? null,
        }
      });
    });
    return enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async adminDeletePost(postId: string): Promise<void> {
    await this.ensureLoaded();
    await this.mutate(() => {
      const post = this.data.posts.find(p => p.id === postId);
      if (post) {
        post.deletedAt = this.now();
      }
    });
  }

  async adminRestorePost(postId: string): Promise<void> {
    await this.ensureLoaded();
    await this.mutate(() => {
      const post = this.data.posts.find(p => p.id === postId);
      if (post) {
        post.deletedAt = null;
      }
    });
  }

  async listAllCommentsAdmin(): Promise<(StoredComment & { author: { id: string; username: string; displayName: string | null }; postCaption: string })[]> {
    await this.ensureLoaded();
    const enriched = this.data.comments.map(c => {
      const user = this.data.users.find(u => u.id === c.userId);
      const post = this.data.posts.find(p => p.id === c.postId);
      return this.clone({
        ...c,
        author: {
          id: c.userId,
          username: user?.username ?? 'deleted_user',
          displayName: user?.displayName ?? null,
        },
        postCaption: post?.caption ?? '(Deleted Post)'
      });
    });
    return enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async adminDeleteComment(commentId: string): Promise<void> {
    await this.ensureLoaded();
    await this.mutate(() => {
      const comment = this.data.comments.find(c => c.id === commentId);
      if (comment) {
        comment.deletedAt = this.now();
      }
    });
  }

  async adminRestoreComment(commentId: string): Promise<void> {
    await this.ensureLoaded();
    await this.mutate(() => {
      const comment = this.data.comments.find(c => c.id === commentId);
      if (comment) {
        comment.deletedAt = null;
      }
    });
  }

  async getAdminStats(): Promise<{
    usersCount: number;
    activeUsersCount: number;
    disabledUsersCount: number;
    postsCount: number;
    activePostsCount: number;
    deletedPostsCount: number;
    commentsCount: number;
    activeCommentsCount: number;
    deletedCommentsCount: number;
    starsTransactionsCount: number;
    starsTotalBalance: number;
  }> {
    await this.ensureLoaded();
    const users = this.data.users;
    const posts = this.data.posts;
    const comments = this.data.comments;
    const transactions = this.data.transactions ?? [];
    
    const disabledUsersCount = users.filter(u => u.isDisabled).length;
    const activePostsCount = posts.filter(p => !p.deletedAt).length;
    const activeCommentsCount = comments.filter(c => !c.deletedAt).length;

    const starsTotalBalance = this.data.profiles.reduce((sum, p) => sum + (p.starsBalance || 0), 0);

    return {
      usersCount: users.length,
      activeUsersCount: users.length - disabledUsersCount,
      disabledUsersCount,
      postsCount: posts.length,
      activePostsCount,
      deletedPostsCount: posts.length - activePostsCount,
      commentsCount: comments.length,
      activeCommentsCount,
      deletedCommentsCount: comments.length - activeCommentsCount,
      starsTransactionsCount: transactions.length,
      starsTotalBalance,
    };
  }

  // --- Reports & Moderation ---
  async createReport(reporterId: string, input: CreateReportInput): Promise<StoredReport> {
    await this.ensureLoaded();
    return this.mutate(() => {
      const report: StoredReport = {
        id: randomUUID(),
        reporterId,
        targetId: input.targetId,
        type: input.type,
        reason: input.reason,
        createdAt: this.now(),
        resolvedAt: null,
        resolvedBy: null,
        status: 'PENDING',
      };
      this.data.reports.push(report);
      return this.clone(report);
    });
  }

  async listReportsAdmin(): Promise<any[]> {
    await this.ensureLoaded();
    const reports = this.data.reports ?? [];
    const enriched = reports.map(r => {
      const reporter = this.data.users.find(u => u.id === r.reporterId);
      let targetDetail = 'Unknown Target';
      let targetSubDetail = '';
      if (r.type === 'POST') {
        const post = this.data.posts.find(p => p.id === r.targetId);
        targetDetail = post?.caption ?? '(Deleted Post)';
        const author = post ? this.data.users.find(u => u.id === post.userId) : null;
        targetSubDetail = author ? `Posted by @${author.username}` : '';
      } else if (r.type === 'USER') {
        const targetUser = this.data.users.find(u => u.id === r.targetId);
        targetDetail = targetUser ? `@${targetUser.username} (${targetUser.displayName || ''})` : '(Deleted User)';
      }
      return this.clone({
        ...r,
        reporterUsername: reporter?.username ?? 'deleted_user',
        targetDetail,
        targetSubDetail,
      });
    });
    return enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async resolveReportAdmin(reportId: string, action: 'DISMISS' | 'DELETE_POST' | 'BAN_USER', adminId: string): Promise<void> {
    await this.ensureLoaded();
    await this.mutate(() => {
      const report = this.data.reports?.find(r => r.id === reportId);
      if (!report) return;

      report.resolvedAt = this.now();
      report.resolvedBy = adminId;
      report.status = action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED';

      if (action === 'DELETE_POST' && report.type === 'POST') {
        const post = this.data.posts.find(p => p.id === report.targetId);
        if (post) {
          post.deletedAt = this.now();
        }
      } else if (action === 'BAN_USER') {
        let userIdToBan = '';
        if (report.type === 'USER') {
          userIdToBan = report.targetId;
        } else if (report.type === 'POST') {
          const post = this.data.posts.find(p => p.id === report.targetId);
          if (post) userIdToBan = post.userId;
        }
        const user = this.data.users.find(u => u.id === userIdToBan);
        if (user) {
          user.isDisabled = true;
          user.updatedAt = this.now();
        }
      }
    });
  }

  // --- Blocking ---
  async blockUser(blockerId: string, blockedId: string): Promise<StoredBlock> {
    await this.ensureLoaded();
    if (blockerId === blockedId) {
      throw new Error('You cannot block yourself');
    }
    return this.mutate(() => {
      if (!this.data.blocks) {
        this.data.blocks = [];
      }
      const existing = this.data.blocks.find(b => b.blockerId === blockerId && b.blockedId === blockedId);
      if (existing) {
        return this.clone(existing);
      }

      const block: StoredBlock = {
        id: randomUUID(),
        blockerId,
        blockedId,
        createdAt: this.now(),
      };
      this.data.blocks.push(block);

      // Sever follow relationships
      this.data.follows = this.data.follows.filter(
        f => !(
          (f.followerId === blockerId && f.followingId === blockedId) ||
          (f.followerId === blockedId && f.followingId === blockerId)
        )
      );

      // Recalculate followers/following counts
      const blockerProfile = this.data.profiles.find(p => p.userId === blockerId);
      const blockedProfile = this.data.profiles.find(p => p.userId === blockedId);
      if (blockerProfile) {
        blockerProfile.followersCount = this.data.follows.filter(f => f.followingId === blockerId).length;
        blockerProfile.followingCount = this.data.follows.filter(f => f.followerId === blockerId).length;
      }
      if (blockedProfile) {
        blockedProfile.followersCount = this.data.follows.filter(f => f.followingId === blockedId).length;
        blockedProfile.followingCount = this.data.follows.filter(f => f.followerId === blockedId).length;
      }

      return this.clone(block);
    });
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await this.ensureLoaded();
    await this.mutate(() => {
      if (!this.data.blocks) return;
      this.data.blocks = this.data.blocks.filter(b => !(b.blockerId === blockerId && b.blockedId === blockedId));
    });
  }

  async isBlocked(userA: string, userB: string): Promise<boolean> {
    await this.ensureLoaded();
    const blocks = this.data.blocks ?? [];
    return blocks.some(
      b => (b.blockerId === userA && b.blockedId === userB) || (b.blockerId === userB && b.blockedId === userA)
    );
  }

  async listBlockedUsers(userId: string): Promise<PublicProfile[]> {
    await this.ensureLoaded();
    const blocks = this.data.blocks ?? [];
    const blockedIds = blocks.filter(b => b.blockerId === userId).map(b => b.blockedId);
    
    const result: PublicProfile[] = [];
    for (const blockedId of blockedIds) {
      const user = this.data.users.find(u => u.id === blockedId);
      if (user) {
        const profile = this.data.profiles.find(p => p.userId === blockedId) ?? null;
        result.push(this.toPublicProfile(user, profile));
      }
    }
    return result;
  }

  // --- Account Deletion ---
  async deleteUserAccount(userId: string): Promise<void> {
    await this.ensureLoaded();
    await this.mutate(() => {
      const user = this.data.users.find(u => u.id === userId);
      if (!user) return;

      const now = this.now();
      user.deletedAt = now;
      user.isDisabled = true;
      user.updatedAt = now;

      // Soft delete user's posts
      this.data.posts.forEach(post => {
        if (post.userId === userId) {
          post.deletedAt = now;
        }
      });

      // Soft delete user's comments
      this.data.comments.forEach(comment => {
        if (comment.userId === userId) {
          comment.deletedAt = now;
        }
      });

      // Revoke refresh tokens
      this.data.refreshTokens.forEach(token => {
        if (token.userId === userId && !token.revokedAt) {
          token.revokedAt = now;
        }
      });

      // Sever follows
      this.data.follows = this.data.follows.filter(f => f.followerId !== userId && f.followingId !== userId);

      // Re-calculate other profiles follow stats
      this.data.profiles.forEach(p => {
        p.followersCount = this.data.follows.filter(f => f.followingId === p.userId).length;
        p.followingCount = this.data.follows.filter(f => f.followerId === p.userId).length;
      });
    });
  }

  private toPublicProfile(
    user: StoredUser,
    profile: StoredProfile | null,
  ): PublicProfile {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return this.clone({ ...safeUser, profile });
  }

  private normalizeIdentity(value: string): string {
    return value.trim().toLowerCase();
  }

  private getLocalDateString(date = new Date()): string {
    const offset = date.getTimezoneOffset();
    const localNow = new Date(date.getTime() - (offset * 60 * 1000));
    return localNow.toISOString().split('T')[0];
  }

  private now(): string {
    return new Date().toISOString();
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  private cloneOrNull<T>(value: T | null): T | null {
    return value === null ? null : this.clone(value);
  }
}
