import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ProfileGridItem from '../../src/components/profile-grid-item';
import api from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/lib/theme';

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const isOwnProfile = currentUser?.username === username;

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const res = await api.get(`/users/${username}/profile`);
      return res.data;
    },
    enabled: !!username,
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', profileData?.id],
    queryFn: async () => {
      const res = await api.get(`/posts/user/${profileData.id}`);
      return res.data.posts;
    },
    enabled: !!profileData?.id,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (profileData.isFollowing) {
        await api.delete(`/users/${profileData.id}/follow`);
      } else {
        await api.post(`/users/${profileData.id}/follow`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
    }
  });

  const reportMutation = useMutation({
    mutationFn: async (reason: string) => {
      await api.post('/reports', {
        targetId: profileData.id,
        type: 'USER',
        reason,
      });
    },
    onSuccess: () => {
      Alert.alert('Report Submitted', 'Thank you. We have received your report and will review this account.');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    },
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/blocks/${profileData.id}`);
    },
    onSuccess: () => {
      Alert.alert('User Blocked', `You have blocked ${profileData.username}.`);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      router.back();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to block user. Please try again.');
    },
  });

  const handleReportPress = () => {
    Alert.alert(
      'Report User',
      'Select a reason for reporting this user:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam', onPress: () => reportMutation.mutate('Spam') },
        { text: 'Harassment', onPress: () => reportMutation.mutate('Harassment') },
        { text: 'Inappropriate Profile/Content', onPress: () => reportMutation.mutate('Inappropriate Content') },
        { text: 'Other', onPress: () => reportMutation.mutate('Other') },
      ]
    );
  };

  const handleBlockPress = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${profileData.username}? They won't be able to see your profile, and you won't see their posts or comments.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => blockMutation.mutate(),
        },
      ]
    );
  };

  const handleMenuPress = () => {
    Alert.alert(
      'Profile Options',
      undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report User', style: 'destructive', onPress: handleReportPress },
        { text: 'Block User', style: 'destructive', onPress: handleBlockPress },
      ]
    );
  };

  if (profileLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: colors.text }}>User not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderPost = ({ item, index }: { item: any; index: number }) => (
    <ProfileGridItem 
      item={item} 
      onPress={() => router.push(`/post/${item.id}?userId=${profileData.id}&index=${index}`)} 
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerUsername}>{profileData.username}</Text>
        {!isOwnProfile && currentUser ? (
          <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <FlatList
        ListHeaderComponent={
          <>
            <View style={styles.profileInfo}>
              {profileData.profile?.avatarUrl ? (
                <Image source={{ uri: profileData.profile.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{(profileData.username || '?')[0].toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{profileData.profile?.postsCount || 0}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{profileData.profile?.followersCount || 0}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{profileData.profile?.followingCount || 0}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
              </View>
            </View>

            <View style={styles.bioSection}>
              <Text style={styles.displayName}>{profileData.displayName || profileData.username}</Text>
              {profileData.profile?.bio && (
                <Text style={styles.bio}>{profileData.profile.bio}</Text>
              )}
              {profileData.profile?.websiteUrl && (
                <TouchableOpacity 
                  style={styles.websiteLinkContainer}
                  onPress={() => {
                    let url = profileData.profile.websiteUrl;
                    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
                    Linking.openURL(url).catch(() => {});
                  }}
                >
                  <Ionicons name="link" size={14} color={colors.primary} />
                  <Text style={styles.websiteLinkText} numberOfLines={1}>
                    {profileData.profile.websiteUrl.replace(/^https?:\/\//, '')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {!isOwnProfile && (
              <View style={styles.actionSection}>
                <TouchableOpacity 
                  style={[styles.followButton, profileData.isFollowing && styles.followingButton]}
                  onPress={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                >
                  <Text style={[styles.followButtonText, profileData.isFollowing && styles.followingButtonText]}>
                    {followMutation.isPending ? '...' : profileData.isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        data={postsData || []}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        numColumns={3}
        contentContainerStyle={styles.gridContainer}
        ListEmptyComponent={
          !postsLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>No Posts Yet</Text>
            </View>
          ) : (
            <ActivityIndicator style={{ marginTop: 20 }} />
          )
        }
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: 4 },
  menuButton: { padding: 4 },
  headerUsername: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  profileInfo: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: 14, color: colors.textSecondary },
  bioSection: { paddingHorizontal: 16, paddingBottom: 16 },
  displayName: { fontWeight: 'bold', fontSize: 14, color: colors.text },
  bio: { fontSize: 14, marginTop: 4, color: colors.text, lineHeight: 20 },
  websiteLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  websiteLinkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  actionSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  followButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: colors.inputBg,
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  followingButtonText: {
    color: colors.text,
  },
  gridContainer: { paddingBottom: 20 },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 16,
  },
});
