import { useState, useEffect } from 'react';
import { Calendar, ArrowRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface NewsItem {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  views: number;
  featured: boolean;
  cover_image_url?: string;
}

const categoryColors: Record<string, string> = {
  'ข่าวประชาสัมพันธ์': 'bg-accent text-accent-foreground',
  'กิจกรรม': 'bg-green-500 text-card',
  'ผลงานนักเรียน': 'bg-blue-500 text-card',
  'ประกาศ': 'bg-red-500 text-card',
};

const NewsSection = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('published', true)
        .order('is_pinned', { ascending: false })
        .order('sort_order', { ascending: true })
        .limit(4);

      if (error) throw error;

      const formattedNews: NewsItem[] = (data || []).map((item, index) => ({
        id: item.id,
        category: item.category,
        title: item.title,
        excerpt: item.excerpt || '',
        date: item.published_at
          ? format(new Date(item.published_at), 'dd MMM yyyy', { locale: th })
          : format(new Date(item.created_at), 'dd MMM yyyy', { locale: th }),
        views: item.views || 0,
        featured: index === 0 && item.is_pinned, // First pinned news is featured
        cover_image_url: item.cover_image_url || undefined,
      }));

      setNewsItems(formattedNews);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section id="news" className="section-padding bg-background">
        <div className="container-school">
          <div className="text-center py-12">
            <p className="text-muted-foreground">กำลังโหลด...</p>
          </div>
        </div>
      </section>
    );
  }

  const featuredNews = newsItems.find((item) => item.featured);
  const otherNews = newsItems.filter((item) => !item.featured);

  return (
    <section id="news" className="section-padding bg-background">
      <div className="container-school">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <span className="inline-block text-accent font-semibold mb-4">ข่าวสารและกิจกรรม</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              <span className="text-primary">ข่าวสาร</span>ล่าสุด
            </h2>
          </div>
          <Button
            variant="outline"
            className="self-start md:self-auto gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => navigate('/news')}
          >
            ดูทั้งหมด
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {newsItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">ไม่มีข่าวสารในขณะนี้</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Featured News */}
            {featuredNews && (
              <div
                className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-border cursor-pointer"
                onClick={() => navigate(`/news?id=${featuredNews.id}`)}
              >
                {featuredNews.cover_image_url ? (
                  <div className="h-64 overflow-hidden">
                    <img
                      src={featuredNews.cover_image_url}
                      alt={featuredNews.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-64 bg-gradient-to-br from-primary to-navy-light relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/10 transition-colors" />
                    <div className="absolute bottom-4 left-4">
                      <Badge className={categoryColors[featuredNews.category] || 'bg-secondary'}>
                        {featuredNews.category}
                      </Badge>
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {featuredNews.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {featuredNews.views.toLocaleString()} ครั้ง
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {featuredNews.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                    {featuredNews.excerpt}
                  </p>
                  <Button
                    variant="ghost"
                    className="text-primary hover:text-primary hover:bg-primary/10 p-0 h-auto font-semibold"
                  >
                    อ่านเพิ่มเติม →
                  </Button>
                </div>
              </div>
            )}

            {/* Other News */}
            <div className="space-y-4">
              {otherNews.map((news) => (
                <div
                  key={news.id}
                  className="group bg-card rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-border flex gap-5 cursor-pointer"
                  onClick={() => navigate(`/news?id=${news.id}`)}
                >
                  {news.cover_image_url ? (
                    <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden">
                      <img
                        src={news.cover_image_url}
                        alt={news.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-navy-light/20 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={categoryColors[news.category] || 'bg-secondary'} variant="secondary">
                        {news.category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{news.date}</span>
                    </div>
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
                      {news.title}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{news.excerpt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default NewsSection;
