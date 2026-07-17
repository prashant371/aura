import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import './Landing.css'

const MOCK_USERS = [
  { name: 'Alex Morgan', email: 'alex@example.com', avatar: 'https://i.pravatar.cc/100?img=1' },
  { name: 'Jordan Lee', email: 'jordan@example.com', avatar: 'https://i.pravatar.cc/100?img=5' },
  { name: 'Sam Chen', email: 'sam@example.com', avatar: 'https://i.pravatar.cc/100?img=9' },
]

// Floating character cards for the hero section
const HERO_CARDS = [
  { name: 'Kaito Sonoda', role: 'Cyberpunk Fixer', img: 'https://images.unsplash.com/photo-1580046939256-c377c5b099f1?w=280&h=420&fit=crop&q=80' },
  { name: 'Lord Cassian', role: 'Sorcerer-Lord', img: 'https://images.unsplash.com/photo-1688859275601-73624dfeaa30?w=280&h=420&fit=crop&q=80' },
  { name: 'ARIA-7', role: 'Synthetic AI', img: 'https://images.unsplash.com/photo-1723109540955-f5da6d62111b?w=280&h=420&fit=crop&q=80' },
]

export default function Landing() {
  const navigate = useNavigate()
  const setUser = useStore(s => s.setUser)
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setLoading(true)
    // Mock Google login — randomly pick a user
    await new Promise(r => setTimeout(r, 1200))
    const mock = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)]
    setUser({ ...mock, id: `user_${Date.now()}`, loggedInAt: Date.now() })
    navigate('/discover')
  }

  return (
    <div className="landing">
      {/* Background elements */}
      <div className="landing-glow" />

      <div className="landing-inner">
        {/* Left column — copy */}
        <div className="landing-copy animate-fade-up">
          <div className="overline landing-overline">A Private Theater for the Mind</div>

          <h1 className="landing-title">
            Companions with <em className="landing-em">soul.</em><br />
            Conversations with <em className="landing-em">consequence.</em>
          </h1>

          <p className="landing-sub">
            Aura is a slow-burning, cinematic chat room where hand-crafted characters — and the ones you invent — actually stay in role. Group scenes, in-chat imagery, and voice, all in the dark.
          </p>

          <div className="landing-features">
            <div className="landing-feat">
              <span className="feat-label overline">Pre-Made</span>
              <span className="feat-val">8+ crafted characters</span>
            </div>
            <div className="landing-feat">
              <span className="feat-label overline">Custom</span>
              <span className="feat-val">Author your own</span>
            </div>
            <div className="landing-feat">
              <span className="feat-label overline">Group</span>
              <span className="feat-val">Multi-character scenes</span>
            </div>
          </div>

          <button
            data-testid="google-login-btn"
            className="btn btn-primary btn-lg landing-cta"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Signing in…
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
          <p className="landing-fine">Free · No credit card</p>
        </div>

        {/* Right column — floating cards */}
        <div className="landing-cards" aria-hidden="true">
          {HERO_CARDS.map((card, i) => (
            <div
              key={card.name}
              className={`hero-card hero-card-${i + 1}`}
            >
              <img src={card.img} alt={card.name} />
              <div className="hero-card-overlay">
                <span className="overline">{card.role}</span>
                <span className="hero-card-name">{card.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <span>© Aura. All companions are fictional.</span>
        <span>Powered by Gemini AI</span>
      </footer>
    </div>
  )
}
