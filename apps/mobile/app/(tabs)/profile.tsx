import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, Linking, Modal, Pressable, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileGridItem from '../../src/components/profile-grid-item';
import { useTheme } from '../../src/lib/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [menuVisible, setMenuVisible] = useState(false);

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.username],
    queryFn: async () => {
      const res = await api.get(`/users/${user?.username}/profile`);
      return res.data;
    },
    enabled: !!user,
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', user?.id],
    queryFn: async () => {
      const res = await api.get(`/posts/user/${user?.id}`);
      return res.data.posts;
    },
    enabled: !!user,
  });

  if (profileLoading || !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderPost = ({ item, index }: { item: any; index: number }) => (
    <ProfileGridItem 
      item={item} 
      onPress={() => router.push(`/post/${item.id}?userId=${user?.id}&index=${index}`)} 
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.username}>{user.username}</Text>
          {profileData?.profile?.creatorLevel && (
            <Text style={styles.creatorLevel}>{profileData.profile.creatorLevel}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuBtn}>
          <Ionicons name="menu-outline" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileInfo}>
        {profileData?.profile?.avatarUrl ? (
          <Image source={{ uri: profileData.profile.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{user.username[0].toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profileData?.profile?.postsCount || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profileData?.profile?.followersCount || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profileData?.profile?.followingCount || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </View>

      <View style={styles.bioSection}>
        <Text style={styles.displayName}>{profileData?.displayName || user.displayName || user.username}</Text>
        {profileData?.profile?.bio && (
          <Text style={styles.bio}>{profileData.profile.bio}</Text>
        )}
        {profileData?.profile?.websiteUrl && (
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
        {profileData?.profile?.accountAgeDays !== undefined && (
          <View style={styles.trustBadge}>
            <Ionicons name="shield-checkmark" size={14} color={colors.success} />
            <Text style={styles.trustText}>Trusted Creator • Joined {profileData.profile.accountAgeDays} days ago</Text>
          </View>
        )}
      </View>

      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.editProfileButton} onPress={() => router.push('/edit-profile' as any)}>
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable 
          style={styles.modalBackdrop} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.dragHandle} />
            <Text style={styles.menuTitle}>Menu</Text>
            
            <ScrollView contentContainerStyle={styles.menuOptionsList}>
              <TouchableOpacity 
                style={styles.menuOption} 
                onPress={() => {
                  setMenuVisible(false);
                  router.push('/wallet' as any);
                }}
              >
                <Ionicons name="wallet-outline" size={22} color={colors.text} style={styles.menuIcon} />
                <Text style={styles.menuOptionText}>Wallet ({profileData?.profile?.starsBalance || 0} ⭐)</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuOption} 
                onPress={() => {
                  setMenuVisible(false);
                  router.push('/rewards' as any);
                }}
              >
                <Ionicons name="trophy-outline" size={22} color={colors.text} style={styles.menuIcon} />
                <Text style={styles.menuOptionText}>Rewards & Missions</Text>
              </TouchableOpacity>

              <View style={styles.menuOptionDisabled}>
                <Ionicons name="ribbon-outline" size={22} color={colors.textSecondary} style={styles.menuIcon} />
                <View>
                  <Text style={styles.menuOptionTextDisabled}>Creator Level</Text>
                  <Text style={styles.menuOptionSubText}>{profileData?.profile?.creatorLevel || 'Bronze Creator 🥉'}</Text>
                </View>
              </View>

              <View style={styles.menuOptionDisabled}>
                <Ionicons name="flame-outline" size={22} color={colors.textSecondary} style={styles.menuIcon} />
                <View>
                  <Text style={styles.menuOptionTextDisabled}>Streak</Text>
                  <Text style={styles.menuOptionSubText}>{profileData?.profile?.currentStreak || 0} days 🔥</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.menuOption} 
                onPress={() => {
                  setMenuVisible(false);
                  router.push('/edit-profile' as any);
                }}
              >
                <Ionicons name="settings-outline" size={22} color={colors.text} style={styles.menuIcon} />
                <Text style={styles.menuOptionText}>Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.menuOption, styles.logoutOption]} 
                onPress={() => {
                  setMenuVisible(false);
                  logout();
                }}
              >
                <Ionicons name="log-out-outline" size={22} color={colors.danger} style={styles.menuIcon} />
                <Text style={styles.logoutOptionText}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {postsLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={postsData || []}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  username: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  creatorLevel: { fontSize: 13, color: colors.warningText, fontWeight: '600', marginTop: 2 },
  menuBtn: { padding: 4 },
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
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  trustText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  editProfileButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileText: { fontWeight: '600', fontSize: 14, color: colors.text },
  gridContainer: { paddingTop: 2 },

  // Bottom Sheet Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  menuOptionsList: {
    paddingHorizontal: 16,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuOptionDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    opacity: 0.85,
  },
  menuIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  menuOptionText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  menuOptionTextDisabled: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  menuOptionSubText: {
    fontSize: 16,
    color: colors.text,
    marginTop: 2,
    fontWeight: '600',
  },
  logoutOption: {
    borderBottomWidth: 0,
  },
  logoutOptionText: {
    fontSize: 16,
    color: colors.danger,
    fontWeight: 'bold',
  },
});
