import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/lib/theme';

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
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

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data.notifications || [];
    },
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleNotificationPress = (item: any) => {
    if (!item.read) {
      markReadMutation.mutate(item.id);
    }
    
    if (item.type === 'FOLLOW') {
      router.push(`/user/${item.actor.username}` as any);
    } else if (item.postId) {
      router.push(`/user/${item.actor.username}` as any);
    }
  };

  const getNotificationText = (item: any) => {
    switch (item.type) {
      case 'LIKE': return 'liked your post.';
      case 'COMMENT': return 'commented on your post.';
      case 'FOLLOW': return 'started following you.';
      default: return 'interacted with your profile.';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'LIKE': return <Ionicons name="heart" size={16} color="#ed4956" />;
      case 'COMMENT': return <Ionicons name="chatbubble" size={16} color="#0095f6" />;
      case 'FOLLOW': return <Ionicons name="person-add" size={16} color="#0095f6" />;
      default: return null;
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.notificationRow, !item.read && styles.unreadRow]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{(item.actor?.username || '?')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.iconBadge}>{getIcon(item.type)}</View>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.text}>
          <Text style={styles.username}>{item.actor.username}</Text> {getNotificationText(item)}
        </Text>
        <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
      </View>

      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={notifications || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={64} color={colors.border} />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  unreadRow: {
    backgroundColor: colors.inputBg,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  iconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.surface,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  contentContainer: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 18,
  },
  username: {
    fontWeight: 'bold',
  },
  timeAgo: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: colors.textSecondary,
    fontSize: 16,
  },
});
