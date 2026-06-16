import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';

const isVideoUrl = (url?: string) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm');
};

interface ProfileGridItemProps {
  item: any;
}

const ProfileVideoThumbnail = ({ source, style }: { source: string; style: any }) => {
  const player = useVideoPlayer(source, player => {
    player.loop = false;
    player.muted = true;
    player.pause();
  });
  return <VideoView player={player} style={style} contentFit="cover" />;
};

export default function ProfileGridItem({ item }: ProfileGridItemProps) {
  const isVideo = isVideoUrl(item.imageUrl);
  const { colors } = useTheme();

  return (
    <View style={styles.gridItem}>
      {item.imageUrl ? (
        <View style={styles.mediaContainer}>
          {isVideo ? (
            <ProfileVideoThumbnail source={item.imageUrl} style={[styles.gridImage, { backgroundColor: colors.border }]} />
          ) : (
            <Image source={{ uri: item.imageUrl }} style={[styles.gridImage, { backgroundColor: colors.border }]} resizeMode="cover" />
          )}
          {isVideo && (
            <View style={styles.videoIconContainer}>
              <Ionicons name="play" size={20} color="#fff" />
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.textPost, { backgroundColor: colors.inputBg }]}>
          <Text numberOfLines={3} style={[styles.textPostCaption, { color: colors.textSecondary }]}>{item.caption}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gridItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 1,
  },
  mediaContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  videoIconContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  textPost: {
    width: '100%',
    height: '100%',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textPostCaption: {
    fontSize: 12,
    textAlign: 'center',
  },
});
