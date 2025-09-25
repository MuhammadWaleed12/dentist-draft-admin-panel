import { BookingPage } from '@/components/booking-page';

interface BookingPageProps {
  params: {
    id: string;
  };
}

export default function Booking({ params }: BookingPageProps) {
  return <BookingPage practiceId={params.id} />;
}