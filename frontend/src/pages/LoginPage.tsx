import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import authService from '../services/authService'
import userService from '../services/userService'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const sessionMessage = (location.state as { message?: string } | null)?.message

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await authService.login({ email, password })
      authService.saveToken(response.token)
      authService.saveUser(response.user)
      try {
        await userService.getMyProfile()
      } catch {
        // Profile sync is best-effort; login response already has user data
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verbindung fehlgeschlagen')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-600 mb-2">UniTube</h1>
          <p className="text-gray-600 dark:text-zinc-400">Verbinden Sie sich mit Ihrem Konto</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900 transition"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900 transition"
                required
              />
            </div>

            {sessionMessage && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
                {sessionMessage}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 text-white font-semibold py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verbindung...' : 'Sich einloggen'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-500">Ou</span>
            </div>
          </div>

          <p className="mt-6 text-center text-gray-600 dark:text-zinc-400">
            Pas encore de compte?{' '}
            <a href="/register" className="text-red-600 font-semibold hover:text-red-700 transition">
              S&apos;ich registrieren
            </a>
          </p>
        </div>

        <p className="text-center text-gray-500 dark:text-zinc-500 text-sm mt-6">
          Teilen Sie Ihre Videos mit der Universität und der Welt! UniTube - Ihre Plattform für
          Bildungsvideos.
        </p>
      </div>
    </div>
  )
}
