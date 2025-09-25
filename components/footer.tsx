import LogoIcon from '@/assets/Icons/LogoIcon';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <LogoIcon/>
            </div>
            <p className="text-gray-600 text-sm">
              Your trusted guide to finding the best dental care. Connecting patients
              with quality dental practices across the world.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick links</h3>
            <div className="space-y-2">
              <Link href="/" className="block text-gray-600 hover:text-blue-600 text-sm transition-colors">
                Home
              </Link>
              <Link href="/map" className="block text-gray-600 hover:text-blue-600 text-sm transition-colors">
                Find a Dentist
              </Link>
              <Link href="/blog" className="block text-gray-600 hover:text-blue-600 text-sm transition-colors">
                Blog
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">For dental practices</h3>
            <div className="space-y-2">
              <Link href="/providers" className="block text-gray-600 hover:text-blue-600 text-sm transition-colors">
                Join our network
              </Link>
              <Link href="/providers" className="block text-gray-600 hover:text-blue-600 text-sm transition-colors">
                Premium benefits
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
            <div className="space-y-2">
              <Link href="/contact" className="block text-gray-600 hover:text-blue-600 text-sm transition-colors">
                Contact us
              </Link>
              <Link href="/help" className="block text-gray-600 hover:text-blue-600 text-sm transition-colors">
                Help center
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-gray-600 text-sm">
          <p>&copy; 2025 DentiStar Guide. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}