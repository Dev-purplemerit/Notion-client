'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Folder, MoreVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CollectionPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for recent drafts
  const recentDrafts = [
    { id: 1, name: 'file name', size: '4mb', date: '29/5/2025' },
    { id: 2, name: 'file name', size: '4mb', date: '29/5/2025' },
    { id: 3, name: 'file name', size: '4mb', date: '29/5/2025' },
    { id: 4, name: 'file name', size: '4mb', date: '29/5/2025' },
    { id: 5, name: 'file name', size: '4mb', date: '29/5/2025' },
  ];

  // Mock data for saved collections
  const savedCollections = [
    { id: 1, name: 'collection name', size: '4mb', date: '29/5/2025', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400' },
    { id: 2, name: 'collection name', size: '4mb', date: '29/5/2025', image: 'https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?w=400' },
    { id: 3, name: 'collection name', size: '4mb', date: '29/5/2025', image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400' },
    { id: 4, name: 'collection name', size: '4mb', date: '29/5/2025', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400' },
    { id: 5, name: 'collection name', size: '4mb', date: '29/5/2025', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400' },
    { id: 6, name: 'collection name', size: '4mb', date: '29/5/2025', image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400' },
    { id: 7, name: 'collection name', size: '4mb', date: '29/5/2025', image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400' },
    { id: 8, name: 'collection name', size: '4mb', date: '29/5/2025', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
  ];

  return (
    <AppLayout>
      <div className="flex-1 bg-white p-8 overflow-y-auto">
        {/* Row 1: Collections Title and Search Bar */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center" style={{ gap: '64px' }}>
            <h1 className="text-3xl font-bold text-gray-800">Collections</h1>
            <div className="relative" style={{ width: '528px', height: '40px', flexShrink: 0 }}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12"
                style={{
                  width: '528px',
                  height: '40px',
                  borderRadius: '24px',
                  border: '1px solid #E6E6E6',
                  background: '#FFF',
                  boxShadow: '0 4px 4px 0 rgba(221, 221, 221, 0.25)'
                }}
              />
            </div>
          </div>
        </header>

        {/* Row 2: Recent Drafts */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Drafts</h2>
          <div className="flex gap-4 overflow-x-auto">
            {/* Create New Card */}
            <Card 
              className="border-2 border-dashed border-gray-300 bg-white hover:border-gray-400 transition-colors cursor-pointer"
              style={{
                width: '160px',
                height: '200px',
                borderRadius: '16px',
                flexShrink: 0
              }}
              onClick={() => router.push('/collection/editor')}
            >
              <CardContent className="flex flex-col items-center justify-center h-full p-4">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center mb-3">
                  <Plus className="h-6 w-6 text-gray-400" />
                </div>
                <span className="text-sm text-gray-500 font-medium">Create New</span>
              </CardContent>
            </Card>

            {/* Recent Draft Cards */}
            {recentDrafts.map((draft) => (
              <Card 
                key={draft.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                style={{
                  width: '160px',
                  height: '200px',
                  borderRadius: '16px',
                  border: '1px solid #E8E8E8',
                  background: 'rgba(135, 135, 135, 0.06)',
                  flexShrink: 0
                }}
              >
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-4">
                    <Folder className="h-8 w-8 text-gray-600" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                      <MoreVertical className="h-4 w-4 text-gray-600" />
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 mb-2">{draft.name}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{draft.size}</span>
                      <span>{draft.date}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Row 4: Saved Collections */}
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Saved Collections</h2>
          <div
            className="grid gap-[40px]"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(224px, 1fr))'
            }}
          >
            {savedCollections.map((collection) => (
              <Card 
                key={collection.id} 
                className="border-gray-200 hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                style={{
                  width: '224px',
                  height: '240px',
                  borderRadius: '16px',
                  flexShrink: 0
                }}
              >
                <div 
                  className="relative h-40"
                  style={{
                    backgroundImage: `url(${collection.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: '50%',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#D9D9D9'
                  }}
                >
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-white">
                    <MoreVertical className="h-4 w-4 text-gray-700" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-gray-800 mb-2">{collection.name}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{collection.size}</span>
                    <span>{collection.date}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
