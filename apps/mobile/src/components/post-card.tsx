import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useVideoPlayer, VideoView } from 'expo-video';
import api from '../lib/api';
import { useAuth } from '../lib/auth-store';
import { useTheme } from '../lib/theme';

const isVideoUrl = (url?: string) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm');
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface Post {
  id: string;
  caption: string;
  imageUrl?: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  isLiked: boolean;
  isFollowingAuthor?: boolean;
}

interface PostCardProps {
  post: Post;
  currentUserId: string;
  isActive?: boolean;
  onCommentPress: (postId: string) => void;
  onProfilePress: (username: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000,
  );
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

function getAvatarLetter(post: Post): string {
  const name = post.author.displayName || post.author.username || '?';
  return name.charAt(0).toUpperCase();
}

import { useFocusEffect } from 'expo-router';

const PostVideo = ({ source, isActive, style }: { source: string; isActive: boolean; style: any }) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const player = useVideoPlayer(source, player => {
    player.loop = true;
  });

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  React.useEffect(() => {
    if (isActive && isFocused) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, isFocused, player]);

  return <VideoView player={player} style={style} />;
};

// ─── Component ───────────────────────────────────────────────────────────────

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  isActive = false,
  onCommentPress,
  onProfilePress,
}) => {
  const queryClient = useQueryClient();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { user: currentUser } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  
  const isAdmin = currentUser?.role === 'ADMIN';
  const isOwnPost = post.author.id === currentUserId;

  // — Optimistic cache helper —

  const updatePostInCache = useCallback(
    (updater: (old: Post) => Post) => {
      queryClient.setQueriesData<{ pages?: { data: Post[] }[] } | Post[]>(
        { queryKey: ['feed'] },
        (oldData: any) => {
          if (!oldData) return oldData;

          if (oldData.pages) {
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                data: Array.isArray(page.data)
                  ? page.data.map((p: Post) =>
                      p.id === post.id ? updater(p) : p,
                    )
                  : page.data,
              })),
            };
          }

          if (Array.isArray(oldData)) {
            return oldData.map((p: Post) =>
              p.id === post.id ? updater(p) : p,
            );
          }

          return oldData;
        },
      );
    },
    [post.id, queryClient],
  );

  // — View Tracking —
  React.useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (isActive && !isOwnPost) {
      timeoutId = setTimeout(() => {
        api.post(`/posts/${post.id}/view`, { durationMs: 5000 }).catch(() => {});
      }, 5000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isActive, post.id, isOwnPost]);

  // — Like / Unlike mutation —

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (post.isLiked) {
        await api.delete(`/posts/${post.id}/like`);
      } else {
        await api.post(`/posts/${post.id}/like`);
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      const wasLiked = post.isLiked;
      const prevCount = post.likesCount;

      updatePostInCache((old) => ({
        ...old,
        isLiked: !wasLiked,
        likesCount: wasLiked
          ? Math.max(0, prevCount - 1)
          : prevCount + 1,
      }));

      return { wasLiked, prevCount };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        updatePostInCache((old) => ({
          ...old,
          isLiked: context.wasLiked,
          likesCount: context.prevCount,
        }));
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  // — Delete mutation —

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/posts/${post.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete post. Please try again.');
    },
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (post.isFollowingAuthor) {
        await api.delete(`/users/${post.author.id}/follow`);
      } else {
        await api.post(`/users/${post.author.id}/follow`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    },
  });

  const handleLikePress = useCallback(() => {
    likeMutation.mutate();
  }, [likeMutation]);

  const handleDeletePress = useCallback(() => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(),
      },
    ]);
  }, [deleteMutation]);

  const reportMutation = useMutation({
    mutationFn: async (reason: string) => {
      await api.post('/reports', {
        targetId: post.id,
        type: 'POST',
        reason,
      });
    },
    onSuccess: () => {
      Alert.alert('Report Submitted', 'Thank you. We have received your report and will review this content.');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    },
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/blocks/${post.author.id}`);
    },
    onSuccess: () => {
      Alert.alert('User Blocked', `You have blocked ${post.author.username}. You will no longer see their posts or comments.`);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to block user. Please try again.');
    },
  });

  const handleReportPress = useCallback(() => {
    Alert.alert(
      'Report Post',
      'Select a reason for reporting this post:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam', onPress: () => reportMutation.mutate('Spam') },
        { text: 'Harassment', onPress: () => reportMutation.mutate('Harassment') },
        { text: 'Inappropriate Content', onPress: () => reportMutation.mutate('Inappropriate Content') },
        { text: 'Other', onPress: () => reportMutation.mutate('Other') },
      ]
    );
  }, [reportMutation]);

  const handleBlockPress = useCallback(() => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${post.author.username}? They won't be able to see your profile, and you won't see their posts or comments.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => blockMutation.mutate(),
        },
      ]
    );
  }, [post.author, blockMutation]);

  const handleMenuPress = useCallback(() => {
    if (isOwnPost || isAdmin) {
      Alert.alert(
        'Post Options',
        undefined,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete Post', style: 'destructive', onPress: handleDeletePress },
        ]
      );
    } else {
      Alert.alert(
        'Post Options',
        undefined,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Report Post', style: 'destructive', onPress: handleReportPress },
          { text: 'Block User', style: 'destructive', onPress: handleBlockPress },
        ]
      );
    }
  }, [isOwnPost, isAdmin, handleDeletePress, handleReportPress, handleBlockPress]);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => onProfilePress(post.author.username)}
            activeOpacity={0.7}
          >
            {post.author.avatarUrl ? (
              <Image
                source={{ uri: post.author.avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>{getAvatarLetter(post)}</Text>
              </View>
            )}
            <View style={styles.headerText}>
              <Text style={styles.username}>{post.author.username}</Text>
              {post.author.displayName ? (
                <Text style={styles.displayName} numberOfLines={1}>
                  {post.author.displayName}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>

          {/* Follow Button */}
          {!isOwnPost && currentUser && (
            <TouchableOpacity
              onPress={() => followMutation.mutate()}
              disabled={followMutation.isPending}
              style={[
                styles.followBtn,
                post.isFollowingAuthor && styles.followingBtn
              ]}
            >
              <Text style={[
                styles.followBtnText,
                post.isFollowingAuthor && styles.followingBtnText
              ]}>
                {followMutation.isPending ? '...' : post.isFollowingAuthor ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {currentUser && (
          <TouchableOpacity
            onPress={handleMenuPress}
            style={styles.menuButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Image / Video ── */}
      {post.imageUrl ? (
        isVideoUrl(post.imageUrl) ? (
          <PostVideo
            source={post.imageUrl}
            isActive={isActive}
            style={styles.postImage}
          />
        ) : (
          <Image
            source={{ uri: post.imageUrl }}
            style={styles.postImage}
            resizeMode="cover"
          />
        )
      ) : null}

      {/* ── Actions ── */}
      <View style={styles.actionsRow}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity
            onPress={handleLikePress}
            style={styles.actionButton}
            activeOpacity={0.6}
          >
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={26}
              color={post.isLiked ? '#ED4956' : colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onCommentPress(post.id)}
            style={styles.actionButton}
            activeOpacity={0.6}
          >
            <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.6}>
            <Ionicons name="paper-plane-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Likes & Views count ── */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 14, marginTop: 2 }}>
        {post.viewsCount > 0 && (
          <Text style={styles.likesCount}>
            {(post.viewsCount || 0).toLocaleString()} {post.viewsCount === 1 ? 'view' : 'views'}
          </Text>
        )}
        {post.viewsCount > 0 && post.likesCount > 0 && (
          <Text style={styles.likesCount}> • </Text>
        )}
        {post.likesCount > 0 && (
          <Text style={styles.likesCount}>
            {(post.likesCount || 0).toLocaleString()} {post.likesCount === 1 ? 'like' : 'likes'}
          </Text>
        )}
      </View>

      {/* ── Caption ── */}
      {post.caption ? (
        <View style={styles.captionRow}>
          <Text style={styles.captionText}>
            <Text
              style={styles.captionUsername}
              onPress={() => onProfilePress(post.author.username)}
            >
              {post.author.username}
            </Text>
            {'  '}
            {post.caption}
          </Text>
        </View>
      ) : null}

      {/* ── Comments count ── */}
      {post.commentsCount > 0 && (
        <TouchableOpacity
          onPress={() => onCommentPress(post.id)}
          activeOpacity={0.6}
        >
          <Text style={styles.viewComments}>
            View all {post.commentsCount} comment
            {post.commentsCount !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Timestamp ── */}
      <Text style={styles.timestamp}>{timeAgo(post.createdAt)}</Text>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  followBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  followingBtn: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  followingBtnText: {
    color: colors.textSecondary,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerText: {
    marginLeft: 10,
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.1,
  },
  displayName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  menuButton: {
    padding: 4,
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.background,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
    padding: 2,
  },
  likesCount: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.text,
  },
  captionRow: {
    paddingHorizontal: 14,
    marginTop: 4,
  },
  captionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  captionUsername: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.text,
  },
  viewComments: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textSecondary,
    paddingHorizontal: 14,
    marginTop: 4,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

export default PostCard;
