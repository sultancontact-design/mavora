'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ListingDetail from '@/components/listing/ListingDetail';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Back Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            <span>العودة للإعلانات</span>
          </Link>
        </div>
      </div>
      
      {/* Listing Detail Component */}
      <ListingDetail listingId={listingId} />
    </div>
  );
}
