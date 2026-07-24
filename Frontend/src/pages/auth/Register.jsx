import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { Eye, EyeOff } from 'lucide-react';
import './AuthLayout.css';

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    
    // Check if we are on the login or register page to highlight the correct tape tab
    const isLogin = location.pathname === '/login';

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }
        if (formData.password.length < 8) {
            return setError('Password must be at least 8 characters long');
        }

        setIsLoading(true);
        setError('');

        try {
            const { data } = await authService.register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });

            login(data.token, data.user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
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
                    Credential<br />
                    vault &nbsp;♡
                </div>

                {/* 3. Tape Tabs */}
                <Link to="/register" className={`canvas-tape-top ${!isLogin ? 'active' : ''}`}>Sign Up</Link>
                <Link to="/login" className={`canvas-tape-bottom ${isLogin ? 'active' : ''}`}>Login</Link>

                {/* 4. Form Area inside Book */}
                <div className="canvas-form-area" style={{ top: '15%', height: '70%' }}>
                    {error && (
                        <div className="alert" style={{ marginBottom: '10px', fontSize: 'clamp(0.8rem, 1vw, 1rem)', padding: '8px' }}>
                            {error}
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleRegisterSubmit}>
                        <div className="form-group">
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className={`form-input ${error && !formData.name ? 'error' : ''}`}
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

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
                                    className={`form-input ${error && formData.password.length < 8 ? 'error' : ''}`}
                                    placeholder="Master Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength="8"
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

                        <div className="form-group">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                className={`form-input ${error && formData.password !== formData.confirmPassword ? 'error' : ''}`}
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button type="submit" className="btn" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Account'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
