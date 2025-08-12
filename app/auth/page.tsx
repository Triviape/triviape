import { Metadata } from 'next';
import AuthPageClient from '../components/auth/AuthPage';

export const metadata: Metadata = {
  title: 'Sign In | Triviape',
  description: 'Sign in to your Triviape account or create a new one to start playing trivia games.',
};

export default function Page() {
  return <AuthPageClient />;
} 