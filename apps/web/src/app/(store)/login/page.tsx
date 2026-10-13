import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/auth-form';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="page-container flex min-h-[65vh] items-center justify-center py-12">
      <AuthForm mode="login" />
    </div>
  );
}
