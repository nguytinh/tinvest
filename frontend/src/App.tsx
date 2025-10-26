import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Watchlist from './pages/Watchlist'
import Crypto from './pages/Crypto'
import News from './pages/News'
import StockDetail from './pages/StockDetail'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/watchlists" element={<Watchlist />} />
        <Route path="/crypto" element={<Crypto />} />
        <Route path="/news" element={<News />} />
        <Route path="/stock/:symbol" element={<StockDetail />} />
      </Routes>
    </Router>
  )
}

export default App

