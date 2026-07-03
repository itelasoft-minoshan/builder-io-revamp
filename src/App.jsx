import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { pages, routes } from './generated'
import { HtmlPage } from './components/HtmlPage'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {routes.map(({ path, id }) => {
          const routeKey = path
          const page = pages[routeKey]
          if (!page) return null

          return (
            <Route
              key={id}
              path={path}
              element={<HtmlPage page={page} />}
            />
          )
        })}
      </Routes>
    </>
  )
}
