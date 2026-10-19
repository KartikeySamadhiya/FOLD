import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { Eye, EyeOff } from 'lucide-react';
import './AuthLayout.css';

const LeftPanel = () => (
  <div className="auth-left-panel">
    <div className="auth-brand">
      <span className="brand-char">F</span>
      <span className="brand-char">O</span>
      <span className="brand-char">L</span>
      <span className="brand-char">D</span>
    </div>
    <div className="auth-tagline">
      Your personal journal, connections,<br />
      and reminders — all in one place.
    </div>
    
    {/* Custom illustration will go here */}
    <div className="auth-illustration-area" />
    
    <div className="auth-features">
      <div className="auth-feature-badge">📝 Journal</div>
      <div className="auth-feature-badge">👥 Connections</div>
      <div className="auth-feature-badge">🔔 Reminders</div>
    </div>
  </div>
);

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { data } = await authService.login({ email, password });
            login(data.token, data.user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login. Is the backend running?');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <LeftPanel />
            <div className="auth-right-panel">
                <div className="auth-card">
                    <div className="auth-tabs">
                        <Link to="/login" className="auth-tab active">Login</Link>
                        <Link to="/register" className="auth-tab">Sign Up</Link>
                    </div>
                    
                    {error && <div className="auth-error">{error}</div>}
                    
                    <form onSubmit={handleLogin}>
                        <div className="auth-form-group">
                            <label className="auth-form-label">Email</label>
                            <input
                                type="email"
                                className="auth-form-input"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="auth-form-group">
                            <label className="auth-form-label">Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="auth-form-input"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex="-1"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                            {isLoading ? 'Logging in...' : 'Log In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
