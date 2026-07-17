import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { getInitials } from '../lib/helpers'
import './Navbar.css'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  const logout = useStore(s => s.logout)
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <nav className="navbar glass" role="navigation">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/discover" className="navbar-logo">
          <span className="logo-mark">✦</span>
          <span className="logo-text">Aura</span>
        </Link>

        {/* Nav links */}
        <div className="navbar-links">
          <Link
            to="/discover"
            className={`nav-link ${isActive('/discover') ? 'active' : ''}`}
          >
            Discover
          </Link>
          <Link
            to="/create-character"
            className={`nav-link ${isActive('/create-character') ? 'active' : ''}`}
          >
            Create
          </Link>
          <Link
            to="/settings"
            className={`nav-link ${isActive('/settings') ? 'active' : ''}`}
          >
            Settings
          </Link>
        </div>

        {/* User */}
        <div className="navbar-user">
          {user && (
            <div className="user-menu-wrap">
              <button
                className="user-btn"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="User menu"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="avatar avatar-xs" />
                ) : (
                  <div className="avatar-placeholder avatar-xs" style={{ fontSize: '0.6rem' }}>
                    {getInitials(user.name)}
                  </div>
                )}
                <span className="user-name">{user.name?.split(' ')[0]}</span>
              </button>

              {menuOpen && (
                <>
                  <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
                  <div className="user-dropdown">
                    <div className="dropdown-email">{user.email}</div>
                    <button
                      className="dropdown-item"
                      onClick={() => { navigate('/settings'); setMenuOpen(false) }}
                    >
                      Settings
                    </button>
                    <button
                      className="dropdown-item dropdown-item-danger"
                      onClick={() => { logout(); navigate('/'); setMenuOpen(false) }}
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
