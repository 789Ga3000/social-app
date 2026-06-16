import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/lib/theme';

export default function PrivacyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.lastUpdated}>Last Updated: June 15, 2026</Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect information you provide directly to us when you create an account, update your profile, post content, interact with other users, or communicate with our support team. This includes your email, username, display name, profile details, and any media or captions you upload.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use the information we collect to provide, maintain, and improve our services, develop new features, personalize your feed, award streak and creator rewards, facilitate account security, and protect against fraudulent or inappropriate activity.
        </Text>

        <Text style={styles.sectionTitle}>3. Sharing of Information</Text>
        <Text style={styles.paragraph}>
          Your public profile information, posts, comments, likes, and followers are visible to other users on the platform. We do not sell your personal data to third parties. We may disclose your information to comply with legal obligations, enforce our terms, or protect the rights and safety of our community.
        </Text>

        <Text style={styles.sectionTitle}>4. Data Security & Storage</Text>
        <Text style={styles.paragraph}>
          We take reasonable measures to protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no data transmission over the internet or security system can be guaranteed to be 100% secure.
        </Text>

        <Text style={styles.sectionTitle}>5. Content Moderation & Reporting</Text>
        <Text style={styles.paragraph}>
          To maintain a safe community, users can block other profiles or report inappropriate posts and users. Reported content is reviewed by our administration team. Severe violations may result in content deletion or permanent account suspension.
        </Text>

        <Text style={styles.sectionTitle}>6. Your Choices & Deletion Rights</Text>
        <Text style={styles.paragraph}>
          You can edit your profile information or adjust visibility settings at any time. If you wish to delete your account, you can select the "Delete Account" option in your Profile Settings. This will permanently remove your profile, posts, comments, and relationships from the active database.
        </Text>

        <Text style={styles.sectionTitle}>7. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions or concerns about this Privacy Policy, please reach out to us at privacy@socialapp.com.
        </Text>
      </ScrollView>
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
  scrollContent: { padding: 20, paddingBottom: 40 },
  lastUpdated: { fontSize: 13, color: colors.textSecondary, marginBottom: 20, fontStyle: 'italic' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginTop: 20, marginBottom: 8 },
  paragraph: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 12 },
});
