import LandingPage from '@/components/LandingPage';

type Props = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  return <LandingPage sessionExpired={params.reason === 'session'} />;
}
