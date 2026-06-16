import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/lib/theme';

export default function LeaderboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = await api.get(`/users/leaderboard`);
      return res.data;
    },
  });

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const isTop3 = index < 3;
    return (
      <TouchableOpacity 
        style={[styles.userCard, isTop3 && styles.topUserCard]} 
        onPress={() => router.push(`/user/${item.username}` as any)}
      >
        <Text style={[styles.rank, isTop3 && styles.topRank]}>{getMedal(index)}</Text>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          {item.displayName ? <Text style={styles.displayName}>{item.displayName}</Text> : null}
        </View>
        <Text style={styles.starsText}>{(item.lifetimeStars || 0).toLocaleString()} ⭐</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Leaderboard</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.userId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center', color: colors.text },
  listContainer: { padding: 16 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topUserCard: {
    backgroundColor: colors.leaderboardTopBg,
    borderColor: colors.leaderboardTopBorder,
    borderWidth: 1.5,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textSecondary,
    width: 32,
  },
  topRank: {
    fontSize: 24,
  },
  userInfo: { flex: 1, marginLeft: 8 },
  username: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  displayName: { fontSize: 12, color: colors.textSecondary },
  starsText: { fontSize: 16, fontWeight: 'bold', color: colors.warningText },
});
