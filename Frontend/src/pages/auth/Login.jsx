import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { Eye, EyeOff } from 'lucide-react';
import './AuthLayout.css';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    
    // Check if we are on the login or register page to highlight the correct tape tab
    const isLogin = location.pathname === '/login';

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        totpCode: '',
    });

    const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
    const [preAuthToken, setPreAuthToken] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { data } = await authService.login({
                email: formData.email,
                password: formData.password,
            });

            if (data.requiresTwoFactor) {
                setRequiresTwoFactor(true);
                setPreAuthToken(data.preAuthToken);
            } else {
                login(data.token, data.user);
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTwoFactorSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { data } = await authService.verifyTwoFactorLogin({
                preAuthToken,
                totpCode: formData.totpCode,
            });

            login(data.token, data.user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid 2FA code.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-canvas">
                
                {/* 1. Logo Area */}
                <div className="canvas-logo-area">
                    <h1 className="canvas-logo-text">FOLD</h1>
                    <h2 className="canvas-subheadline">
                        Make a fold about...<br />
                        <span className="highlight-something">Something</span> or <span className="highlight-someone">Someone</span>
                    </h2>
                </div>

                {/* 2. Polaroid Text */}
                <div className="canvas-polaroid-text">
                    Journal<br />
                    Task-List<br />
                    Credential vault<br />
                     &nbsp;
                </div>

                {/* 3. Tape Tabs */}
                <Link to="/register" className={`canvas-tape-top ${!isLogin ? 'active' : ''}`}>Sign Up</Link>
                <Link to="/login" className={`canvas-tape-bottom ${isLogin ? 'active' : ''}`}>Login</Link>

                {/* 4. Form Area inside Book */}
                <div className="canvas-form-area">
                    {error && (
                        <div className="alert" style={{ marginBottom: '10px', fontSize: 'clamp(0.8rem, 1vw, 1rem)', padding: '8px' }}>
                            {error}
                        </div>
                    )}

                    {!requiresTwoFactor ? (
                        <form className="auth-form" onSubmit={handleLoginSubmit}>
                            <div className="form-group">
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className={`form-input ${error && !formData.email ? 'error' : ''}`}
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <div className="input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        className={`form-input ${error && !formData.password ? 'error' : ''}`}
                                        placeholder="Password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="input-toggle-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex="-1"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="btn" disabled={isLoading}>
                                {isLoading ? 'Loading...' : 'Login'}
                            </button>
                        </form>
                    ) : (
                        <form className="auth-form" onSubmit={handleTwoFactorSubmit}>
                            <div className="form-group">
                                <input
                                    type="text"
                                    id="totpCode"
                                    name="totpCode"
                                    className={`form-input ${error ? 'error' : ''}`}
                                    placeholder="2FA Code (000000)"
                                    value={formData.totpCode}
                                    onChange={handleChange}
                                    maxLength="6"
                                    autoComplete="one-time-code"
                                    autoFocus
                                    required
                                />
                            </div>

                            <button type="submit" className="btn" disabled={isLoading || formData.totpCode.length < 6}>
                                Verify
                            </button>
                            <button
                                type="button"
                                className="btn"
                                style={{ background: 'transparent', color: '#ff5e00', border: '2px solid #ff5e00' }}
                                onClick={() => setRequiresTwoFactor(false)}
                                disabled={isLoading}
                            >
                                Back
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
