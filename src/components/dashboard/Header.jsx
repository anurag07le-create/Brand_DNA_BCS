import React, { useState } from "react";
import { useLocation } from "react-router-dom"; // Import useLocation
import MenuIcon from '../../assets/icons/menu.svg';
import SearchIcon from '../../assets/icons/search.svg';
import BellIcon from '../../assets/icons/bell.png';

const Header = ({ onMenuClick, searchQuery, setSearchQuery }) => {
    const [isFocused, setIsFocused] = useState(false);
    const location = useLocation();

    // Map paths to Title and Description
    const pageMetadata = {
        '/admin': { title: 'Generate Brand DNA', description: 'Create and manage your brand identities' },
        '/admin/agents': { title: 'Get Campaign Ideas', description: 'Brainstorm and generate innovative campaign concepts based on your Brand DNA' },
        '/admin/chat': { title: 'Generate Creatives', description: 'Design and generate visual assets' },
        '/admin/flow': { title: 'My DNAs', description: 'View and manage your saved brand identities' },
        '/admin/activity': { title: 'Activity Logs', description: 'Recent platform activity' },
        '/admin/mcp': { title: 'MCP Controls', description: 'Manage MCP integrations' },
        '/admin/knowledge': { title: 'Knowledge Base', description: 'Manage brand documents and data' },
        '/admin/tools': { title: 'System Tools', description: 'Advanced platform tools' },
        '/admin/marketplace': { title: 'Marketplace', description: 'Third-party integrations' },
        '/admin/market-intelligence': { title: 'Market Intelligence', description: 'Strategic insights & comprehensive brief generation' },
        '/admin/market-intelligence-reports': { title: 'Market Intelligence Reports', description: 'View and manage generated strategy reports' },
        '/admin/audio-transcription': { title: 'Audio Transcription Summary', description: 'Transcribe and summarize audio files' },
    };

    const currentPath = location.pathname;
    let { title, description } = pageMetadata[currentPath] || { title: 'Dashboard', description: 'Welcome to Pucho Dashboard' };

    // Dynamic Override for Brand DNA Detail
    if (currentPath.startsWith('/admin/dna/')) {
        title = 'Brand DNA Details';
        description = 'Comprehensive identity and strategy matrix';
    }

    return (
        <header className="sticky top-0 z-20 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between pl-5 py-4 pr-8">
            {/* Left Side: Menu Toggle + Dynamic Title */}
            <div className="flex items-center gap-4 h-[44px]">
                {/* Mobile Menu Toggle */}
                <button onClick={onMenuClick} className="lg:hidden p-1 -ml-2 mr-2 hover:bg-gray-100 rounded-full transition-colors">
                    <img src={MenuIcon} alt="Menu" className="w-6 h-6 opacity-60" />
                </button>

                {/* Dynamic Title & Description (Replaces Search) */}
                <div className="flex flex-col justify-center">
                    <h1 className="text-xl font-bold text-[#111935] leading-none mb-1">{title}</h1>
                    <p className="text-sm text-gray-500 font-medium leading-none">{description}</p>
                </div>
            </div>

            {/* Actions (Right) */}
            <div className="flex items-center gap-4">
                {/* Search Bar (Restored) - Hidden on Campaign Ideas, Generate Creatives, and Brand Detail pages */}
                {/* Note: User requested Search Bar on Generate Brand DNA (/admin) page */}
                {!['/admin/agents', '/admin/chat'].includes(currentPath) && !currentPath.startsWith('/admin/dna/') && (
                    <div
                        className={`
                            hidden md:flex items-center gap-2.5 bg-white rounded-full transition-all duration-200 ease-in-out
                            ${isFocused
                                ? 'h-[44px] w-[260px] lg:w-[320px] border-[0.7px] border-[#B56FFF] shadow-[0px_0px_0px_3px_#DBD4FB] p-1'
                                : 'h-[44px] w-[260px] lg:w-[320px] border border-black/5 p-1 hover:border-[#B56FFF] hover:shadow-none'
                            }
                        `}
                    >
                        <div className="flex items-center justify-center w-9 h-9 bg-[#A0D296]/10 rounded-full flex-shrink-0">
                            <img src={SearchIcon} alt="Search" className="w-4 h-4 opacity-100" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery || ''}
                            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && setSearchQuery && setSearchQuery(e.target.value)}
                            className={`
                                flex-1 bg-transparent border-none outline-none text-[#111935] placeholder:text-black/50 text-[14px] font-['Inter'] leading-[150%]
                                transition-all duration-300 ease-in-out
                                ${isFocused ? 'pl-2' : 'pl-0'}
                            `}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                        />
                    </div>
                )}

                <span className="text-sm font-semibold text-[#111935]">Brand DNA & Creative Studio</span>
            </div>
        </header>
    );
};

export default Header;
