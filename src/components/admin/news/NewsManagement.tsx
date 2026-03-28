import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NewsForm } from './NewsForm';
import { NewsList } from './NewsList';
import { deleteStorageImage } from '@/utils/storageUtils';

export interface NewsItem {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    category: string;
    cover_image_url: string | null;
    published: boolean;
    is_pinned: boolean;
    published_at: string | null;
    sort_order: number;
    views: number;
    external_links: { title: string; url: string }[] | null;
    created_at: string;
    updated_at: string;
}

export const NewsManagement = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [categories, setCategories] = useState<string[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        fetchNews();
        fetchCategories();
    }, []);

    useEffect(() => {
        filterNews();
    }, [news, searchTerm, categoryFilter]);

    const fetchNews = async () => {
        try {
            const { data, error } = await supabase
                .from('news')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;
            setNews((data as any[]) || []);
        } catch (error: any) {
            toast({
                title: 'เกิดข้อผิดพลาด',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('news_categories' as any)
                .select('name')
                .order('name');

            if (error) throw error;
            setCategories(data?.map((c) => c.name) || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const filterNews = () => {
        let filtered = news;

        if (searchTerm) {
            filtered = filtered.filter(
                (item) =>
                    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (categoryFilter && categoryFilter !== 'all') {
            filtered = filtered.filter((item) => item.category === categoryFilter);
        }

        setFilteredNews(filtered);
    };

    const handleDelete = async (id: string) => {
        try {
            // Get news item to delete image from storage
            const newsItem = news.find(n => n.id === id);
            if (newsItem?.cover_image_url) {
                await deleteStorageImage(newsItem.cover_image_url);
            }

            const { error } = await supabase.from('news').delete().eq('id', id);

            if (error) throw error;

            toast({
                title: 'ลบสำเร็จ',
                description: 'ลบข่าวสารเรียบร้อยแล้ว',
            });

            fetchNews();
        } catch (error: any) {
            toast({
                title: 'เกิดข้อผิดพลาด',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleTogglePublish = async (item: NewsItem) => {
        try {
            const { error } = await supabase
                .from('news')
                .update({
                    published: !item.published,
                    published_at: !item.published ? new Date().toISOString() : item.published_at,
                })
                .eq('id', item.id);

            if (error) throw error;

            toast({
                title: 'อัปเดตสำเร็จ',
                description: !item.published ? 'เผยแพร่ข่าวสารแล้ว' : 'ยกเลิกการเผยแพร่แล้ว',
            });

            fetchNews();
        } catch (error: any) {
            toast({
                title: 'เกิดข้อผิดพลาด',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleReorder = async (reorderedItems: NewsItem[]) => {
        try {
            // Update sort_order for all items
            const updates = reorderedItems.map((item, index) => ({
                id: item.id,
                sort_order: index,
            }));

            for (const update of updates) {
                await supabase
                    .from('news')
                    .update({ sort_order: update.sort_order } as any)
                    .eq('id', update.id);
            }

            setNews(reorderedItems);
            toast({
                title: 'จัดเรียงสำเร็จ',
                description: 'บันทึกลำดับข่าวสารใหม่แล้ว',
            });
        } catch (error: any) {
            toast({
                title: 'เกิดข้อผิดพลาด',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingNews(null);
        fetchNews();
    };

    if (showForm) {
        return (
            <NewsForm
                news={editingNews}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                    setShowForm(false);
                    setEditingNews(null);
                }}
            />
        );
    }

    return (
        <div className="p-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">จัดการข่าวสาร</CardTitle>
                            <CardDescription>เพิ่ม แก้ไข และจัดการข่าวประชาสัมพันธ์ของโรงเรียน</CardDescription>
                        </div>
                        <Button onClick={() => setShowForm(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่มข่าวใหม่
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="ค้นหาข่าวสาร..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="หมวดหมู่" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทั้งหมด</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        {category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* News List */}
                    {isLoading ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">กำลังโหลด...</p>
                        </div>
                    ) : filteredNews.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">ไม่พบข่าวสาร</p>
                        </div>
                    ) : (
                        <NewsList
                            items={filteredNews}
                            onEdit={(item) => {
                                setEditingNews(item);
                                setShowForm(true);
                            }}
                            onDelete={handleDelete}
                            onTogglePublish={handleTogglePublish}
                            onReorder={handleReorder}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
