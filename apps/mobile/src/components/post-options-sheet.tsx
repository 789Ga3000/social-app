import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, PanResponder, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';

interface PostOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  isOwnPost: boolean;
  isAdmin: boolean;
  onReport?: () => void;
  onBlock?: () => void;
  onDelete?: () => void;
  onCopyLink?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PostOptionsSheet({ 
  visible, 
  onClose, 
  isOwnPost, 
  isAdmin,
  onReport,
  onBlock,
  onDelete,
  onCopyLink
}: PostOptionsSheetProps) {
  const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const { colors } = useTheme();

  const resetPositionAnim = Animated.timing(panY, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  });

  const closeAnim = Animated.timing(panY, {
    toValue: SCREEN_HEIGHT,
    duration: 250,
    useNativeDriver: true,
  });

  useEffect(() => {
    if (visible) {
      resetPositionAnim.start();
    } else {
      closeAnim.start();
    }
  }, [visible]);

  const handleClose = () => {
    closeAnim.start(() => onClose());
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10; // Only capture if moving down
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          handleClose();
        } else {
          resetPositionAnim.start();
        }
      },
    })
  ).current;

  // We still render the modal when closing to allow the animation to finish
  if (!visible && (panY as any)._value === SCREEN_HEIGHT) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.background} />
        </TouchableWithoutFeedback>
        
        <Animated.View 
          style={[
            styles.sheet, 
            { transform: [{ translateY: panY }] }
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
          
          <Text style={styles.title}>Post Options</Text>

          {(isOwnPost || isAdmin) && onDelete && (
            <TouchableOpacity style={styles.optionRow} onPress={() => { handleClose(); onDelete(); }}>
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              <Text style={[styles.optionText, { color: '#FF3B30' }]}>Delete Post</Text>
            </TouchableOpacity>
          )}

          {(!isOwnPost) && onReport && (
            <TouchableOpacity style={styles.optionRow} onPress={() => { handleClose(); onReport(); }}>
              <Ionicons name="flag-outline" size={24} color="#FF3B30" />
              <Text style={[styles.optionText, { color: '#FF3B30' }]}>Report Post</Text>
            </TouchableOpacity>
          )}

          {(!isOwnPost) && onBlock && (
            <TouchableOpacity style={styles.optionRow} onPress={() => { handleClose(); onBlock(); }}>
              <Ionicons name="ban-outline" size={24} color="#FF3B30" />
              <Text style={[styles.optionText, { color: '#FF3B30' }]}>Block User</Text>
            </TouchableOpacity>
          )}

          {onCopyLink && (
            <TouchableOpacity style={styles.optionRow} onPress={() => { handleClose(); onCopyLink(); }}>
              <Ionicons name="link-outline" size={24} color="#FFFFFF" />
              <Text style={[styles.optionText, { color: '#FFFFFF' }]}>Copy Link</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.optionRow} onPress={handleClose}>
            <Ionicons name="close-outline" size={24} color="#FFFFFF" />
            <Text style={[styles.optionText, { color: '#FFFFFF' }]}>Cancel</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  background: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30, // Safe area for bottom
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#555',
    borderRadius: 2,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
});
