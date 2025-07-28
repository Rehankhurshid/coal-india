'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/admin/check');
      const data = await response.json();
      
      if (!response.ok || !data.isAdmin) {
        router.push('/');
        return;
      }
      
      setIsAdmin(data.isAdmin);
    } catch (error) {
      console.error('Admin check error:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
