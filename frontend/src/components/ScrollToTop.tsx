import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Reset scroll position whenever the route changes (deep links land at the top). */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
  }, [pathname])

  return null
}
