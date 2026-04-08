import type { Metadata } from 'next';
import { LandingHome } from '@/components/landing/LandingHome';

export const metadata: Metadata = {
  title: 'BoneVisQA - Radiology Education',
  description:
    'AI-powered interactive visual question answering for radiology education',
};

export default function HomePage() {
  return <LandingHome />;
}
