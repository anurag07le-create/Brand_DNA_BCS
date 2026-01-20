import { createClient } from '@supabase/supabase-js';

// Hardcoded credentials as per user request to avoid .env issues
const supabaseUrl = 'https://flxgempjhungevsgxeuh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZseGdlbXBqaHVuZ2V2c2d4ZXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NTg2MjQsImV4cCI6MjA4MzUzNDYyNH0.djEYRHM7qIRaGB7zUkfYTSh8l17hXibP3x1gKlXsdKg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const logAction = async (action, details, performedBy) => {
    try {
        const { error } = await supabase
            .from('logs')
            .insert([
                {
                    action,
                    details,
                    performed_by: performedBy,
                    timestamp: new Date().toISOString()
                }
            ]);
        if (error) console.error('Error logging action:', error);
    } catch (err) {
        console.error('Logging failed:', err);
    }
};
