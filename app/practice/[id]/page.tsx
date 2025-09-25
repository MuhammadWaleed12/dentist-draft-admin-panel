import { PracticeProfilePage } from '@/components/practice-profile-page';

interface PracticePageProps {
  params: {
    id: string;
  };
}

export default function PracticePage({ params }: PracticePageProps) {
  return <PracticeProfilePage practiceId={params.id} />;
}