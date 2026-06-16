import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/lib/theme';

export default function RewardsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [spinning, setSpinning] = useState(false);
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const { data: profileData } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const res = await api.get(`/users/me`);
      return res.data;
    },
  });

  const { data: missionsData, isLoading: missionsLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: async () => {
      const res = await api.get(`/users/me/missions`);
      return res.data.missions;
    },
  });

  const spinMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/users/me/spin`);
      return res.data;
    },
    onSuccess: (data) => {
      Alert.alert('🎉 Congratulations!', `You won ${data.reward} ⭐ Stars!`);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (error: any) => {
      Alert.alert('Lucky Spin', error.response?.data?.message || 'You have already spun today!');
    },
    onSettled: () => setSpinning(false),
  });

  const claimMutation = useMutation({
    mutationFn: async (missionId: string) => {
      await api.post(`/users/me/missions/${missionId}/claim`);
    },
    onSuccess: () => {
      Alert.alert('Claimed!', 'Stars added to your wallet.');
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Could not claim mission.');
    },
  });

  const handleSpin = () => {
    setSpinning(true);
    setTimeout(() => {
      spinMutation.mutate();
    }, 1500);
  };

  const getMissionTitle = (type: string) => {
    switch (type) {
      case 'UPLOAD_POST': return 'Upload a Post';
      case 'RECEIVE_LIKES': return 'Receive Likes';
      case 'WRITE_COMMENTS': return 'Write Comments';
      default: return 'Unknown Mission';
    }
  };

  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localNow = new Date(now.getTime() - (offset * 60 * 1000));
  const todayStr = localNow.toISOString().split('T')[0];
  const hasSpunToday = profileData?.profile?.lastSpinDate === todayStr;

  const renderMission = ({ item }: { item: any }) => {
    return (
      <View style={styles.missionCard}>
        <View style={styles.missionInfo}>
          <Text style={styles.missionTitle}>{getMissionTitle(item.type)}</Text>
          <Text style={styles.missionProgress}>
            Progress: {item.progress} / {item.target}
          </Text>
        </View>
        <View style={styles.missionAction}>
          <Text style={styles.rewardText}>+{item.rewardStars} ⭐</Text>
          {item.claimed ? (
            <View style={styles.claimedBadge}><Text style={styles.claimedText}>Claimed</Text></View>
          ) : item.completed ? (
            <TouchableOpacity style={styles.claimButton} onPress={() => claimMutation.mutate(item.id)}>
              <Text style={styles.claimButtonText}>Claim</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.pendingBadge}><Text style={styles.pendingText}>Pending</Text></View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards & Missions</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={missionsData || []}
        keyExtractor={(item) => item.id}
        renderItem={renderMission}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <>
            <View style={styles.spinCard}>
              <Text style={styles.spinTitle}>Daily Lucky Spin</Text>
              <Text style={styles.spinDesc}>Spin once every 24 hours to win up to 100 ⭐!</Text>
              
              <TouchableOpacity 
                style={[styles.spinButton, (hasSpunToday || spinning) && styles.spinButtonDisabled]}
                onPress={handleSpin}
                disabled={hasSpunToday || spinning}
              >
                {spinning ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.spinButtonText}>
                    {hasSpunToday ? 'Come back tomorrow' : 'SPIN NOW'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Daily Missions</Text>
          </>
        }
      />
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
  listContainer: { paddingHorizontal: 16, paddingBottom: 24 },
  spinCard: {
    marginVertical: 16,
    padding: 24,
    backgroundColor: colors.cardGradientStart,
    borderRadius: 16,
    alignItems: 'center',
  },
  spinTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  spinDesc: { fontSize: 14, color: colors.cardGradientText, textAlign: 'center', marginTop: 8, marginBottom: 16 },
  spinButton: {
    backgroundColor: '#ffcc00',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    width: '80%',
    alignItems: 'center',
  },
  spinButtonDisabled: { backgroundColor: colors.border },
  spinButtonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: colors.text },
  missionCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missionInfo: { flex: 1 },
  missionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  missionProgress: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  missionAction: { alignItems: 'flex-end', justifyContent: 'center' },
  rewardText: { fontSize: 14, fontWeight: 'bold', color: colors.warningText, marginBottom: 6 },
  claimButton: { backgroundColor: colors.success, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
  claimButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  claimedBadge: { backgroundColor: colors.inputBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  claimedText: { color: colors.textSecondary, fontWeight: 'bold', fontSize: 12 },
  pendingBadge: { backgroundColor: colors.warningBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  pendingText: { color: colors.warningText, fontWeight: 'bold', fontSize: 12 },
});
