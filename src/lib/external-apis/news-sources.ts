/**
 * Real-Time News Sources Integration
 * Provides access to live news data from multiple sources
 */

import { openai } from '@/lib/openai';

interface NewsSource {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  rateLimits: {
    requestsPerHour: number;
    requestsPerDay: number;
  };
  categories: string[];
  regions: string[];
}

interface NewsArticle {
  id: string;
  source: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  publishedAt: Date;
  author?: string;
  category?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore?: number;
  tags: string[];
}

interface SearchQuery {
  query: string;
  category?: string;
  language?: string;
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
  from?: Date;
  to?: Date;
  domains?: string[];
  excludeDomains?: string[];
  sources?: string[];
  pageSize?: number;
  page?: number;
}

interface TrendData {
  keyword: string;
  interest: number; // 0-100
  region: string;
  timeframe: string;
  relatedQueries: string[];
  risingQueries: string[];
  category?: string;
}

class NewsAPIService {
  private apiKey: string;
  private baseUrl = 'https://newsapi.org/v2';
  
  constructor() {
    this.apiKey = process.env.NEWSAPI_KEY || '';
  }

  async searchNews(query: SearchQuery): Promise<NewsArticle[]> {
    if (!this.apiKey) {
      console.warn('NewsAPI key not configured, using mock data');
      return this.getMockNews(query);
    }

    try {
      const params = new URLSearchParams({
        q: query.query,
        apiKey: this.apiKey,
        language: query.language || 'en',
        sortBy: query.sortBy || 'publishedAt',
        pageSize: (query.pageSize || 20).toString(),
        page: (query.page || 1).toString()
      });

      if (query.from) params.append('from', query.from.toISOString());
      if (query.to) params.append('to', query.to.toISOString());
      if (query.domains) params.append('domains', query.domains.join(','));
      if (query.sources) params.append('sources', query.sources.join(','));

      const response = await fetch(`${this.baseUrl}/everything?${params}`);
      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.message);
      }

      return data.articles.map((article: any) => ({
        id: `newsapi_${article.url.split('/').pop() || Date.now()}`,
        source: article.source?.name || 'Unknown',
        title: article.title,
        description: article.description,
        content: article.content,
        url: article.url,
        publishedAt: new Date(article.publishedAt),
        author: article.author,
        tags: this.extractTags(article.title + ' ' + (article.description || ''))
      }));
    } catch (error) {
      console.error('NewsAPI search failed:', error);
      return this.getMockNews(query);
    }
  }

  async getTopHeadlines(category?: string, country?: string): Promise<NewsArticle[]> {
    if (!this.apiKey) {
      return this.getMockNews({ query: 'top headlines' });
    }

    try {
      const params = new URLSearchParams({
        apiKey: this.apiKey,
        country: country || 'us',
        pageSize: '20'
      });

      if (category) params.append('category', category);

      const response = await fetch(`${this.baseUrl}/top-headlines?${params}`);
      const data = await response.json();

      return data.articles.map((article: any) => ({
        id: `newsapi_${article.url.split('/').pop() || Date.now()}`,
        source: article.source?.name || 'Unknown',
        title: article.title,
        description: article.description,
        url: article.url,
        publishedAt: new Date(article.publishedAt),
        category: category,
        tags: this.extractTags(article.title + ' ' + (article.description || ''))
      }));
    } catch (error) {
      console.error('NewsAPI headlines failed:', error);
      return this.getMockNews({ query: 'headlines' });
    }
  }

  private extractTags(text: string): string[] {
    // Simple tag extraction - could be enhanced with NLP
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && word.length < 20);
    
    const frequency = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(frequency)
      .filter(word => frequency[word] > 1)
      .slice(0, 5);
  }

  private getMockNews(query: SearchQuery): NewsArticle[] {
    const mockArticles = [
      {
        id: 'mock_1',
        source: 'Tech News Daily',
        title: `AI Innovation in ${query.query} Reaches New Heights`,
        description: `Latest developments in ${query.query} show promising trends for businesses and consumers alike.`,
        url: 'https://example.com/ai-innovation',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        tags: ['ai', 'innovation', 'technology', 'business']
      },
      {
        id: 'mock_2',
        source: 'Industry Insider',
        title: `Market Analysis: ${query.query} Sector Shows Growth`,
        description: `Recent market data indicates significant growth opportunities in the ${query.query} industry.`,
        url: 'https://example.com/market-analysis',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        tags: ['market', 'growth', 'analysis', 'industry']
      }
    ];

    return mockArticles;
  }
}

