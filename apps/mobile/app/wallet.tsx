import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/lib/theme';

export default function WalletScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const { data, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await api.get(`/users/me/wallet`);
      return res.data;
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await api.post(`/users/me/withdraw`, { amount });
      return res.data;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Stars withdrawn successfully!');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      Alert.alert('Withdrawal Failed', error.response?.data?.message || 'Error processing withdrawal');
    },
  });

  const handleWithdraw = () => {
    if (!data || data.balance < 10000) {
      Alert.alert('Not enough Stars', 'You need at least 10,000 ⭐ to withdraw.');
      return;
    }
    Alert.alert(
      'Withdraw Stars',
      'Withdraw 10,000 ⭐ for ₹100 INR?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Withdraw', onPress: () => withdrawMutation.mutate(10000) },
      ]
    );
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const isEarn = item.amount > 0;
    return (
      <View style={styles.transactionCard}>
        <View style={styles.txLeft}>
          <Text style={styles.txReason}>{item.reason.replace(/_/g, ' ')}</Text>
          <Text style={styles.txDate}>{new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}</Text>
        </View>
        <Text style={[styles.txAmount, { color: isEarn ? colors.success : colors.danger }]}>
          {isEarn ? '+' : ''}{item.amount} ⭐
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>{data?.balance || 0} ⭐</Text>
            <View style={styles.lifetimeBox}>
              <Text style={styles.lifetimeText}>Lifetime Earned: {data?.lifetime || 0} ⭐</Text>
            </View>
            <TouchableOpacity 
              style={styles.withdrawButton} 
              onPress={handleWithdraw}
              disabled={withdrawMutation.isPending}
            >
              <Text style={styles.withdrawButtonText}>Withdraw 10,000 ⭐ = ₹100</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.leaderboardButton} onPress={() => router.push('/leaderboard' as any)}>
            <Ionicons name="trophy-outline" size={20} color={colors.text} style={{marginRight: 8}} />
            <Text style={styles.leaderboardButtonText}>Creator Leaderboard</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Transaction History</Text>
          <FlatList
            data={data?.transactions || []}
            keyExtractor={(item) => item.id}
            renderItem={renderTransaction}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No transactions yet. Start creating posts to earn stars!</Text>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  balanceCard: {
    margin: 16,
    padding: 24,
    backgroundColor: colors.walletCardBg,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: { fontSize: 16, color: colors.walletCardText, opacity: 0.8 },
  balanceAmount: { fontSize: 48, fontWeight: 'bold', color: colors.walletCardText, marginVertical: 8 },
  lifetimeBox: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  lifetimeText: { fontSize: 12, fontWeight: '600', color: colors.walletCardText },
  withdrawButton: {
    backgroundColor: colors.primary,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  withdrawButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  leaderboardButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderColor: colors.walletBorder,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  leaderboardButtonText: { fontWeight: 'bold', fontSize: 16, color: colors.text },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 16, marginBottom: 8, color: colors.text },
  listContainer: { paddingHorizontal: 16, paddingBottom: 24 },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txLeft: { flex: 1 },
  txReason: { fontSize: 14, fontWeight: 'bold', color: colors.text, textTransform: 'capitalize' },
  txDate: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  txAmount: { fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: colors.textSecondary, marginTop: 32 },
});
