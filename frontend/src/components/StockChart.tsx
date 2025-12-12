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

  const fetchChartData = async () => {
    setLoading(true)
    setError(null)

    try {
      const API_KEY = 'I8FPzew0IaP3sS9027sCuGW7fHnfXxq0' // Polygon.io API key

      console.log(`Fetching real historical data for ${symbol} (${timeRange}) from Polygon.io...`)

      // Calculate date range
      const now = new Date()
      let from: string
      let to: string = now.toISOString().split('T')[0] // Today in YYYY-MM-DD format
      let multiplier = 1
      let timespan = 'day'

      switch (timeRange) {
        case '1D':
          // Get previous trading day
          const yesterday = new Date(now)
          yesterday.setDate(yesterday.getDate() - 1)
          from = yesterday.toISOString().split('T')[0]
          multiplier = 5
          timespan = 'minute'
          break
        case '5D':
          const fiveDaysAgo = new Date(now)
          fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 7) // Get 7 days to account for weekends
          from = fiveDaysAgo.toISOString().split('T')[0]
          multiplier = 30
          timespan = 'minute'
          break
        case '1M':
          const oneMonthAgo = new Date(now)
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
          from = oneMonthAgo.toISOString().split('T')[0]
          multiplier = 1
          timespan = 'day'
          break
        case '6M':
          const sixMonthsAgo = new Date(now)
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
          from = sixMonthsAgo.toISOString().split('T')[0]
          multiplier = 1
          timespan = 'day'
          break
        case 'YTD':
          const yearStart = new Date(now.getFullYear(), 0, 1)
          from = yearStart.toISOString().split('T')[0]
          multiplier = 1
          timespan = 'day'
          break
        case '1Y':
          const oneYearAgo = new Date(now)
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
          from = oneYearAgo.toISOString().split('T')[0]
          multiplier = 1
          timespan = 'day'
          break
        case '5Y':
          const fiveYearsAgo = new Date(now)
          fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
          from = fiveYearsAgo.toISOString().split('T')[0]
          multiplier = 1
          timespan = 'week'
          break
        default:
          const defaultDate = new Date(now)
          defaultDate.setMonth(defaultDate.getMonth() - 1)
          from = defaultDate.toISOString().split('T')[0]
          multiplier = 1
          timespan = 'day'
      }

      // Polygon.io aggregates endpoint
      const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&apiKey=${API_KEY}`
      
      console.log(`Fetching from: ${url}`)
      
      const response = await fetch(url)
      const data = await response.json()

      // Check for API errors
      if (data.status === 'ERROR') {
        throw new Error(data.error || 'API error occurred')
      }

      if (data.status === 'NOT_FOUND' || !data.results || data.results.length === 0) {
        throw new Error('No historical data available for this stock')
      }

      // Convert Polygon.io data to our format
      const chartPoints: ChartDataPoint[] = data.results.map((bar: any) => {
        const timestamp = bar.t // Polygon returns timestamp in milliseconds
        const date = new Date(timestamp)
        
        return {
          timestamp,
          date: formatDateForTimeRange(date),
          price: parseFloat(bar.c.toFixed(2)) // closing price
        }
      })

      if (chartPoints.length === 0) {
        throw new Error('No data points available for this time range')
      }

      setChartData(chartPoints)

      // Calculate price change
      if (chartPoints.length > 0) {
        const firstPrice = chartPoints[0].price
        const lastPrice = chartPoints[chartPoints.length - 1].price
        const change = lastPrice - firstPrice
        const changePercent = (change / firstPrice) * 100

        setPriceChange(change)
        setPriceChangePercent(changePercent)
      }
      
      // Cache the data for 10 minutes
      const cacheKey = `chart-${symbol}-${timeRange}`
      localStorage.setItem(cacheKey, JSON.stringify({
        data: chartPoints,
        timestamp: Date.now()
      }))
      
      console.log(`Chart loaded: ${chartPoints.length} real data points from Polygon.io`)
    } catch (err) {
      console.error('Error fetching chart data:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chart data'
      setError(errorMessage)
      setChartData([])
    } finally {
      setLoading(false)
    }
  }

  const formatDateForTimeRange = (date: Date): string => {
    if (timeRange === '1D' || timeRange === '5D') {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    } else if (timeRange === '5Y') {
      return date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
