import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../src/lib/api';
import { useTheme } from '../src/lib/theme';

export default function AdminScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: async () => {
      const res = await api.get('/admin/reports');
      return res.data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ reportId, action }: { reportId: string, action: 'DISMISS' | 'DELETE_POST' | 'BAN_USER' }) => {
      await api.post(`/admin/reports/${reportId}/resolve`, { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to resolve report.');
    }
  });

  const handleResolve = (reportId: string, action: 'DISMISS' | 'DELETE_POST' | 'BAN_USER') => {
    const actionText = action === 'DISMISS' ? 'Dismiss Report' : action === 'DELETE_POST' ? 'Delete Post' : 'Ban Creator';
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${actionText}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          style: action === 'DISMISS' ? 'default' : 'destructive',
          onPress: () => resolveMutation.mutate({ reportId, action }) 
        }
      ]
    );
  };

  const renderReport = ({ item }: { item: any }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Reason: {item.reason}</Text>
          <Text style={styles.cardTarget}>
            Target: {item.targetType === 'POST' ? 'Post' : 'User'} ({item.targetId.substring(0, 8)}...)
          </Text>
        </View>
        <Text style={styles.reporterInfo}>Reported by User: {item.reporterId.substring(0, 8)}...</Text>
        <Text style={styles.statusInfo}>Status: {item.status}</Text>
        
        {item.status === 'PENDING' && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.dismissBtn]} 
              onPress={() => handleResolve(item.id, 'DISMISS')}
              disabled={resolveMutation.isPending}
            >
              <Text style={styles.dismissBtnText}>Dismiss</Text>
            </TouchableOpacity>
            
            {item.targetType === 'POST' ? (
              <TouchableOpacity 
                style={[styles.actionBtn, styles.dangerBtn]} 
                onPress={() => handleResolve(item.id, 'DELETE_POST')}
                disabled={resolveMutation.isPending}
              >
                <Text style={styles.dangerBtnText}>Delete Post</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.actionBtn, styles.dangerBtn]} 
                onPress={() => handleResolve(item.id, 'BAN_USER')}
                disabled={resolveMutation.isPending}
              >
                <Text style={styles.dangerBtnText}>Ban User</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Moderation Console</Text>
        <View style={styles.backButton} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data?.reports || []}
          keyExtractor={(item) => item.id}
          renderItem={renderReport}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No pending reports.</Text>
            </View>
          )}
        />
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
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: { padding: 4, minWidth: 40 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  cardTarget: { fontSize: 14, color: colors.textSecondary },
  reporterInfo: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  statusInfo: { fontSize: 14, fontWeight: '600', color: colors.primary, marginBottom: 12 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
  },
  dismissBtn: {
    backgroundColor: 'transparent',
    borderColor: colors.textSecondary,
  },
  dismissBtnText: {
    color: colors.text,
    fontWeight: '600',
  },
  dangerBtn: {
    backgroundColor: colors.danger || '#dc3545',
    borderColor: colors.danger || '#dc3545',
  },
  dangerBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
});
