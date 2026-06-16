import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect } from 'expo-router';
import api from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/lib/theme';

const isVideoUrl = (url?: string | null) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm');
};

export default function CreatePostScreen() {
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const isVideo = isVideoUrl(imageUri);
  const [isFocused, setIsFocused] = React.useState(true);
  const player = useVideoPlayer(isVideo && imageUri ? imageUri : null, p => {
    p.loop = true;
  });

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      if (isVideo) player.play();
      return () => {
        setIsFocused(false);
        player.pause();
      };
    }, [isVideo, player])
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!caption.trim() && !imageUri) {
      Alert.alert('Error', 'Please add a caption or an image');
      return;
    }

    setLoading(true);
    try {
      let uploadedUrl = null;

      if (imageUri) {
        const formData = new FormData();
        const filename = imageUri.split('/').pop() || 'upload.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1].toLowerCase() : 'jpg';
        const isVid = ['mp4', 'mov', 'webm', 'avi'].includes(ext);
        const type = isVid ? `video/${ext}` : `image/${ext}`;

        formData.append('file', {
          uri: imageUri,
          name: filename,
          type,
        } as any);

        const uploadRes = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        uploadedUrl = uploadRes.data.url;
      }

      await api.post('/posts', {
        caption,
        imageUrl: uploadedUrl,
      });

      setCaption('');
      setImageUri(null);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Upload Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Post</Text>
      </View>

      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.textSecondary}
          value={caption}
          onChangeText={setCaption}
          multiline
          numberOfLines={4}
        />

        {imageUri ? (
          <View style={styles.imagePreviewContainer}>
            {isVideo ? (
              <VideoView player={player} style={styles.imagePreview} contentFit="cover" />
            ) : (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            )}
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
              <Text style={styles.removeImageText}>X</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.pickImageBtn} onPress={pickImage}>
            <Text style={styles.pickImageText}>📷 Add Photo / Video</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.button, (!caption.trim() && !imageUri) && styles.buttonDisabled]} 
          onPress={handleCreate}
          disabled={loading || (!caption.trim() && !imageUri)}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Post</Text>}
        </TouchableOpacity>
      </View>
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
  content: { padding: 16 },
  input: {
    backgroundColor: colors.inputBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickImageBtn: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  pickImageText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: { color: '#fff', fontWeight: 'bold' },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
