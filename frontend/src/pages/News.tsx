import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import './News.css'

interface NewsArticle {
  title: string
  url: string
  time_published: string
  authors: string[]
  summary: string
  banner_image: string
  source: string
  category_within_source: string
  source_domain: string
  topics: Array<{
    topic: string
    relevance_score: string
  }>
  overall_sentiment_score: number
  overall_sentiment_label: string
}

function News() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'favorites' | 'market'>('all')
  const [isRealData, setIsRealData] = useState(false) // Track if we have real API data
  const [favoriteStocks, setFavoriteStocks] = useState<Array<{symbol: string, name: string}>>([])

  // Fetch user's favorite stocks
  useEffect(() => {
    fetchFavoriteStocks()
  }, [])

  // Auto-refresh on mount if no real data exists, otherwise load from cache
  useEffect(() => {
    // Try to load saved data from localStorage first
    const savedData = localStorage.getItem('news-data')
    const savedIsRealData = localStorage.getItem('news-is-real-data')
    
    if (savedData && savedIsRealData === 'true') {
      try {
        setArticles(JSON.parse(savedData))
        setIsRealData(true)
        setLoading(false)
        console.log('Loaded saved news data from localStorage')
      } catch (err) {
        console.error('Error loading saved news data:', err)
        // If cache is corrupted, auto-refresh
        fetchNews()
      }
    } else {
      // No real data exists, auto-refresh once
      console.log('No cached data found, auto-refreshing news...')
      fetchNews()
    }
  }, [])

  const fetchFavoriteStocks = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('http://localhost:5001/api/watchlist', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const favorites = data.watchlist
          .filter((item: any) => item.isFavorite)
          .map((item: any) => ({ symbol: item.symbol, name: item.name }))
        setFavoriteStocks(favorites)
        console.log(`Found ${favorites.length} favorite stocks for news`)
      }
    } catch (err) {
      console.error('Error fetching favorite stocks:', err)
    }
  }

  const fetchNews = async () => {
    setLoading(true)
    setError(null)

    try {
      const API_KEY = import.meta.env.VITE_NEWS_API_KEY
      
      if (!API_KEY) {
        console.warn('NewsAPI key not configured. Get a free key at https://newsapi.org/register')
        throw new Error('API key not configured')
      }
      
      // NewsAPI.org endpoint - 100 requests/day on free tier
      // Documentation: https://newsapi.org/docs
      // Optimized searches for favorite stocks and market news
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      const fromDate = threeDaysAgo.toISOString().split('T')[0]
      
      const searches = []
      
      // Add searches for each favorite stock (2-3 articles each)
      favoriteStocks.forEach(stock => {
        searches.push(
          `https://newsapi.org/v2/everything?q=(${stock.symbol} OR "${stock.name}")&language=en&sortBy=publishedAt&from=${fromDate}&pageSize=3&apiKey=${API_KEY}`
        )
      })
      
      // Add market news (2-3 articles)
      searches.push(
        `https://newsapi.org/v2/everything?q=("stock market" OR "market status" OR "market outlook")&language=en&sortBy=publishedAt&pageSize=3&apiKey=${API_KEY}`
      )
      
      console.log('Fetching news from multiple searches...')
      
      // Fetch from all searches and combine results
      const allArticles = []
      
      for (const url of searches) {
        try {
          console.log('Fetching:', url.split('?q=')[1].split('&')[0])
          const response = await fetch(url)
          const data = await response.json()
          
          if (data.status === 'ok' && data.articles) {
            allArticles.push(...data.articles)
          }
        } catch (err) {
          console.warn('Search failed:', err)
        }
      }
      
      // Remove duplicates based on URL
      const uniqueArticles = allArticles.filter((article, index, self) => 
        index === self.findIndex(a => a.url === article.url)
      )
      
      console.log(`Found ${uniqueArticles.length} unique articles from ${searches.length} searches`)
      
      if (uniqueArticles.length === 0) {
        throw new Error('No articles found in any search')
      }
      
      // Convert NewsAPI format to our format
      const formattedArticles: NewsArticle[] = uniqueArticles.map((article: any) => ({
        title: article.title || 'No title',
        url: article.url || '#',
        time_published: new Date(article.publishedAt).toISOString().replace(/[-:]/g, '').split('.')[0],
        authors: article.author ? [article.author] : [],
        summary: article.description || article.content || 'No description available',
        banner_image: article.urlToImage || '',
        source: article.source?.name || 'Unknown',
        category_within_source: 'Business',
        source_domain: article.url ? new URL(article.url).hostname : 'example.com',
        topics: [{ topic: 'business', relevance_score: '1.0' }],
        overall_sentiment_score: 0.5,
        overall_sentiment_label: 'Neutral'
      }))
      
      setArticles(formattedArticles)
      setIsRealData(true) // Mark that we have real data
      
      // Save the real data to localStorage so it persists across page navigation
      localStorage.setItem('news-data', JSON.stringify(formattedArticles))
      localStorage.setItem('news-is-real-data', 'true')
      
    } catch (err) {
      console.error('Error fetching news:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to load news data: ${errorMessage}`)
      // Only clear data if we don't already have real data
      if (!isRealData) {
        setArticles([])
      }
    } finally {
      setLoading(false)
    }
  }


  const getFilteredArticles = () => {
    if (filter === 'all') return articles

    return articles.filter(article => {
      const titleLower = article.title.toLowerCase()
      const summaryLower = article.summary.toLowerCase()
      const topicsText = article.topics.map(t => t.topic).join(' ').toLowerCase()

      switch (filter) {
        case 'favorites':
          // Check if article mentions any favorite stock
          return favoriteStocks.some(stock => 
            titleLower.includes(stock.symbol.toLowerCase()) || 
            titleLower.includes(stock.name.toLowerCase()) || 
            summaryLower.includes(stock.symbol.toLowerCase()) ||
            summaryLower.includes(stock.name.toLowerCase()) ||
            topicsText.includes(stock.symbol.toLowerCase())
          )
        case 'market':
          return titleLower.includes('market') || 
                 titleLower.includes('stock') || 
                 titleLower.includes('trading') ||
                 titleLower.includes('economy') ||
                 summaryLower.includes('market') ||
                 summaryLower.includes('stock') ||
                 summaryLower.includes('trading') ||
                 summaryLower.includes('economy') ||
                 topicsText.includes('market')
        default:
          return true
      }
    })
  }

  const formatTime = (timeString: string) => {
    try {
      // Alpha Vantage format: YYYYMMDDTHHMMSS
      const year = timeString.substring(0, 4)
      const month = timeString.substring(4, 6)
      const day = timeString.substring(6, 8)
      const hour = timeString.substring(9, 11)
      const minute = timeString.substring(11, 13)
      
      const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Recent'
    }
  }

  const getSentimentColor = (sentiment: string, score: number) => {
    if (sentiment === 'Very Bullish' || (sentiment === 'Bullish' && score > 0.7)) {
      return '#00ff00'
    } else if (sentiment === 'Bearish' || (sentiment === 'Very Bearish' && score < 0.3)) {
      return '#ff0000'
    }
    return '#888888'
  }

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'Very Bullish': return '🚀'
      case 'Bullish': return '📈'
      case 'Neutral': return '➡️'
      case 'Bearish': return '📉'
      case 'Very Bearish': return '📉'
      default: return '📊'
    }
  }

  const filteredArticles = getFilteredArticles()

  return (
    <div className="news">
      <Navbar />
      
      <div className="news-container">
        <div className="news-header">
          <div>
            <h1>Financial News</h1>
            <p className="news-subtitle">Latest market news and analysis</p>
          </div>
          <div className="news-controls">
            <div className="filter-controls">
              <button 
                onClick={() => setFilter('all')}
                className={`filter-button ${filter === 'all' ? 'active' : ''}`}
              >
                All News
              </button>
              <button 
                onClick={() => setFilter('favorites')}
                className={`filter-button ${filter === 'favorites' ? 'active' : ''}`}
              >
                My Favorites
              </button>
              <button 
                onClick={() => setFilter('market')}
                className={`filter-button ${filter === 'market' ? 'active' : ''}`}
              >
                Market News
              </button>
            </div>
            <button onClick={fetchNews} className="refresh-button" disabled={loading} title="Refresh news">
              <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>↻</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading news...</p>
          </div>
        ) : (
          <div className="news-grid">
            {filteredArticles.map((article, index) => (
              <a 
                key={index} 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="news-card-link"
              >
                <article className="news-card">
                  <div className="news-card-header">
                    <div className="news-source">
                      <span className="source-name">{article.source}</span>
                      <span className="news-time">{formatTime(article.time_published)}</span>
                    </div>
                    <div 
                      className="sentiment-badge"
                      style={{ color: getSentimentColor(article.overall_sentiment_label, article.overall_sentiment_score) }}
                    >
                      {getSentimentEmoji(article.overall_sentiment_label)} {article.overall_sentiment_label}
                    </div>
                  </div>
                  
                  <h3 className="news-title">
                    {article.title}
                  </h3>
                  
                  <p className="news-summary">
                    {article.summary}
                  </p>
                  
                  <div className="news-meta">
                    <div className="news-topics">
                      {article.topics.slice(0, 3).map((topic, idx) => (
                        <span key={idx} className="topic-tag">
                          {topic.topic}
                        </span>
                      ))}
                    </div>
                    {article.authors.length > 0 && (
                      <div className="news-authors">
                        By {article.authors.join(', ')}
                      </div>
                    )}
                  </div>
                  
                  <div className="read-more">
                    Read full article →
                  </div>
                </article>
              </a>
            ))}
          </div>
        )}

        {!loading && filteredArticles.length === 0 && (
          <div className="no-articles">
            <p>No news data available. Click "Refresh" to load current financial news.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default News

