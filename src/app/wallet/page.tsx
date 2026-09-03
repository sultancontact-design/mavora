'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import MavoraLogo from '@/components/common/MavoraLogo';
import WalletPageComponent from '@/components/wallet/WalletPage';
import { 
  Loader2, 
  Wallet as WalletIcon, 
  ArrowLeft,
  Plus,
  Minus,
  CreditCard,
  History,
  Gift
} from 'lucide-react';

interface WalletData {
  balance: number;
  currency: string;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  created_at: string;
  reference?: string;
}

export default function WalletRoute() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuthStore();
  
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Fetch wallet data
  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/wallet');
      if (res.ok) {
        const data = await res.json();
        setWalletData(data);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald" />
      </div>
    );
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  // Use the existing WalletPage component if available
  return <WalletPageComponent />;
}
