/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Inter"', 'sans-serif'], // "Intel-like" premium clean look
                space: ['"Space Grotesk"', 'sans-serif'], // Space Grotesk for Login
                mono: ['"Intel One Mono"', 'monospace'], // Actual Intel coding font for code blocks if needed
            },
            colors: {
                pucho: {
                    dark: '#111834',      // Primary Text / Sidebar Active
                    purple: '#8b5cf6',    // Brand Accent / Hovers
                    blue: '#3b82f6',      // Gradients
                    light: '#f8f9fc',     // App Background
                }
            },
            boxShadow: {
                'glow': '0 0 20px rgba(139, 92, 246, 0.15)', // The "Pucho Glow"
                'subtle': '0 2px 10px rgba(0,0,0,0.05)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
            }
        },
    },
    plugins: [],
}