class GoogleNewsService {
  private apiKey: string;
  private searchEngineId: string;
  private baseUrl = 'https://www.googleapis.com/customsearch/v1';

  constructor() {
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
  }

  async searchNews(query: SearchQuery): Promise<NewsArticle[]> {
    if (!this.apiKey || !this.searchEngineId) {
      console.warn('Google Search API not configured, using mock data');
      return this.getMockGoogleNews(query);
    }

    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        cx: this.searchEngineId,
        q: `${query.query} news`,
        num: (query.pageSize || 10).toString(),
        start: ((query.page || 1) - 1) * (query.pageSize || 10) + 1 + '',
        sort: query.sortBy === 'publishedAt' ? 'date' : 'relevance'
      });

      if (query.from) {
        const fromDate = query.from.toISOString().split('T')[0];
        params.append('dateRestrict', `d[${Math.ceil((Date.now() - query.from.getTime()) / (24 * 60 * 60 * 1000))}]`);
      }

      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return (data.items || []).map((item: any) => ({
        id: `google_${item.link.split('/').pop() || Date.now()}`,
        source: this.extractSource(item.displayLink),
        title: item.title,
        description: item.snippet,
        url: item.link,
        publishedAt: this.parsePublishDate(item.snippet),
        tags: this.extractTags(item.title + ' ' + item.snippet)
      }));
    } catch (error) {
      console.error('Google News search failed:', error);
      return this.getMockGoogleNews(query);
    }
  }

  private extractSource(displayLink: string): string {
    return displayLink.split('.')[0].replace(/^www\./, '');
  }

  private parsePublishDate(snippet: string): Date {
    // Try to extract date from snippet - simplified implementation
    const dateMatch = snippet.match(/\b(\d{1,2})\s+(hours?|days?|weeks?)\s+ago\b/i);
    if (dateMatch) {
      const amount = parseInt(dateMatch[1]);
      const unit = dateMatch[2].toLowerCase();
      const now = Date.now();
      
      if (unit.startsWith('hour')) {
        return new Date(now - amount * 60 * 60 * 1000);
      } else if (unit.startsWith('day')) {
        return new Date(now - amount * 24 * 60 * 60 * 1000);
      } else if (unit.startsWith('week')) {
        return new Date(now - amount * 7 * 24 * 60 * 60 * 1000);
      }
    }
    
    return new Date(); // Default to now
  }

  private extractTags(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    return [...new Set(words)].slice(0, 5);
  }

  private getMockGoogleNews(query: SearchQuery): NewsArticle[] {
    return [
      {
        id: 'google_mock_1',
        source: 'TechCrunch',
        title: `Breaking: ${query.query} Industry Sees Major Breakthrough`,
        description: `Industry experts are calling this the most significant development in ${query.query} this year.`,
        url: 'https://techcrunch.com/breakthrough',
        publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        tags: ['breakthrough', 'industry', 'technology']
      }
    ];
  }
}

class BingNewsService {
  private apiKey: string;
  private baseUrl = 'https://api.bing.microsoft.com/v7.0/news';

  constructor() {
    this.apiKey = process.env.BING_SEARCH_API_KEY || '';
  }

