// Maps the Android hardware back button to React Router history.
// Renders nothing; must live inside <BrowserRouter> so it can use useNavigate.
// No-op on web (the listener is only attached for the Capacitor target).

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isCapacitor } from './capacitor'

// Root routes where "back" should minimize the app instead of navigating.
const ROOT_PATHS = ['/', '/login', '/landing']

export default function CapacitorBackButton() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!isCapacitor()) return

    let cleanup: (() => void) | undefined
    import('@capacitor/app').then(({ App }) => {
      const handlePromise = App.addListener('backButton', () => {
        if (ROOT_PATHS.includes(window.location.pathname)) {
          App.exitApp()
        } else {
          navigate(-1)
        }
      })
      cleanup = () => {
        handlePromise.then((h) => h.remove())
      }
    })

    return () => cleanup?.()
  }, [navigate])

  return null
}
