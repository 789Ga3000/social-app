import React, { useRef, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-store';
import PostCard from '../../src/components/post-card';
import CommentsSheet from '../../src/components/comments-sheet';
import { useTheme } from '../../src/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function PostDetailScreen() {
  const { id, userId, index } = useLocalSearchParams<{ id: string; userId: string; index: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(id);

  const { data: postsData, isLoading } = useQuery({
    queryKey: ['user-posts', userId],
    queryFn: async () => {
      const res = await api.get(`/posts/user/${userId}`);
      return res.data.posts;
    },
    enabled: !!userId,
  });

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActivePostId(viewableItems[0].item.id);
    }
  }).current;

  const renderItem = ({ item }: { item: any }) => (
    <View style={{ height: Dimensions.get('window').height }}>
      <PostCard 
        post={item} 
        currentUserId={user?.id || ''} 
        isActive={activePostId === item.id}
        onCommentPress={(postId) => setActiveCommentPostId(postId)}
        onProfilePress={(username) => router.back()}
      />
    </View>
  );

  const getItemLayout = (data: any, index: number) => ({
    length: Dimensions.get('window').height,
    offset: Dimensions.get('window').height * index,
    index,
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const initialScrollIndex = parseInt(index || '0', 10);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <FlatList
        data={postsData || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        pagingEnabled
        initialScrollIndex={initialScrollIndex}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <SafeAreaView style={styles.headerArea} edges={['top']}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      <CommentsSheet 
        postId={activeCommentPostId} 
        visible={activeCommentPostId !== null} 
        onClose={() => setActiveCommentPostId(null)} 
      />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  headerArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