  async searchNews(query: SearchQuery): Promise<NewsArticle[]> {
    if (!this.apiKey) {
      console.warn('Bing News API not configured, using mock data');
      return this.getMockBingNews(query);
    }

    try {
      const params = new URLSearchParams({
        q: query.query,
        count: (query.pageSize || 20).toString(),
        offset: ((query.page || 1) - 1) * (query.pageSize || 20) + '',
        sortBy: query.sortBy || 'Date',
        mkt: 'en-US'
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey
        }
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return (data.value || []).map((article: any) => ({
        id: `bing_${article.url.split('/').pop() || Date.now()}`,
        source: article.provider?.[0]?.name || 'Unknown',
        title: article.name,
        description: article.description,
        url: article.url,
        publishedAt: new Date(article.datePublished),
        category: article.category,
        tags: this.extractTags(article.name + ' ' + article.description)
      }));
    } catch (error) {
      console.error('Bing News search failed:', error);
      return this.getMockBingNews(query);
    }
  }

  private extractTags(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    return [...new Set(words)].slice(0, 5);
  }

  private getMockBingNews(query: SearchQuery): NewsArticle[] {
    return [
      {
        id: 'bing_mock_1',
        source: 'Reuters',
        title: `${query.query} Market Trends Point to Significant Changes`,
        description: `Analysis of recent ${query.query} market data reveals emerging trends that could reshape the industry.`,
        url: 'https://reuters.com/market-trends',
        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        tags: ['market', 'trends', 'analysis']
      }
    ];
  }
}

class GoogleTrendsService {
  async getTrends(keywords: string[], region: string = 'US', timeframe: string = 'today 1-d'): Promise<TrendData[]> {
    // Note: Google Trends doesn't have an official API
    // This would typically use a third-party service or scraping solution
    // For now, we'll simulate trend data
    
    console.warn('Google Trends API not available, using simulated data');
    
    return keywords.map(keyword => ({
      keyword,
      interest: Math.floor(Math.random() * 100) + 1,
      region,
      timeframe,
      relatedQueries: [
        `${keyword} news`,
        `${keyword} trends`,
        `${keyword} 2025`,
        `best ${keyword}`,
        `${keyword} analysis`
      ],
      risingQueries: [
        `${keyword} breakthrough`,
        `${keyword} innovation`,
        `new ${keyword}`,
        `${keyword} update`
      ]
    }));
  }

  async getRelatedTopics(keyword: string): Promise<string[]> {
    // Simulate related topics
    const baseTopic = keyword.toLowerCase();
    return [
      `${baseTopic} innovation`,
      `${baseTopic} market`,
      `${baseTopic} technology`,
      `${baseTopic} future`,
      `${baseTopic} business`,
      `${baseTopic} industry`,
      `${baseTopic} trends`,
      `${baseTopic} analysis`
    ];
  }
}

// Centralized News Intelligence Service
export class NewsIntelligenceService {
  private newsAPI: NewsAPIService;
  private googleNews: GoogleNewsService;
  private bingNews: BingNewsService;
  private googleTrends: GoogleTrendsService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.newsAPI = new NewsAPIService();
    this.googleNews = new GoogleNewsService();
    this.bingNews = new BingNewsService();
    this.googleTrends = new GoogleTrendsService();
  }

