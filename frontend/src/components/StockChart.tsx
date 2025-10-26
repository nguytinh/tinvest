import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import './StockChart.css'

interface ChartDataPoint {
  timestamp: number
  date: string
  price: number
}

interface StockChartProps {
  symbol: string
  currentPrice: number
}

type TimeRange = '1D' | '5D' | '1M' | '6M' | 'YTD' | '1Y' | '5Y'

function StockChart({ symbol, currentPrice }: StockChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('1M')
  const [priceChange, setPriceChange] = useState<number>(0)
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0)

  useEffect(() => {
    // Try to load cached data first
    const cacheKey = `chart-${symbol}-${timeRange}`
    const cached = localStorage.getItem(cacheKey)
    
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached)
        // Cache valid for 10 minutes
        if (Date.now() - timestamp < 10 * 60 * 1000) {
          setChartData(data)
          setLoading(false)
          console.log(`Loaded chart from cache for ${symbol} (${timeRange})`)
          
          // Calculate price change from cached data
          if (data.length > 0) {
            const firstPrice = data[0].price
            const lastPrice = data[data.length - 1].price
            const change = lastPrice - firstPrice
            const changePercent = (change / firstPrice) * 100
            setPriceChange(change)
            setPriceChangePercent(changePercent)
          }
          return
        }
      } catch (err) {
        console.error('Error loading cached chart:', err)
      }
    }

    // Add debouncing to prevent rapid API calls when switching timeframes
    const timer = setTimeout(() => {
      fetchChartData()
    }, 300)

    return () => clearTimeout(timer)
  }, [symbol, timeRange])

  const getAlphaVantageFunction = () => {
    // Alpha Vantage only supports daily data for free tier
    // For intraday, we'd need premium which isn't free
    switch (timeRange) {
      case '1D':
      case '5D':
        return 'TIME_SERIES_DAILY' // Best we can do with free tier
      case '1M':
      case '6M':
      case 'YTD':
      case '1Y':
        return 'TIME_SERIES_DAILY'
      case '5Y':
        return 'TIME_SERIES_WEEKLY' // Weekly for longer timeframes
      default:
        return 'TIME_SERIES_DAILY'
    }
  }

  const filterDataByTimeRange = (data: any[]) => {
    const now = Date.now()
    let cutoffDate: number

    switch (timeRange) {
      case '1D':
        cutoffDate = now - 86400000 // 1 day
        break
      case '5D':
        cutoffDate = now - 432000000 // 5 days
        break
      case '1M':
        cutoffDate = now - 2592000000 // 30 days
        break
      case '6M':
        cutoffDate = now - 15552000000 // 180 days
        break
      case 'YTD':
        const yearStart = new Date(new Date().getFullYear(), 0, 1)
        cutoffDate = yearStart.getTime()
        break
      case '1Y':
        cutoffDate = now - 31536000000 // 365 days
        break
      case '5Y':
        cutoffDate = now - 157680000000 // 5 years
        break
      default:
        cutoffDate = now - 2592000000
    }

    return data.filter(point => point.timestamp >= cutoffDate)
  }

  const fetchChartData = async () => {
    setLoading(true)
    setError(null)

    try {
      const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY

      if (!API_KEY) {
        throw new Error('Alpha Vantage API key not configured. Get a free key at https://www.alphavantage.co/support/#api-key')
      }

      // Add 1-second delay before chart data to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))

      const functionType = getAlphaVantageFunction()

      console.log(`Fetching chart data for ${symbol} (${timeRange}) using ${functionType}...`)

      const response = await fetch(
        `https://www.alphavantage.co/query?function=${functionType}&symbol=${symbol}&apikey=${API_KEY}&outputsize=full`
      )

      const data = await response.json()

      // Check for API error messages
      if (data['Error Message']) {
        throw new Error('Invalid stock symbol or API error')
      }

      if (data['Note']) {
        throw new Error('API rate limit reached. Please wait a minute and try again.')
      }

      // Parse the time series data
      let timeSeriesKey = ''
      if (data['Time Series (Daily)']) {
        timeSeriesKey = 'Time Series (Daily)'
      } else if (data['Weekly Time Series']) {
        timeSeriesKey = 'Weekly Time Series'
      } else {
        throw new Error('No data available for this stock')
      }

      const timeSeries = data[timeSeriesKey]
      
      if (!timeSeries || Object.keys(timeSeries).length === 0) {
        throw new Error('No historical data available')
      }

      // Convert to our format
      const allData: ChartDataPoint[] = Object.entries(timeSeries).map(([date, values]: [string, any]) => {
        const timestamp = new Date(date).getTime()
        return {
          timestamp,
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: parseFloat(values['4. close']),
        }
      }).sort((a, b) => a.timestamp - b.timestamp) // Sort chronologically

      // Filter by time range
      const filteredData = filterDataByTimeRange(allData)

      if (filteredData.length === 0) {
        throw new Error('No data available for this time range')
      }

      setChartData(filteredData)

      // Calculate price change
      if (filteredData.length > 0) {
        const firstPrice = filteredData[0].price
        const lastPrice = filteredData[filteredData.length - 1].price
        const change = lastPrice - firstPrice
        const changePercent = (change / firstPrice) * 100

        setPriceChange(change)
        setPriceChangePercent(changePercent)
      }
      
      // Cache the data for 10 minutes
      const cacheKey = `chart-${symbol}-${timeRange}`
      localStorage.setItem(cacheKey, JSON.stringify({
        data: filteredData,
        timestamp: Date.now()
      }))
      
      console.log(`Chart loaded: ${filteredData.length} data points`)
    } catch (err) {
      console.error('Error fetching chart data:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chart data'
      setError(errorMessage)
      setChartData([])
    } finally {
      setLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-date">{payload[0].payload.date}</p>
          <p className="tooltip-price">${payload[0].value.toFixed(2)}</p>
        </div>
      )
    }
    return null
  }

  const isPositive = priceChangePercent >= 0

  return (
    <div className="stock-chart">
      <div className="chart-header">
        <div className="chart-title">
          <h3>{symbol}</h3>
          <div className="chart-change">
            <span className={`change-value ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
            </span>
            <span className="change-label">{timeRange}</span>
          </div>
        </div>

        <div className="timeframe-selector">
          {(['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`timeframe-button ${timeRange === range ? 'active' : ''}`}
              disabled={loading}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>Loading chart data...</p>
        </div>
      ) : error ? (
        <div className="chart-error">
          <p>{error}</p>
          <button onClick={fetchChartData} className="retry-button">
            Retry
          </button>
        </div>
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? 'var(--positive)' : 'var(--negative)'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isPositive ? 'var(--positive)' : 'var(--negative)'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
            <XAxis
              dataKey="date"
              stroke="var(--text-secondary)"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              tickLine={{ stroke: 'var(--border-primary)' }}
            />
            <YAxis
              domain={['auto', 'auto']}
              stroke="var(--text-secondary)"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              tickLine={{ stroke: 'var(--border-primary)' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? 'var(--positive)' : 'var(--negative)'}
              strokeWidth={2}
              fill={`url(#gradient-${symbol})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-no-data">
          <p>No chart data available</p>
        </div>
      )}
    </div>
  )
}

export default StockChart
