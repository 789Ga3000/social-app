import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/lib/theme';

export default function TermsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.lastUpdated}>Last Updated: June 15, 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By creating an account, accessing, or using our mobile application, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not download, install, or use the application.
        </Text>

        <Text style={styles.sectionTitle}>2. User Account Eligibility</Text>
        <Text style={styles.paragraph}>
          You must be at least 13 years old to use our service. You are responsible for maintaining the confidentiality of your account credentials and password, and you are solely responsible for all activities that occur under your account.
        </Text>

        <Text style={styles.sectionTitle}>3. User-Generated Content</Text>
        <Text style={styles.paragraph}>
          You retain all ownership rights in the content you upload, post, or share. By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content for the purpose of operating and promoting the platform.
        </Text>

        <Text style={styles.sectionTitle}>4. Community Guidelines & Prohibited Content</Text>
        <Text style={styles.paragraph}>
          You agree not to post any content that is illegal, abusive, harassing, defamatory, hateful, sexually explicit, or infringing upon intellectual property rights. Spamming, bot behavior, and user harassment are strictly prohibited.
        </Text>

        <Text style={styles.sectionTitle}>5. Moderation & Account Suspension</Text>
        <Text style={styles.paragraph}>
          We reserve the right to monitor content and remove any posts that violate these Terms. We also reserve the right to suspend or terminate accounts that repeatedly engage in prohibited conduct, without warning or liability. Users have tools to report posts and block offending accounts.
        </Text>

        <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          To the maximum extent permitted by law, our platform and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, arising out of your use of or inability to use the service.
        </Text>

        <Text style={styles.sectionTitle}>7. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We may modify these Terms of Service from time to time. We will notify you of any material changes by updating the date at the top of these terms. Continued use of the application after changes are posted constitutes acceptance of the new Terms.
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
