import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBrands } from '../context/BrandContext';
import { useAuth } from '../context/AuthContext';
import { fetchCampaignIdeas, fetchCampaignIdeasByRequestId } from '../services/googleSheetsService';
import { generateRequestId } from '../utils/requestId';
import Card from '../components/dashboard/Card';
import { ArrowLeft, Sparkles, MessageSquareText, Lightbulb, Copy, Check } from 'lucide-react';

const CampaignIdeas = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { brands, loading, ideasCache, cacheIdeas } = useBrands();
    const { user } = useAuth(); // Get user config
    const [selectedBrand, setSelectedBrand] = useState(location.state?.brand || null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState({ type: null, message: '' });
    const [campaignContext, setCampaignContext] = useState('');
    const [ideas, setIdeas] = useState(location.state?.ideas || null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false); // New loading state for history
    const [progress, setProgress] = useState(0);
    const [currentRequestId, setCurrentRequestId] = useState(null);  // Track request ID
    const pollingInterval = useRef(null);
    const ideasSectionRef = useRef(null);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, []);

    const lastFetchedIdeas = useRef(null);

    // Sync ref with state on mount/update so we don't treat restored state as 'new' compared to a future fetch
    useEffect(() => {
        if (ideas) {
            lastFetchedIdeas.current = ideas;
        }
    }, [ideas]);

    const pollForIdeas = async (requestId) => {
        try {
            let result = await fetchCampaignIdeasByRequestId(requestId, user);
            let usingFallback = false;

            // Strategy 1: Request ID match
            if (result && result.ideas && result.ideas.length > 0) {
                // Check if it's stale (same as last fetch - though usually fetchByRequestId returns a SINGLE row, ensuring different structure from full history)
                // Keeping the check for safety, but usually distinct.
            } else {
                // Strategy 2: Fallback to checking full history for new items
                console.log("Polling: Request ID not found, checking full history...");
                const fullHistory = await fetchCampaignIdeas(selectedBrand.url, user);

                const oldLength = lastFetchedIdeas.current?.ideas?.length || 0;
                const newLength = fullHistory?.ideas?.length || 0;

                if (newLength > oldLength) {
                    console.log(`Polling: New ideas detected via fallback! (${oldLength} -> ${newLength})`);
                    result = fullHistory; // Use full history as result
                    usingFallback = true;
                }
            }

            // Check if we have results (either from ID or Fallback)
            if (result && result.ideas && result.ideas.length > 0) {
                // If we have previous ideas, ensure the new ones are different
                // Use rigid string comparison for simplicity as strict equality
                const isSameAsOld = lastFetchedIdeas.current &&
                    JSON.stringify(result) === JSON.stringify(lastFetchedIdeas.current);

                if (isSameAsOld && !usingFallback) {
                    // Still seeing old ideas, keep waiting (only applies if not using fallback, since fallback explicitly checked length)
                    console.log("Polling: Stale data detected, waiting...");
                    return;
                }

                // New ideas found!
                clearInterval(pollingInterval.current);
                setProgress(100);
                setTimeout(async () => {
                    // If using fallback, we already have full history. If not, fetch it.
                    if (usingFallback) {
                        setIdeas(result);
                        if (selectedBrand) cacheIdeas(selectedBrand.slug, result);
                    } else {
                        // Fetch full updated history to include new and old ideas
                        try {
                            const updatedHistory = await fetchCampaignIdeas(selectedBrand.url, user);
                            setIdeas(updatedHistory);

                            // Update cache with fresh history
                            if (selectedBrand) {
                                cacheIdeas(selectedBrand.slug, updatedHistory);
                            }
                        } catch (err) {
                            console.error("Failed to refresh full history, falling back to new results", err);
                            setIdeas(result); // Fallback: show only new ones if full fetch fails
                        }
                    }

                    setIsGenerating(false);
                    setStatus({ type: 'success', message: 'Ideas generated successfully!' });

                    // Auto-scroll to the new ideas
                    setTimeout(() => {
                        ideasSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }, 500);
            }
        } catch (error) {
            console.error("Polling error:", error);
        }
    };

    const handleBrainstorm = async () => {
        // Capture context before clearing
        const contextToSend = campaignContext;
        setCampaignContext(''); // Clear UI immediately

        // Generate unique request ID
        const requestId = generateRequestId();
        setCurrentRequestId(requestId);
        console.log('🆔 Generated Request ID:', requestId);

        setIsGenerating(true);
        setStatus({ type: null, message: '' });
        // Removed setIdeas(null) to keep history visible
        setProgress(0);

        try {
            // Pre-fetch current ideas to avoid showing stale data
            const existing = await fetchCampaignIdeas(selectedBrand.url, user);
            lastFetchedIdeas.current = existing;
            const webhookUrl = 'https://studio.pucho.ai/api/v1/webhooks/CawkpsBo7QLUWLtMUl9iP';

            const payload = {
                requestId: requestId,  // Add request ID for tracking
                brandName: selectedBrand.name,
                brandDNA: selectedBrand,
                campaignContext: contextToSend,
                campaignContext: contextToSend,
                timestamp: new Date().toISOString(),
                spreadsheet_config: {
                    spreadsheet_id: user?.spreadsheet_id || "",
                    input_url_worksheet_id: user?.input_url_worksheet_id || "",
                    campaign_ideas_id: user?.campaign_ideas_id || "",
                    creatives_id: user?.creatives_id || "",
                    animated_creatives_id: user?.animated_creatives_id || "",
                    custom_creatives_id: user?.custom_creatives_id || ""
                }
            };

            console.log("🚀 Starting Brainstorming with payload:", payload);

            // Start fake progress bar
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 1; // Increment 1% every 100ms -> 9s to reach 90%
                });
            }, 100);

            // Send Webhook
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            console.log("📡 Webhook Response:", response.status);

            if (response.ok) {
                setStatus({ type: 'info', message: 'Agents are brainstorming... Please wait.' });

                // Start polling every 3 seconds with request ID
                pollingInterval.current = setInterval(() => pollForIdeas(requestId), 3000);
            } else {
                throw new Error('Webhook failed');
            }

        } catch (error) {
            console.error("❌ Brainstorming Error:", error);
            setStatus({ type: 'error', message: 'Failed to start brainstorming. Please try again.' });
            setIsGenerating(false);
        }
    };

    // Load existing ideas on mount with Cache + Skeleton
    useEffect(() => {
        const loadHistory = async () => {
            if (selectedBrand && !location.state?.ideas) {
                // 1. Check Cache first
                if (ideasCache[selectedBrand.slug]) {
                    setIdeas(ideasCache[selectedBrand.slug]);
                    return; // Instant load, no fetch needed immediately (or fetch in background if needed)
                }

                // 2. If no cache, Fetch with Skeleton
                try {
                    setIsLoadingHistory(true);
                    const history = await fetchCampaignIdeas(selectedBrand.url, user);
                    if (history && history.ideas) {
                        setIdeas(history);
                        cacheIdeas(selectedBrand.slug, history); // Update Cache
                    }
                } catch (e) {
                    console.error("Failed to load campaign history", e);
                } finally {
                    setIsLoadingHistory(false);
                }
            }
        };
        loadHistory();
    }, [selectedBrand]);

    // Update cache when new ideas are generated
    const handleGenerationSuccess = (newIdeas) => {
        setIdeas(newIdeas);
        if (selectedBrand) {
            cacheIdeas(selectedBrand.slug, newIdeas);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pucho-purple"></div>
            </div>
        );
    }



    // View 1: Brand Selection (No brand selected)
    if (!selectedBrand) {
        return (
            <div className="flex flex-col gap-8 max-w-7xl mx-auto py-6">
                <div className="flex flex-col gap-3">
                    <h2 className="text-[32px] font-bold text-gray-900 tracking-tight leading-none">Select a Brand</h2>
                    <p className="text-gray-500 text-lg leading-relaxed">Choose a brand to generate campaign ideas for.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {brands.map((brand, index) => (
                        <Card
                            key={brand.slug || index}
                            title={brand.name}
                            description={brand.shortDescription}
                            logo={brand.logo}
                            onClick={() => setSelectedBrand(brand)}
                            listView={false}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Combined View: Generator + History
    return (
        <div className="flex flex-col gap-4 max-w-7xl mx-auto py-0 h-full">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => {
                        setSelectedBrand(null);
                        setIdeas(null);
                        setCampaignContext('');
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div className="flex items-center gap-3">
                    <h2 className="text-[24px] font-bold text-gray-900 tracking-tight leading-none">
                        Campaign Ideas for {selectedBrand.name}
                    </h2>
                </div>
            </div>

            {/* AI Campaign Generator Section */}
            {/* AI Campaign Generator Section */}
            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-[0px_10px_30px_rgba(0,0,0,0.02)] text-center relative">
                <div className="w-14 h-14 bg-[#A0D296]/10 rounded-full flex items-center justify-center mx-auto mb-3 text-[#A0D296]">
                    <Sparkles size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">AI Campaign Generator</h3>
                <p className="text-gray-500 max-w-lg mx-auto mb-4 text-sm leading-relaxed">
                    Describe your campaign goal below, and our agents will brainstorm creative concepts based on <strong>{selectedBrand.name}'s</strong> DNA.
                </p>

                <div className="max-w-2xl mx-auto mb-4 text-left">
                    <textarea
                        value={campaignContext}
                        onChange={(e) => setCampaignContext(e.target.value)}
                        placeholder="E.g. A summer sale campaign for our new swimwear line targeting Gen Z..."
                        className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all min-h-[100px] resize-none bg-gray-50 focus:bg-white text-base shadow-sm"
                        disabled={isGenerating}
                    />
                </div>

                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={handleBrainstorm}
                        disabled={isGenerating || !campaignContext.trim()}
                        className="px-10 py-4 rounded-full font-bold text-white bg-gray-500 shadow-[0_8px_20px_rgba(107,114,128,0.25)] hover:shadow-[0_12px_25px_rgba(107,114,128,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 text-[16px] tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Brainstorming...
                            </>
                        ) : (
                            <>
                                Start Brainstorming
                            </>
                        )}
                    </button>

                    {status.message && !isGenerating && (
                        <div className={`mt-2 px-4 py-2 rounded-lg text-sm font-semibold max-w-md mx-auto animate-fade-in ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {status.message}
                        </div>
                    )}
                </div>

                {/* Inline Progress Bar */}
                {isGenerating && (
                    <div className="mt-8 max-w-md mx-auto space-y-3 animate-fade-in">
                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <span className="animate-pulse">Agents Brainstorming...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-black rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-400 pt-2 animate-pulse">
                            Parsing Brand DNA • Analyzing Market Trends • Generating Angles
                        </p>
                    </div>
                )}
            </div>

            {/* Previously Generated Ideas Section */}
            {(ideas && ideas.ideas && ideas.ideas.length > 0) || isLoadingHistory ? (
                <div ref={ideasSectionRef} className="mt-4 pb-12 animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="h-px bg-gray-200 flex-1"></div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Concepts</span>
                        <div className="h-px bg-gray-200 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                        {isLoadingHistory ? (
                            // Appealing Skeleton Loader
                            [1, 2, 3].map((i) => (
                                <div key={i} className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm h-[320px] flex flex-col relative overflow-hidden">
                                    {/* Shimmer Effect */}
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-gray-50/50 to-transparent z-10"></div>

                                    <div className="flex justify-end mb-4">
                                        <div className="h-5 w-24 bg-gray-100 rounded-full animate-pulse"></div>
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        <div className="h-8 w-3/4 bg-gray-100 rounded-lg animate-pulse"></div>
                                        <div className="space-y-2">
                                            <div className="h-4 w-full bg-gray-50 rounded-md animate-pulse"></div>
                                            <div className="h-4 w-full bg-gray-50 rounded-md animate-pulse"></div>
                                            <div className="h-4 w-2/3 bg-gray-50 rounded-md animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-6 space-y-3">
                                        <div className="h-3 w-32 bg-gray-100 rounded-md animate-pulse"></div>
                                        <div className="flex gap-2">
                                            <div className="h-6 w-20 bg-gray-50 rounded-full animate-pulse"></div>
                                            <div className="h-6 w-20 bg-gray-50 rounded-full animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            [...ideas.ideas].reverse().map((idea, index) => (
                                <div key={index} className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col h-full">
                                    <div className="flex justify-end mb-3">
                                        <div className="bg-gray-50 px-3 py-1 rounded-full text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            AI Concept
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{idea.idea_name}</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed mb-4">{idea.one_liner}</p>

                                        {idea.primary_channels && idea.primary_channels.length > 0 && (
                                            <div className="space-y-2 mb-4 mt-auto">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Target Channels</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {idea.primary_channels.map((channel, cIdx) => (
                                                        <span key={cIdx} className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                                            {channel}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Generate Creatives Button - Logic for bottom alignment */}
                                    <div className="mt-auto pt-4 border-t border-gray-100 flex justify-end">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate('/admin/chat', { state: { idea, brand: selectedBrand, allIdeas: ideas } });
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors"
                                        >
                                            <Sparkles size={14} />
                                            Generate Creatives
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default CampaignIdeas;
