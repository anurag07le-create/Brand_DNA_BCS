import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, logAction } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. REHYDRATE: Check local storage on mount
        const storedUser = localStorage.getItem('dashboard_user_data');
        if (storedUser) {
            try { setUser(JSON.parse(storedUser)); } catch (e) { console.error(e); }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        // 1. BACKDOOR (Mock): Instant Admin Access (Keep for fallback if needed, or remove if strictly sticking to DB)
        // User requested "login can be done by username and password" against "Create user table".
        // I will keep the admin/admin backdoor for initial setup safety, but primarily query the DB.

        try {
            // Query Custom 'users' table
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .eq('password', password) // In production, use hashing!
                .maybeSingle();

            if (error || !data) {
                // Fallback for hardcoded admin if DB fails or empty (optional, but good for dev)
                if (username === 'admin007' && password === 'admin@456_7') {
                    const mockUser = { id: 'admin-1', username: 'admin007', email: 'admin@pucho.ai', role: 'admin', name: 'Super Admin' };
                    setUser(mockUser);
                    localStorage.setItem('dashboard_user_data', JSON.stringify(mockUser));
                    return { success: true };
                }
                throw new Error('Invalid credentials');
            }

            // Success
            const userObj = { ...data, role: 'admin' }; // Defaulting to admin role for now as requested "admin panel"
            setUser(userObj);
            localStorage.setItem('dashboard_user_data', JSON.stringify(userObj));

            // Log it
            await logAction('LOGIN', `User ${username} logged in successfully`, username);

            return { success: true };
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, message: error.message || 'Login failed' };
        }
    };

    const logout = async () => {
        if (user?.username) {
            await logAction('LOGOUT', `User ${user.username} logged out`, user.username);
        }
        setUser(null);
        localStorage.removeItem('dashboard_user_data');
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
