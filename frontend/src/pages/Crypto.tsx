import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './Crypto.css'

interface Crypto {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  changePercent24h: number
  marketCap: number
  volume24h: number
  image: string
}

function Crypto() {
  const navigate = useNavigate()
  const [cryptos, setCryptos] = useState<Crypto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'default' | 'gainers' | 'losers'>('default')
  const [isRealData, setIsRealData] = useState(false) // Track if we have real API data

  // Auto-refresh on mount if no real data exists, otherwise load from cache
  useEffect(() => {
    // Try to load saved data from localStorage first
    const savedData = localStorage.getItem('crypto-data')
    const savedIsRealData = localStorage.getItem('crypto-is-real-data')
    
    if (savedData && savedIsRealData === 'true') {
      try {
        setCryptos(JSON.parse(savedData))
        setIsRealData(true)
        setLoading(false)
        console.log('Loaded saved crypto data from localStorage')
      } catch (err) {
        console.error('Error loading saved crypto data:', err)
        // If cache is corrupted, auto-refresh
        fetchCryptoData()
      }
    } else {
      // No real data exists, auto-refresh once
      console.log('No cached data found, auto-refreshing crypto...')
      fetchCryptoData()
    }
  }, [])

  const fetchCryptoData = async () => {
    setLoading(true)
    setError(null)

    try {
      // CoinGecko API - Free tier, no API key required
      // Documentation: https://www.coingecko.com/en/api/documentation
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h'
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch crypto data')
      }

      const data = await response.json()
      
      const formattedCryptos: Crypto[] = data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price || 0,
        change24h: coin.price_change_24h || 0,
        changePercent24h: coin.price_change_percentage_24h || 0,
        marketCap: coin.market_cap || 0,
        volume24h: coin.total_volume || 0,
        image: coin.image,
      }))

      setCryptos(formattedCryptos)
      setIsRealData(true) // Mark that we have real data
      
      // Save the real data to localStorage so it persists across page navigation
      localStorage.setItem('crypto-data', JSON.stringify(formattedCryptos))
      localStorage.setItem('crypto-is-real-data', 'true')
      
    } catch (err) {
      console.error('Error fetching crypto data:', err)
      setError('Failed to load cryptocurrency data. Please try again later.')
      // Only clear data if we don't already have real data
      if (!isRealData) {
        setCryptos([])
      }
    } finally {
      setLoading(false)
    }
  }


  const handleRefresh = () => {
    fetchCryptoData()
  }

  const getSortedCryptos = () => {
    const cryptosCopy = [...cryptos]
    
    if (sortBy === 'gainers') {
      return cryptosCopy.sort((a, b) => b.changePercent24h - a.changePercent24h)
    } else if (sortBy === 'losers') {
      return cryptosCopy.sort((a, b) => a.changePercent24h - b.changePercent24h)
    }
    
    return cryptosCopy
  }

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    return `$${value.toFixed(0)}`
  }

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (price >= 0.01) return `$${price.toFixed(4)}`
    return `$${price.toFixed(8)}`
  }

  const sortedCryptos = getSortedCryptos()

  return (
    <div className="crypto">
      <Navbar />
      
      <div className="crypto-container">
        <div className="crypto-header">
          <div>
            <h1>Cryptocurrency</h1>
            <p className="crypto-subtitle">Track top cryptocurrencies by market cap</p>
          </div>
          <div className="crypto-controls">
            <div className="sort-controls">
              <button 
                onClick={() => setSortBy('default')}
                className={`sort-button ${sortBy === 'default' ? 'active' : ''}`}
              >
                Market Cap
              </button>
              <button 
                onClick={() => setSortBy('gainers')}
                className={`sort-button ${sortBy === 'gainers' ? 'active' : ''}`}
              >
                Top Gainers
              </button>
              <button 
                onClick={() => setSortBy('losers')}
                className={`sort-button ${sortBy === 'losers' ? 'active' : ''}`}
              >
                Top Losers
              </button>
            </div>
            <div className="view-toggle">
              <button 
                onClick={() => setViewMode('grid')}
                className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
                title="Grid view"
              >
                ⊞
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
                title="List view"
              >
                ☰
              </button>
            </div>
            <button onClick={handleRefresh} className="refresh-button" disabled={loading} title="Refresh crypto data">
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
            <p>Loading cryptocurrency data...</p>
          </div>
        ) : sortedCryptos.length > 0 ? (
          <div className={`crypto-${viewMode}`}>
            {sortedCryptos.map((crypto) => (
              <div key={crypto.id} className={`crypto-${viewMode}-item`}>
                <div className="crypto-item-header">
                  <div className="crypto-info">
                    {crypto.image && <img src={crypto.image} alt={crypto.name} className="crypto-icon" />}
                    <div>
                      <div className="crypto-symbol">{crypto.symbol}</div>
                      <div className="crypto-name">{crypto.name}</div>
                    </div>
                  </div>
                  <div className={`crypto-change ${crypto.change24h >= 0 ? 'positive' : 'negative'}`}>
                    {crypto.change24h >= 0 ? '+' : ''}{crypto.changePercent24h.toFixed(2)}%
                  </div>
                </div>
                <div className="crypto-stats">
                  <div className="crypto-price-container">
                    <div className="crypto-price">{formatPrice(crypto.price)}</div>
                    <div className={`crypto-change-value ${crypto.change24h >= 0 ? 'positive' : 'negative'}`}>
                      {crypto.change24h >= 0 ? '+' : ''}{formatPrice(Math.abs(crypto.change24h))}
                    </div>
                  </div>
                  <div className="crypto-market-info">
                    <div className="crypto-stat">
                      <span className="stat-label">Market Cap</span>
                      <span className="stat-value">{formatMarketCap(crypto.marketCap)}</span>
                    </div>
                    <div className="crypto-stat">
                      <span className="stat-label">Volume 24h</span>
                      <span className="stat-value">{formatMarketCap(crypto.volume24h)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">
            <p>No cryptocurrency data available. Click "Refresh" to load current crypto prices.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Crypto

