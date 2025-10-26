import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import StockChart from '../components/StockChart'
import './StockDetail.css'

interface StockQuote {
  currentPrice: number
  change: number
  changePercent: number
  high: number
  low: number
  open: number
  previousClose: number
}

interface StockProfile {
  name: string
  ticker: string
  marketCap: number
  shareOutstanding: number
  ipo: string
  finnhubIndustry: string
  logo: string
  weburl: string
}

interface NewsArticle {
  category: string
  datetime: number
  headline: string
  id: number
  image: string
  related: string
  source: string
  summary: string
  url: string
}

function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>()
  const navigate = useNavigate()
  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [profile, setProfile] = useState<StockProfile | null>(null)
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (symbol) {
      fetchStockData()
    }
  }, [symbol])

  const fetchStockData = async () => {
    setLoading(true)
    setError(null)

    try {
      const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY

      if (!API_KEY) {
        throw new Error('API key not configured')
      }

      // Fetch only quote and profile - skip news to save API calls
      // Fetch sequentially with delays to avoid rate limiting
      const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`)
      const quoteData = await quoteRes.json()

      if (quoteData.c) {
        setQuote({
          currentPrice: quoteData.c,
          change: quoteData.d,
          changePercent: quoteData.dp,
          high: quoteData.h,
          low: quoteData.l,
          open: quoteData.o,
          previousClose: quoteData.pc,
        })
      }

      // Add delay before next request
      await new Promise(resolve => setTimeout(resolve, 1000))

      const profileRes = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${API_KEY}`)
      const profileData = await profileRes.json()

      if (profileData.ticker) {
        setProfile(profileData)
      }

      // Skip news fetching to conserve API calls
      // Users can check the News page for articles

    } catch (err) {
      console.error('Error fetching stock data:', err)
      setError('Failed to load stock data')
    } finally {
      setLoading(false)
    }
  }

  const getDateToday = () => {
    return new Date().toISOString().split('T')[0]
  }

  const getDateDaysAgo = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString().split('T')[0]
  }

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    return `$${value.toFixed(0)}`
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="stock-detail">
        <Navbar />
        <div className="stock-detail-container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading stock data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !quote || !symbol) {
    return (
      <div className="stock-detail">
        <Navbar />
        <div className="stock-detail-container">
          <div className="error-state">
            <p>{error || 'Stock not found'}</p>
            <button onClick={() => navigate(-1)} className="back-button">
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isPositive = quote.change >= 0

  return (
    <div className="stock-detail">
      <Navbar />
      
      <div className="stock-detail-container">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>

        {/* Header with price and company info */}
        <div className="stock-header">
          <div className="stock-header-left">
            {profile?.logo && (
              <img src={profile.logo} alt={profile.name} className="company-logo" />
            )}
            <div className="stock-header-info">
              <h1>{profile?.name || symbol}</h1>
              <div className="stock-meta">
                <span className="stock-ticker">{symbol}</span>
                {profile?.finnhubIndustry && (
                  <>
                    <span className="separator">•</span>
                    <span className="stock-industry">{profile.finnhubIndustry}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="stock-header-right">
            <div className="stock-price">${quote.currentPrice.toFixed(2)}</div>
            <div className={`stock-change ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* Chart */}
        <StockChart symbol={symbol} currentPrice={quote.currentPrice} />

        {/* Key Metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Previous Close</div>
            <div className="metric-value">${quote.previousClose.toFixed(2)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Day's Open</div>
            <div className="metric-value">${quote.open.toFixed(2)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Day's High</div>
            <div className="metric-value">${quote.high.toFixed(2)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Day's Low</div>
            <div className="metric-value">${quote.low.toFixed(2)}</div>
          </div>
          {profile?.marketCap && (
            <div className="metric-card">
              <div className="metric-label">Market Cap</div>
              <div className="metric-value">{formatMarketCap(profile.marketCap)}</div>
            </div>
          )}
          {profile?.shareOutstanding && (
            <div className="metric-card">
              <div className="metric-label">Shares Outstanding</div>
              <div className="metric-value">{(profile.shareOutstanding / 1e6).toFixed(2)}M</div>
            </div>
          )}
        </div>

        {/* Company Info */}
        {profile && (
          <div className="company-info">
            <h2>Company Information</h2>
            <div className="info-grid">
              {profile.ipo && (
                <div className="info-item">
                  <span className="info-label">IPO Date:</span>
                  <span className="info-value">{profile.ipo}</span>
                </div>
              )}
              {profile.weburl && (
                <div className="info-item">
                  <span className="info-label">Website:</span>
                  <a href={profile.weburl} target="_blank" rel="noopener noreferrer" className="info-link">
                    {profile.weburl}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* News removed to conserve API calls - check the News page instead */}
      </div>
    </div>
  )
}

export default StockDetail

