// app/admin/contents/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Folder } from 'lucide-react';
import { toast } from 'sonner';
import { CourseBuilder } from '@/components/admin/CourseBuilder';

// Update the Portal type to match your database schema
type Portal = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string | null;
  title?: string;  // Make these optional to match your actual data
  description?: string | null;
  order_index?: number;
  image_url?: string | null;
  duration_seconds?: number | null;
};

export default function ContentsPage() {
  const [portals, setPortals] = useState<Portal[]>([]);
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchPortals = async () => {
      try {
        // Fetch from 'portals' table
        const { data, error } = await supabase
          .from('portals')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Map the data to match our Portal type
        const portalData: Portal[] = (data || []).map((item: any) => ({
          id: item.id,
          name: item.name || item.title || 'Untitled',
          created_at: item.created_at,
          updated_at: item.updated_at,
          title: item.title,
          description: item.description,
          order_index: item.order_index,
          image_url: item.image_url,
          duration_seconds: item.duration_seconds
        }));

        setPortals(portalData);
      } catch (error) {
        console.error('Error fetching portals:', error);
        toast.error('Falha ao carregar os portais');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortals();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedPortal) {
    return <CourseBuilder portalId={selectedPortal.id} onBack={() => setSelectedPortal(null)} />;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gerenciar Conteúdos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {portals.map((portal) => (
          <div
            key={portal.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center"
            onClick={() => setSelectedPortal(portal)}
          >
            <Folder className="h-6 w-6 text-primary mr-3" />
            <div>
              <h3 className="font-medium">{portal.name || portal.title || 'Sem Título'}</h3>
              <p className="text-sm text-gray-500">
                Criado em {new Date(portal.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}