"use client";

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/footer';

export function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer on map page and login page
  if (pathname === '/map' || pathname === '/login') {
    return null;
  }
  
  return <Footer />;
}