// src/context/AuthContext.jsx
// SOLID: Single Responsibility — this context manages ONLY auth state.
// It provides login/logout/register functions and the current user to
// the entire React tree without prop-drilling.

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Loading while we check stored token

    // On app startup, check if there's a valid stored session
    useEffect(() => {
        const storedUser = localStorage.getItem('fold_user');
        const storedToken = localStorage.getItem('fold_token');
        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = useCallback((token, userData) => {
        localStorage.setItem('fold_token', token);
        localStorage.setItem('fold_user', JSON.stringify(userData));
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('fold_token');
        localStorage.removeItem('fold_user');
        setUser(null);
    }, []);

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for easy consumption in any component
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
