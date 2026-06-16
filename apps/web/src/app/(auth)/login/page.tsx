import { AuthCard } from '@/components/auth-card';
import { AuthForm } from '@/components/auth-form';

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to continue to your feed."
      switchHref="/signup"
      switchLabel="Create a new account"
    >
      <AuthForm mode="login" />
    </AuthCard>
  );
}
