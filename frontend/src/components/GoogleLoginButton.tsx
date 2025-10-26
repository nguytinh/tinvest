import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import './GoogleLoginButton.css'

interface GoogleLoginButtonProps {
  onSuccess?: () => void
  onError?: () => void
}

function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const navigate = useNavigate()

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      // Send the credential to your backend for verification
      const response = await fetch('http://localhost:5001/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Clear any cached data from previous user
        localStorage.removeItem('watchlist-data')
        localStorage.removeItem('watchlist-is-real-data')
        localStorage.removeItem('dashboard-data')
        localStorage.removeItem('dashboard-is-real-data')
        localStorage.removeItem('crypto-data')
        localStorage.removeItem('crypto-is-real-data')
        localStorage.removeItem('news-data')
        
        // Store the JWT token
        localStorage.setItem('token', data.token)
        console.log('Login successful:', data)
        
        if (onSuccess) onSuccess()
        
        // Navigate to dashboard
        navigate('/dashboard')
      } else {
        console.error('Authentication failed')
        if (onError) onError()
      }
    } catch (error) {
      console.error('Error during Google login:', error)
      if (onError) onError()
    }
  }

  const handleError = () => {
    console.error('Google Login Failed')
    if (onError) onError()
  }

  return (
    <div className="google-login-wrapper">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        theme="outline"
        size="large"
        width="100%"
        text="signin_with"
      />
    </div>
  )
}

export default GoogleLoginButton

