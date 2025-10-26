import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './Dashboard.css'

interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

function Dashboard() {
  const navigate = useNavigate()
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRealData, setIsRealData] = useState(false) // Track if we have real API data

  // Major market indexes and ETFs
  const popularStocks = [
    { symbol: 'SPY', name: 'S&P 500 ETF' },
    { symbol: 'QQQ', name: 'NASDAQ-100 ETF' },
    { symbol: 'DIA', name: 'Dow Jones ETF' },
    { symbol: 'IWM', name: 'Russell 2000 ETF' },
    { symbol: 'VTI', name: 'Total Stock Market ETF' },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF' },
    { symbol: 'VGT', name: 'Technology Sector ETF' },
    { symbol: 'GLD', name: 'Gold ETF' },
  ]

  // Auto-refresh on mount if no real data exists, otherwise load from cache
  useEffect(() => {
    // Try to load saved data from localStorage first
    const savedData = localStorage.getItem('dashboard-data')
    const savedIsRealData = localStorage.getItem('dashboard-is-real-data')
    
    if (savedData && savedIsRealData === 'true') {
      try {
        setStocks(JSON.parse(savedData))
        setIsRealData(true)
        setLoading(false)
        console.log('Loaded saved dashboard data from localStorage')
      } catch (err) {
        console.error('Error loading saved data:', err)
        // If cache is corrupted, auto-refresh
        fetchStockData()
      }
    } else {
      // No real data exists, auto-refresh once
      console.log('No cached data found, auto-refreshing dashboard...')
      fetchStockData()
    }
  }, [])

  const fetchStockData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Using Finnhub API - Free tier: 60 calls/minute
      // Sign up at https://finnhub.io/ for a free key
      const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY
      
      if (!API_KEY) {
        console.warn('Finnhub API key not configured. Get one at https://finnhub.io/')
        throw new Error('API key not configured')
      }

      console.log(`Fetching ${popularStocks.length} ETF prices from Finnhub...`)
      
      // Fetch each stock individually (Finnhub doesn't have batch endpoint)
      const stockPromises = popularStocks.map(async (stock) => {
        try {
          const response = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${API_KEY}`
          )
          const data = await response.json()
          
          if (data.c && data.pc) {
            const currentPrice = data.c
            const previousClose = data.pc
            const change = currentPrice - previousClose
            const changePercent = data.dp || ((change / previousClose) * 100)
            
            return {
              symbol: stock.symbol,
              name: stock.name,
              price: parseFloat(currentPrice.toFixed(2)),
              change: parseFloat(change.toFixed(2)),
              changePercent: parseFloat(changePercent.toFixed(2)),
            }
          }
          
          // Return null if API fails for this symbol (will be filtered out)
          return null
        } catch (err) {
          console.error(`Error fetching ${stock.symbol}:`, err)
          return null
        }
      })

      const results = (await Promise.all(stockPromises)).filter(stock => stock !== null)
      setStocks(results)
      setIsRealData(true) // Mark that we have real data
      
      // Save the real data to localStorage so it persists across page navigation
      localStorage.setItem('dashboard-data', JSON.stringify(results))
      localStorage.setItem('dashboard-is-real-data', 'true')
      
      console.log(`Successfully loaded ${results.length} ETFs`)
    } catch (err) {
      console.error('Error fetching stock data:', err)
      setError('Failed to load stock data.')
      // Only clear data if we don't already have real data
      if (!isRealData) {
        setStocks([])
      }
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="dashboard">
      <Navbar />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Market Overview</h1>
            <p className="dashboard-subtitle">Track major indexes and ETFs in real-time</p>
          </div>
          <button onClick={fetchStockData} className="refresh-button" disabled={loading} title="Refresh data">
            <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>↻</span>
          </button>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading market data...</p>
          </div>
        ) : stocks.length > 0 ? (
          <div className="stocks-grid">
            {stocks.map((stock) => (
              <div 
                key={stock.symbol} 
                className="stock-card clickable"
                onClick={() => navigate(`/stock/${stock.symbol}`)}
              >
                <div className="stock-header">
                  <div className="stock-symbol">{stock.symbol}</div>
                  <div className={`stock-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </div>
                </div>
                <div className="stock-name">{stock.name}</div>
                <div className="stock-price-container">
                  <div className="stock-price">${stock.price.toFixed(2)}</div>
                  <div className={`stock-change-value ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">
            <p>No market data available. Click "Refresh Data" to load current prices.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard

