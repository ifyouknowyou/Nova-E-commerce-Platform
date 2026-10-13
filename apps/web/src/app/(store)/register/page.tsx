import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/auth-form';

export const metadata: Metadata = {
  title: 'Create an account',
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div className="page-container flex min-h-[65vh] items-center justify-center py-12">
      <AuthForm mode="register" />
    </div>
  );
}
