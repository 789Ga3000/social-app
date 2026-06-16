import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Image, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../src/lib/api';
import { useAuth } from '../src/lib/auth-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/lib/theme';

export default function EditProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profileData) {
      setDisplayName(profileData.displayName || '');
      setBio(profileData.profile?.bio || '');
      setWebsiteUrl(profileData.profile?.websiteUrl || '');
      setAvatarUrl(profileData.profile?.avatarUrl || '');
    }
  }, [profileData]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      let finalAvatarUrl = avatarUrl;
      
      if (avatarUri) {
        const formData = new FormData();
        const filename = avatarUri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1].toLowerCase() : 'jpg';
        const isVid = ['mp4', 'mov', 'webm', 'avi'].includes(ext);
        const type = isVid ? `video/${ext}` : `image/${ext}`;

        formData.append('file', {
          uri: avatarUri,
          name: filename,
          type,
        } as any);

        const uploadRes = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalAvatarUrl = uploadRes.data.url;
      }

      await api.patch('/users/me', {
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        avatarUrl: finalAvatarUrl?.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['profile', user.username] });
      }
      router.back();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update profile');
    }
  });

  const handleSave = () => {
    updateMutation.mutate();
  };

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/users/me');
    },
    onSuccess: async () => {
      Alert.alert(
        'Account Deleted',
        'Your account has been successfully deleted.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
              router.replace('/(auth)/login');
            },
          },
        ]
      );
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    },
  });

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently remove all your posts, comments, likes, and followers.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: () => deleteAccountMutation.mutate(),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.headerButton}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.doneText}>Done</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Bio"
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={150}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website Link</Text>
            <TextInput
              style={styles.input}
              value={websiteUrl}
              onChangeText={setWebsiteUrl}
              placeholder="https://example.com"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <View style={styles.avatarSection}>
            {avatarUri || avatarUrl ? (
              <Image source={{ uri: avatarUri || avatarUrl }} style={styles.avatarPreview} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
            <TouchableOpacity style={styles.changeAvatarBtn} onPress={pickImage}>
              <Text style={styles.changeAvatarText}>Change Profile Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Legal / Policy Links */}
          <View style={styles.policyLinksSection}>
            <Text style={styles.policyText}>
              By using this app, you agree to our{' '}
              <Text style={styles.linkText} onPress={() => router.push('/terms' as any)}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.linkText} onPress={() => router.push('/privacy' as any)}>Privacy Policy</Text>.
            </Text>
          </View>

          {/* Admin Options */}
          {user?.role === 'ADMIN' && (
            <View style={styles.adminZone}>
              <Text style={styles.adminZoneTitle}>Admin Options</Text>
              <TouchableOpacity 
                style={styles.adminBtn} 
                onPress={() => router.push('/admin' as any)}
              >
                <Text style={styles.adminBtnText}>Admin Moderation Console</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Danger Zone */}
          <View style={styles.dangerZone}>
            <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
            <TouchableOpacity 
              style={styles.deleteAccountBtn} 
              onPress={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.deleteAccountText}>Delete Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: { padding: 4, minWidth: 60, alignItems: 'center' },
  cancelText: { fontSize: 16, color: colors.text },
  doneText: { fontSize: 16, color: colors.primary, fontWeight: 'bold' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  form: { padding: 16 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    fontSize: 16,
    paddingVertical: 8,
    color: colors.text,
  },
  textArea: {
    maxHeight: 80,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  changeAvatarBtn: {
    padding: 8,
  },
  changeAvatarText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  policyLinksSection: {
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  policyText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  adminZone: {
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  adminZoneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  adminBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  dangerZone: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 20,
    marginBottom: 30,
  },
  dangerZoneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.danger || '#dc3545',
    marginBottom: 12,
  },
  deleteAccountBtn: {
    backgroundColor: colors.danger || '#dc3545',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAccountText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
