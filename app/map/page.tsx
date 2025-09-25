import { MapPage } from '@/components/map-page';
import { Suspense } from 'react';

export default function Map() {
  return     <Suspense fallback={<div className="text-center py-10 text-muted">Loading map...</div>}><MapPage /></Suspense>;
}