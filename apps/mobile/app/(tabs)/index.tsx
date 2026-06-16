import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import PostCard from '../../src/components/post-card';
import CommentsSheet from '../../src/components/comments-sheet';
import { useTheme } from '../../src/lib/theme';

export default function FeedScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  
  const [refreshing, setRefreshing] = React.useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = React.useState<string | null>(null);
  const [activePostId, setActivePostId] = React.useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const res = await api.get('/posts');
      return res.data.posts;
    },
    enabled: !!user,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const viewabilityConfig = React.useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActivePostId(viewableItems[0].item.id);
    }
  }).current;

  const renderItem = ({ item }: { item: any }) => (
    <PostCard 
      post={item} 
      currentUserId={user?.id || ''} 
      isActive={activePostId === item.id}
      onCommentPress={(postId) => setActiveCommentPostId(postId)}
      onProfilePress={(username) => router.push(`/user/${username}` as any)}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Coolgenz Feed</Text>
      </View>

      {isLoading && !refreshing ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      )}

      <CommentsSheet 
        postId={activeCommentPostId} 
        visible={activeCommentPostId !== null} 
        onClose={() => setActiveCommentPostId(null)} 
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.feedBg },
  header: {
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
});
