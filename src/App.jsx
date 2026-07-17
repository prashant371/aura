import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Discover from './pages/Discover'
import CreateCharacter from './pages/CreateCharacter'
import EditCharacter from './pages/EditCharacter'
import ChatPage from './pages/ChatPage'
import GroupChat from './pages/GroupChat'
import Settings from './pages/Settings'
import useStore from './store/useStore'

function RequireAuth({ children }) {
  const user = useStore(s => s.user)
  if (!user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/discover" element={
          <RequireAuth>
            <>
              <Navbar />
              <Discover />
            </>
          </RequireAuth>
        } />
        <Route path="/create-character" element={
          <RequireAuth>
            <>
              <Navbar />
              <CreateCharacter />
            </>
          </RequireAuth>
        } />
        <Route path="/edit-character/:id" element={
          <RequireAuth>
            <>
              <Navbar />
              <EditCharacter />
            </>
          </RequireAuth>
        } />
        <Route path="/chat/:id" element={
          <RequireAuth>
            <ChatPage />
          </RequireAuth>
        } />
        <Route path="/group/:id" element={
          <RequireAuth>
            <GroupChat />
          </RequireAuth>
        } />
        <Route path="/settings" element={
          <RequireAuth>
            <>
              <Navbar />
              <Settings />
            </>
          </RequireAuth>
        } />
        <Route path="*" element={
          <RequireAuth>
            <>
              <Navbar />
              <div className="page-wrapper">
                <div className="container">
                  <div className="empty-state">
                    <div className="empty-icon">✦</div>
                    <h3>Page not found</h3>
                    <a href="/discover" className="btn btn-primary">Back to Discover</a>
                  </div>
                </div>
              </div>
            </>
          </RequireAuth>
        } />
      </Routes>
    </BrowserRouter>
  )
}
