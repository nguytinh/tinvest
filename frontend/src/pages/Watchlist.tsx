import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import BallView from '../components/BallView'
import './Watchlist.css'

interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  isFavorite?: boolean
}

function Watchlist() {
  const navigate = useNavigate()
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'ball'>('grid')
  const [sortBy, setSortBy] = useState<'default' | 'gainers' | 'losers'>('default')
  const [isRealData, setIsRealData] = useState(false) // Track if we have real API data
  const [watchlistStocks, setWatchlistStocks] = useState<Array<{symbol: string, name: string, isFavorite?: boolean}>>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [showAddStock, setShowAddStock] = useState(false)
  const [newStockSymbol, setNewStockSymbol] = useState('')
  const [newStockName, setNewStockName] = useState('')
  const [addingStock, setAddingStock] = useState(false)

  // Get user ID from token
  const getUserIdFromToken = () => {
    const token = localStorage.getItem('token')
    if (!token) return null
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.userId?.toString() || null
    } catch {
      return null
    }
  }

  // Fetch user's watchlist from API
  useEffect(() => {
    const id = getUserIdFromToken()
    setUserId(id)
    fetchUserWatchlist()
  }, [])

  const fetchUserWatchlist = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.warn('No auth token found')
        setWatchlistStocks([])
        return
      }

      const response = await fetch('http://localhost:5001/api/watchlist', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setWatchlistStocks(data.watchlist.map((item: any) => ({
          symbol: item.symbol,
          name: item.name,
          isFavorite: item.isFavorite,
        })))
        console.log(`Loaded ${data.watchlist.length} stocks from user's watchlist`)
      } else {
        console.error('Failed to fetch watchlist')
        setWatchlistStocks([])
      }
    } catch (err) {
      console.error('Error fetching watchlist:', err)
      setWatchlistStocks([])
    }
  }

  // Auto-refresh on mount if no real data exists, otherwise load from cache
  useEffect(() => {
    if (!userId) {
      setStocks([])
      setIsRealData(false)
      setLoading(false)
      return
    }

    // Try to load saved data from localStorage with user-specific key
    const savedData = localStorage.getItem(`watchlist-data-${userId}`)
    const savedIsRealData = localStorage.getItem(`watchlist-is-real-data-${userId}`)
    
    if (savedData && savedIsRealData === 'true') {
      try {
        setStocks(JSON.parse(savedData))
        setIsRealData(true)
        setLoading(false)
        console.log(`Loaded saved watchlist data for user ${userId}`)
      } catch (err) {
        console.error('Error loading saved data:', err)
        // If cache is corrupted, auto-refresh
        fetchStockData()
      }
    } else {
      // No real data exists, auto-refresh once
      console.log(`No cached data found for user ${userId}, auto-refreshing watchlist...`)
      fetchStockData()
    }
  }, [userId])

  const addStockToWatchlist = async (symbol: string, name: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      setAddingStock(true)

      const response = await fetch('http://localhost:5001/api/watchlist/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ symbol, name }),
      })

      if (response.ok) {
        // Refresh the watchlist stocks list
        await fetchUserWatchlist()
        
        // Fetch only the new stock's data
        await fetchSingleStockData(symbol, name)
        
        setShowAddStock(false)
        setNewStockSymbol('')
        setNewStockName('')
        console.log(`Added ${symbol} to watchlist`)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to add stock')
      }
    } catch (err) {
      console.error('Error adding stock:', err)
      setError('Failed to add stock to watchlist')
    } finally {
      setAddingStock(false)
    }
  }

  const fetchSingleStockData = async (symbol: string, name: string) => {
    try {
      const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY
      
      if (!API_KEY) {
        console.warn('Finnhub API key not configured')
        return
      }

      console.log(`Fetching data for ${symbol}...`)
      
      const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`)
      const data = await response.json()

      if (data.c && data.c !== 0) {
        const newStock: Stock = {
          symbol,
          name,
          price: data.c,
          change: data.d,
          changePercent: data.dp,
          isFavorite: false,
        }

        // Add the new stock to the existing stocks array
        setStocks(prevStocks => [...prevStocks, newStock])
        setIsRealData(true)

        // Update cache with the new stock added
        if (userId) {
          const updatedStocks = [...stocks, newStock]
          localStorage.setItem(`watchlist-data-${userId}`, JSON.stringify(updatedStocks))
          localStorage.setItem(`watchlist-is-real-data-${userId}`, 'true')
        }

        console.log(`Successfully fetched data for ${symbol}`)
      } else {
        console.warn(`No valid data returned for ${symbol}`)
      }
    } catch (err) {
      console.error(`Error fetching data for ${symbol}:`, err)
    }
  }

  const toggleFavorite = async (symbol: string, currentFavorite: boolean) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`http://localhost:5001/api/watchlist/favorite/${symbol}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isFavorite: !currentFavorite }),
      })

      if (response.ok) {
        // Update local state
        setWatchlistStocks(prev => prev.map(stock => 
          stock.symbol === symbol ? { ...stock, isFavorite: !currentFavorite } : stock
        ))
        console.log(`${symbol} ${!currentFavorite ? 'favorited' : 'unfavorited'}`)
      } else {
        console.error('Failed to toggle favorite')
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
    }
  }

  const fetchStockData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Using Finnhub API - Free tier: 60 calls/minute
      const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY
      
      if (!API_KEY) {
        console.warn('Finnhub API key not configured. Get one at https://finnhub.io/')
        throw new Error('API key not configured')
      }
      
      // Fetch all 28 stocks from the watchlist
      console.log(`Fetching all ${watchlistStocks.length} stocks from Finnhub...`)
      
      // Fetch all stocks in parallel
      console.log(`Fetching all ${watchlistStocks.length} stocks from Finnhub...`)
      
      const fetchPromises = watchlistStocks.map(async (stock) => {
        try {
          const response = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${API_KEY}`
          )
          
          if (!response.ok) {
            if (response.status === 429) {
              console.warn(`Rate limit hit for ${stock.symbol}`)
            }
            return null
          }

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
          return null
        } catch (err) {
          console.error(`Error fetching ${stock.symbol}:`, err)
          return null
        }
      })
      
      const results = (await Promise.all(fetchPromises)).filter((stock): stock is Stock => stock !== null)
      
      // Use all successfully fetched stocks
      const allResults = results
      
      setStocks(allResults)
      setIsRealData(true) // Mark that we have real data
      
      // Save the real data to localStorage so it persists across page navigation (user-specific)
      if (userId) {
        localStorage.setItem(`watchlist-data-${userId}`, JSON.stringify(allResults))
        localStorage.setItem(`watchlist-is-real-data-${userId}`, 'true')
      }
      
      console.log(`Successfully loaded ${results.length} out of ${watchlistStocks.length} stocks`)
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


  const handleRefresh = () => {
    fetchStockData()
  }

  const getSortedStocks = () => {
    const stocksCopy = [...stocks]
    
    // First, sort by favorites (favorites first)
    stocksCopy.sort((a, b) => {
      const aIsFavorite = watchlistStocks.find(w => w.symbol === a.symbol)?.isFavorite || false
      const bIsFavorite = watchlistStocks.find(w => w.symbol === b.symbol)?.isFavorite || false
      
      if (aIsFavorite && !bIsFavorite) return -1
      if (!aIsFavorite && bIsFavorite) return 1
      return 0
    })
    
    // Then apply additional sorting within each group (favorites and non-favorites)
    if (sortBy === 'gainers') {
      stocksCopy.sort((a, b) => {
        const aIsFavorite = watchlistStocks.find(w => w.symbol === a.symbol)?.isFavorite || false
        const bIsFavorite = watchlistStocks.find(w => w.symbol === b.symbol)?.isFavorite || false
        
        // If one is favorite and other isn't, maintain favorite order
        if (aIsFavorite && !bIsFavorite) return -1
        if (!aIsFavorite && bIsFavorite) return 1
        
        // Otherwise sort by percentage change
        return b.changePercent - a.changePercent
      })
    } else if (sortBy === 'losers') {
      stocksCopy.sort((a, b) => {
        const aIsFavorite = watchlistStocks.find(w => w.symbol === a.symbol)?.isFavorite || false
        const bIsFavorite = watchlistStocks.find(w => w.symbol === b.symbol)?.isFavorite || false
        
        // If one is favorite and other isn't, maintain favorite order
        if (aIsFavorite && !bIsFavorite) return -1
        if (!aIsFavorite && bIsFavorite) return 1
        
        // Otherwise sort by percentage change
        return a.changePercent - b.changePercent
      })
    }
    
    return stocksCopy
  }

  const sortedStocks = getSortedStocks()

  return (
    <div className="watchlist">
      <Navbar />
      
      <div className="watchlist-container">
        <div className="watchlist-header">
          <div>
            <h1>My Watchlist</h1>
            <p className="watchlist-subtitle">Track your favorite stocks in real-time</p>
          </div>
          <div className="watchlist-controls">
            <div className="sort-controls">
              <button 
                onClick={() => setSortBy('default')}
                className={`sort-button ${sortBy === 'default' ? 'active' : ''}`}
              >
                Default
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
            
            <div className="action-controls">
              <button 
                onClick={() => setShowAddStock(true)}
                className="add-stock-button"
              >
                + Add Stock
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
              <button 
                onClick={() => setViewMode('ball')}
                className={`view-button ${viewMode === 'ball' ? 'active' : ''}`}
                title="Ball view"
              >
                ●
              </button>
            </div>
            <button onClick={handleRefresh} className="refresh-button" disabled={loading} title="Refresh watchlist">
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
            <p>Loading watchlist...</p>
          </div>
        ) : sortedStocks.length > 0 ? (
          viewMode === 'ball' ? (
            <BallView stocks={sortedStocks} />
          ) : (
          <div className={`watchlist-${viewMode}`}>
            {sortedStocks.map((stock) => (
              <div 
                key={stock.symbol} 
                className={`watchlist-${viewMode}-item clickable`}
                onClick={() => navigate(`/stock/${stock.symbol}`)}
              >
                <div className="watchlist-item-header">
                  <div className="stock-symbol">{stock.symbol}</div>
                  <div className="stock-actions">
                    <button
                      className={`favorite-button ${watchlistStocks.find(w => w.symbol === stock.symbol)?.isFavorite ? 'favorited' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        const currentFavorite = watchlistStocks.find(w => w.symbol === stock.symbol)?.isFavorite || false
                        toggleFavorite(stock.symbol, currentFavorite)
                      }}
                      title={watchlistStocks.find(w => w.symbol === stock.symbol)?.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {watchlistStocks.find(w => w.symbol === stock.symbol)?.isFavorite ? '★' : '☆'}
                    </button>
                  </div>
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
          )
        ) : (
          <div className="no-data">
            <p>No watchlist data available. Click "Refresh" to load current stock prices.</p>
          </div>
        )}
      </div>

      {/* Add Stock Modal */}
      {showAddStock && (
        <div className="modal-overlay" onClick={() => setShowAddStock(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Stock to Watchlist</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAddStock(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              if (newStockSymbol.trim() && newStockName.trim()) {
                addStockToWatchlist(newStockSymbol.trim().toUpperCase(), newStockName.trim())
              }
            }}>
              <div className="form-group">
                <label htmlFor="stock-symbol">Stock Symbol</label>
                <input
                  type="text"
                  id="stock-symbol"
                  value={newStockSymbol}
                  onChange={(e) => setNewStockSymbol(e.target.value)}
                  placeholder="e.g., AAPL"
                  required
                  maxLength={10}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="stock-name">Company Name</label>
                <input
                  type="text"
                  id="stock-name"
                  value={newStockName}
                  onChange={(e) => setNewStockName(e.target.value)}
                  placeholder="e.g., Apple Inc."
                  required
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowAddStock(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="add-button"
                  disabled={addingStock || !newStockSymbol.trim() || !newStockName.trim()}
                >
                  {addingStock ? 'Adding...' : 'Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Watchlist

