import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchBrands } from '../services/googleSheetsService';
import { BRANDS as FALLBACK_BRANDS } from '../data/brands';
import { useAuth } from './AuthContext';

const BrandContext = createContext();

export const BrandProvider = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [ideasCache, setIdeasCache] = useState({});

    // Use refs to access latest state without adding to dependency array
    const brandsRef = React.useRef(brands);
    const userRef = React.useRef(user);

    useEffect(() => {
        brandsRef.current = brands;
        userRef.current = user;
    }, [brands, user]);

    const refreshBrands = useCallback(async () => {
        try {
            // Pass user object as config (contains spreadsheet_id, etc.)
            // Using ref to get latest user without triggering re-creation of function
            const currentUser = userRef.current || {};
            const data = await fetchBrands(currentUser);
            setBrands(data);
            return data;
        } catch (err) {
            console.error('Failed to refresh brands:', err);
            return brandsRef.current;
        }
    }, []); // Empty dependency array = stable function reference

    const cacheIdeas = (brandSlug, ideas) => {
        setIdeasCache(prev => ({
            ...prev,
            [brandSlug]: ideas
        }));
    };

    useEffect(() => {
        // Wait for auth to be ready
        if (authLoading) return;

        const initBrands = async () => {
            setLoading(true);
            await refreshBrands();
            setLoading(false);
        };
        initBrands();
    }, [authLoading, user, refreshBrands]);

    return (
        <BrandContext.Provider value={{ brands, loading, error, refreshBrands, ideasCache, cacheIdeas }}>
            {children}
        </BrandContext.Provider>
    );
};

export const useBrands = () => {
    const context = useContext(BrandContext);
    if (!context) {
        throw new Error('useBrands must be used within a BrandProvider');
    }
    return context;
};
