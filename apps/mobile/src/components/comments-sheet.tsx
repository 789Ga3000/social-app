import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  useWindowDimensions,
  LayoutAnimation,
  UIManager,
} from 'react-native';

// Enable layout animation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../lib/api';
import { useAuth } from '../lib/auth-store';
import { useTheme } from '../lib/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Comment {
  id: string;
  username: string;
  text: string;
  createdAt: string;
  avatarUrl?: string | null;
  displayName?: string | null;
}

const QUICK_EMOJIS = ['❤️', '😂', '🔥', '🙌', '👏', '😢', '😍', '😮'];

interface CommentsResponse {
  comments: Comment[];
}

interface CommentsSheetProps {
  postId: string | null; // null means closed
  visible: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function avatarLetter(username: string): string {
  return (username.charAt(0) || '?').toUpperCase();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CommentsSheet({ postId, visible, onClose }: CommentsSheetProps) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const { user: currentUser } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [visibleHeight, setVisibleHeight] = useState(SCREEN_HEIGHT);

  React.useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        if (Platform.OS === 'ios') {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        setKeyboardHeight(e.endCoordinates.height);
        setKeyboardVisible(true);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        if (Platform.OS === 'ios') {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        setKeyboardHeight(0);
        setKeyboardVisible(false);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Determine if the OS has already resized the screen height for the keyboard (Android adjustResize behavior).
  const hasResized = visibleHeight < SCREEN_HEIGHT - 100;
  const bottomInset = hasResized ? 0 : keyboardHeight;
  const availableHeight = hasResized ? visibleHeight : (visibleHeight - keyboardHeight);

  // Expand to 85% of available space above keyboard when typing, otherwise 65% of screen height
  const sheetHeight = keyboardVisible
    ? availableHeight * 0.85
    : SCREEN_HEIGHT * 0.65;

  const inputPaddingBottom = keyboardVisible ? 10 : Math.max(insets.bottom, 10);

  // ---- Fetch comments ----
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const res = await api.get(`/posts/${postId}/comments`);
      const mappedComments = (res.data.comments || []).map((c: any) => ({
        id: c.id,
        text: c.text,
        createdAt: c.createdAt,
        username: c.author?.username || c.username || 'unknown',
        authorId: c.author?.id || c.userId || '',
        avatarUrl: c.author?.avatarUrl || null,
        displayName: c.author?.displayName || null,
      }));
      return { comments: mappedComments };
    },
    enabled: visible && postId !== null,
  });

  const comments = data?.comments ?? [];

  // ---- Post comment mutation ----
  const postComment = useMutation({
    mutationFn: async (commentText: string) => {
      const res = await api.post(`/posts/${postId}/comments`, { text: commentText });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      setText('');
      inputRef.current?.blur();
    },
  });

  // ---- Delete comment mutation ----
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete comment. Please try again.');
    },
  });

  const handleDeleteComment = (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteCommentMutation.mutate(commentId),
      },
    ]);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || postComment.isPending) return;
    postComment.mutate(trimmed);
  };

  const renderComment = ({ item }: { item: Comment & { authorId?: string } }) => {
    const isOwnComment = item.authorId === currentUser?.id;
    const canDelete = isOwnComment || currentUser?.role === 'ADMIN';

    return (
      <View style={styles.commentRow}>
        <View style={styles.avatar}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{avatarLetter(item.username)}</Text>
          )}
        </View>
        <View style={styles.commentBody}>
          <Text style={styles.commentText}>
            <Text style={styles.commentUsername}>{item.displayName || item.username} </Text>
            {item.text}
          </Text>
          <Text style={styles.commentTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        {canDelete && (
          <TouchableOpacity
            onPress={() => handleDeleteComment(item.id)}
            style={styles.deleteCommentButton}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={16} color="#ef5d60" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubble-outline" size={48} color={colors.border} />
        <Text style={styles.emptyTitle}>No comments yet.</Text>
        <Text style={styles.emptySubtitle}>Be the first!</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay} onLayout={(e) => setVisibleHeight(e.nativeEvent.layout.height)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { bottom: bottomInset, height: sheetHeight }]}>
          <View style={styles.header}>
            <View style={styles.headerHandle} />
            <Text style={styles.headerTitle}>Comments</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#999" />
            </View>
          ) : isError ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.border} />
              <Text style={styles.emptyTitle}>Couldn't load comments</Text>
              <TouchableOpacity onPress={() => refetch()}>
                <Text style={styles.retryText}>Tap to retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              style={{ flex: 1 }}
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={renderComment}
              ListEmptyComponent={renderEmpty}
              contentContainerStyle={
                comments.length === 0 ? styles.listEmptyContent : styles.listContent
              }
              showsVerticalScrollIndicator={false}
            />
          )}

          <View style={styles.divider} />

          <View style={styles.emojiBar}>
            {QUICK_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => setText((prev) => prev + emoji)}
                style={styles.emojiButton}
                activeOpacity={0.6}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={[styles.inputBar, { paddingBottom: inputPaddingBottom }]}>
            <View style={styles.inputAvatar}>
              {(currentUser as any)?.profile?.avatarUrl ? (
                <Image source={{ uri: (currentUser as any).profile.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.inputAvatarText}>{avatarLetter(currentUser?.username || '?')}</Text>
              )}
            </View>

            <View style={styles.textInputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder="Add a comment…"
                placeholderTextColor={colors.textSecondary}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={500}
                returnKeyType="default"
              />
            </View>

            <TouchableOpacity
              onPress={handleSend}
              disabled={!text.trim() || postComment.isPending}
              style={styles.sendButton}
            >
              {postComment.isPending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text
                  style={[
                    styles.sendText,
                    !text.trim() && styles.sendTextDisabled,
                  ]}
                >
                  Post
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const getStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    position: 'relative',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: '100%',
    position: 'absolute',
  },
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  retryText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  listContent: {
    paddingVertical: 8,
  },
  listEmptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  commentBody: {
    flex: 1,
  },
  commentText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 18,
  },
  commentUsername: {
    fontWeight: '700',
    color: colors.text,
  },
  commentTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },
  emojiBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  emojiButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  emojiText: {
    fontSize: 18,
  },
  inputAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  inputAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 6 : 2,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    maxHeight: 80,
    paddingVertical: 4,
  },
  sendButton: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  sendTextDisabled: {
    opacity: 0.35,
  },
  deleteCommentButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