  async searchAllSources(query: SearchQuery): Promise<NewsArticle[]> {
    const cacheKey = `search_${JSON.stringify(query)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const [newsAPIResults, googleResults, bingResults] = await Promise.allSettled([
        this.newsAPI.searchNews(query),
        this.googleNews.searchNews(query),
        this.bingNews.searchNews(query)
      ]);

      const allArticles: NewsArticle[] = [];
      
      if (newsAPIResults.status === 'fulfilled') {
        allArticles.push(...newsAPIResults.value);
      }
      if (googleResults.status === 'fulfilled') {
        allArticles.push(...googleResults.value);
      }
      if (bingResults.status === 'fulfilled') {
        allArticles.push(...bingResults.value);
      }

      // Remove duplicates and sort by relevance
      const uniqueArticles = this.deduplicateArticles(allArticles);
      const sortedArticles = await this.rankByRelevance(uniqueArticles, query.query);

      this.cache.set(cacheKey, { data: sortedArticles, timestamp: Date.now() });
      return sortedArticles;
    } catch (error) {
      console.error('News search failed:', error);
      return [];
    }
  }

  async getIndustryNews(industry: string, limit: number = 10): Promise<NewsArticle[]> {
    const queries = [
      `${industry} industry news`,
      `${industry} market trends`,
      `${industry} innovation`,
      `${industry} business news`
    ];

    const allResults = await Promise.all(
      queries.map(query => this.searchAllSources({ query, pageSize: 5 }))
    );

    const combined = allResults.flat();
    const unique = this.deduplicateArticles(combined);
    
    return unique.slice(0, limit);
  }

  async getTrendingTopics(region: string = 'US'): Promise<TrendData[]> {
    const cacheKey = `trends_${region}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Get trending keywords from news headlines
      const headlines = await this.newsAPI.getTopHeadlines();
      const keywords = this.extractTrendingKeywords(headlines);
      
      const trends = await this.googleTrends.getTrends(keywords, region);
      
      this.cache.set(cacheKey, { data: trends, timestamp: Date.now() });
      return trends;
    } catch (error) {
      console.error('Trends fetch failed:', error);
      return [];
    }
  }

  async analyzeNewsSentiment(articles: NewsArticle[]): Promise<NewsArticle[]> {
    // Use OpenAI to analyze sentiment
    try {
      const analysisPrompts = articles.map(article => 
        `Analyze the sentiment of this news: "${article.title}. ${article.description}"`
      );

      const responses = await Promise.all(
        analysisPrompts.map(async (prompt) => {
          try {
            const response = await openai.chat.completions.create({
              model: 'gpt-4',
              messages: [
                {
                  role: 'system',
                  content: 'Analyze the sentiment of the given news text. Respond with only: positive, negative, or neutral.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.1,
              max_tokens: 10
            });

            return response.choices[0].message.content?.toLowerCase().trim() as 'positive' | 'negative' | 'neutral';
          } catch (error) {
            return 'neutral';
          }
        })
      );

      return articles.map((article, index) => ({
        ...article,
        sentiment: responses[index] || 'neutral'
      }));
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return articles.map(article => ({ ...article, sentiment: 'neutral' as const }));
    }
  }

  private getCached(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      const key = article.title.toLowerCase().replace(/[^\w]/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async rankByRelevance(articles: NewsArticle[], query: string): Promise<NewsArticle[]> {
    // Simple relevance scoring - could be enhanced with ML
    return articles.map(article => {
      const titleScore = this.calculateRelevanceScore(article.title, query);
      const descScore = this.calculateRelevanceScore(article.description || '', query);
      const recencyScore = this.calculateRecencyScore(article.publishedAt);
      
      return {
        ...article,
        relevanceScore: (titleScore * 0.4 + descScore * 0.4 + recencyScore * 0.2)
      };
    }).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  private calculateRelevanceScore(text: string, query: string): number {
    const queryWords = query.toLowerCase().split(' ');
    const textWords = text.toLowerCase().split(' ');
    
    let matches = 0;
    queryWords.forEach(qWord => {
      if (textWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))) {
        matches++;
      }
    });

    return matches / queryWords.length;
  }

  private calculateRecencyScore(publishedAt: Date): number {
    const hoursSincePublished = (Date.now() - publishedAt.getTime()) / (60 * 60 * 1000);
    if (hoursSincePublished < 1) return 1.0;
    if (hoursSincePublished < 6) return 0.8;
    if (hoursSincePublished < 24) return 0.6;
    if (hoursSincePublished < 72) return 0.4;
    return 0.2;
  }

  private extractTrendingKeywords(articles: NewsArticle[]): string[] {
    const allText = articles.map(a => `${a.title} ${a.description || ''}`).join(' ');
    const words = allText.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && word.length < 15);

    const frequency = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(frequency)
      .sort((a, b) => frequency[b] - frequency[a])
      .slice(0, 20);
  }
}

// Export singleton instance
export const globalNewsIntelligence = new NewsIntelligenceService();

// Export types
export type { NewsArticle, SearchQuery, TrendData };