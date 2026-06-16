import { AuthCard } from '@/components/auth-card';
import { AuthForm } from '@/components/auth-form';

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Choose a username and start shaping your profile."
      switchHref="/login"
      switchLabel="Already have an account?"
    >
      <AuthForm mode="signup" />
    </AuthCard>
  );
}
