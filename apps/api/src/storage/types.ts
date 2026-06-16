export type AccountVisibility = 'PUBLIC' | 'PRIVATE';

export type ConversationType = 'DIRECT' | 'GROUP';

export type MessageType = 'TEXT' | 'MEDIA' | 'POST_SHARE' | 'STORY_REPLY';

export type StoredUser = {
  id: string;
  email: string;
  passwordHash: string;
  username: string;
  displayName: string | null;
  role: 'USER' | 'ADMIN';
  isEmailVerified: boolean;
  isPrivate: boolean;
  isDisabled: boolean;
  referredBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type StoredProfile = {
  userId: string;
  avatarUrl: string | null;
  bio: string | null;
  websiteUrl: string | null;
  location: string | null;
  visibility: AccountVisibility;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  starsBalance: number;
  lifetimeStars: number;
  lastLoginDate: string | null;
  currentStreak: number;
  lastSpinDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StoredRefreshToken = {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: string;
  revokedAt: string | null;
  replacedByTokenId: string | null;
  createdAt: string;
};

export type StoredConversation = {
  id: string;
  type: ConversationType;
  title: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StoredConversationMember = {
  conversationId: string;
  userId: string;
  joinedAt: string;
  lastReadMessageId: string | null;
  mutedUntil: string | null;
};

export type StoredMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  body: string | null;
  mediaUrl: string | null;
  replyToId: string | null;
  clientMessageId: string | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
};

export type StoredPost = {
  id: string;
  userId: string;
  caption: string;
  imageUrl: string | null;
  viewsCount: number;
  viewers: string[];
  createdAt: string;
  deletedAt: string | null;
};

export type StoredLike = {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
};

export type StoredComment = {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: string;
  deletedAt: string | null;
};

export type StoredFollow = {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
};

export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW';

export type StoredNotification = {
  id: string;
  recipientId: string;
  actorId: string;
  type: NotificationType;
  postId: string | null;
  commentId: string | null;
  read: boolean;
  createdAt: string;
};

export type TransactionReason = 'DAILY_LOGIN' | 'CREATE_POST' | 'POST_VIEW' | 'LIKE_RECEIVED' | 'COMMENT_RECEIVED' | 'REFERRAL_JOIN' | 'WITHDRAWAL' | 'SPIN_REWARD' | 'MISSION_REWARD';

export type StoredTransaction = {
  id: string;
  userId: string;
  amount: number; // positive for earn, negative for spend
  reason: TransactionReason;
  createdAt: string;
};

export type MissionType = 'UPLOAD_POST' | 'RECEIVE_LIKES' | 'WRITE_COMMENTS';

export type StoredMission = {
  id: string;
  userId: string;
  dateStr: string;
  type: MissionType;
  target: number;
  progress: number;
  rewardStars: number;
  completed: boolean;
  claimed: boolean;
};

export type ReportType = 'POST' | 'USER';

export type StoredReport = {
  id: string;
  reporterId: string;
  targetId: string; // postId if type is 'POST', userId if type is 'USER'
  type: ReportType;
  reason: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null; // admin userId
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
};

export type CreateReportInput = {
  targetId: string;
  type: ReportType;
  reason: string;
};

export type StoredBlock = {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
};

export type StoreSnapshot = {
  version: 1;
  users: StoredUser[];
  profiles: StoredProfile[];
  refreshTokens: StoredRefreshToken[];
  conversations: StoredConversation[];
  conversationMembers: StoredConversationMember[];
  messages: StoredMessage[];
  posts: StoredPost[];
  likes: StoredLike[];
  comments: StoredComment[];
  follows: StoredFollow[];
  notifications: StoredNotification[];
  transactions: StoredTransaction[];
  missions: StoredMission[];
  reports: StoredReport[];
  blocks: StoredBlock[];
};

export type CreateUserInput = {
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  referredBy?: string;
};

export type CreateRefreshTokenInput = {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: string;
};

export type ProfilePatch = {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string;
  websiteUrl?: string;
  location?: string;
  isPrivate?: boolean;
};

export type PublicProfile = Omit<StoredUser, 'passwordHash'> & {
  profile: StoredProfile | null;
};

export type CreateMessageInput = {
  conversationId: string;
  senderId: string;
  body: string;
  clientMessageId?: string | null;
  replyToId?: string | null;
};

export type CreatePostInput = {
  userId: string;
  caption: string;
  imageUrl?: string | null;
};

export type CreateCommentInput = {
  postId: string;
  userId: string;
  text: string;
};

export type CreateNotificationInput = {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  postId?: string | null;
  commentId?: string | null;
};

export class DuplicateRecordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateRecordError';
  }
}

export class MissingRecordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingRecordError';
  }
}

