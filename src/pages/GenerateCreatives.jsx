import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ArrowLeft, Sparkles, Video, Loader2 } from 'lucide-react';
import { fetchCustomCreatives, fetchGeneratedCreatives, fetchAnimatedCreatives, fetchBrandCreatives } from '../services/googleSheetsService';
import { generateRequestId } from '../utils/requestId';
import { useAuth } from '../context/AuthContext';

const triggeredGenerations = new Set();

const GenerateCreatives = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { idea, brand, allIdeas } = location.state || {};
    const { user } = useAuth(); // Get user config

    // ... (rest of component state)

    const [creativeIdeas, setCreativeIdeas] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [loadingMessage, setLoadingMessage] = useState('Estimated time 1-2 minutes');
    const [isCheckingHistory, setIsCheckingHistory] = useState(true);

    // Custom generation states
    const [customPrompt, setCustomPrompt] = useState('');
    const [isCustomLoading, setIsCustomLoading] = useState(false);
    const [customError, setCustomError] = useState(null);
    const [currentRequestId, setCurrentRequestId] = useState(null);  // Track request ID

    // Animation states
    const [animatingIndices, setAnimatingIndices] = useState(new Set()); // Track which creatives are animating
    const [animatedCreatives, setAnimatedCreatives] = useState({}); // Map of index -> video URL
    const [pendingGenerations, setPendingGenerations] = useState([]); // Track pending custom generations

    // UI state
    const [activeMode, setActiveMode] = useState('story');
    const [dropdownState, setDropdownState] = useState(null);
    const [selectedAspectRatio, setSelectedAspectRatio] = useState(null);

    const [selectedTextOptions, setSelectedTextOptions] = useState([]); // New state for text options
    const [previewImage, setPreviewImage] = useState(null); // Full screen preview state

    // Image selection modal state
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [imageState, setImageState] = useState({ file: null, preview: null });
    const fileInputRef = useRef(null);

    // Polling state
    const pollingInterval = useRef(null);
    const pollingStartTime = useRef(null);
    const MAX_POLL_TIME = 5 * 60 * 1000; // 5 minutes


    // Store multiple intervals for concurrent custom generations
    const customPollingIntervals = useRef(new Set());
    const animationPollingInterval = useRef(null);

    const loadingMessages = [
        'Analyzing brand DNA...',
        'Crafting visual concepts...',
        'Generating creative assets...',
        'Applying brand aesthetics...',
        'Finalizing your creatives...'
    ];

    // Unified Initialization Effect: Load History -> Then optionally Start Generation
    const initializationRef = useRef(false);

    useEffect(() => {
        const initializeFlow = async () => {
            // Prevent double initialization
            if (!idea || !brand || initializationRef.current) return;
            initializationRef.current = true;

            console.log("🚀 Initializing Creative Studio for:", brand.name);
            console.log("📜 Loading creative history for idea:", idea.idea_name);

            try {
                // 1. Try to fetch existing history for THIS BRAND
                const history = await fetchBrandCreatives(brand.url, user);

                // 2. Filter history to match ONLY the current idea
                // Relaxed match: checks if prompt/idea_name matches current idea name
                const filteredHistory = history?.filter(item => {
                    // Always show custom creatives for this brand (since we filter by Brand URL upstream)
                    if (item.source === 'custom') return true;

                    // For batch items, ensure they match the current idea
                    const itemName = (item.prompt || "").toLowerCase().trim();
                    const targetName = (idea.idea_name || "").toLowerCase().trim();
                    return itemName === targetName || itemName.includes(targetName) || targetName.includes(itemName);
                });

                if (filteredHistory && filteredHistory.length > 0) {
                    console.log("✅ Found existing creatives for this idea (" + filteredHistory.length + " items).");
                    setCreativeIdeas(filteredHistory);
                    setIsLoading(false); // Ensure loader is OFF
                } else {
                    console.log("wm No existing creatives for this idea. Starting auto-generation...");
                    setCreativeIdeas([]); // Clear inputs
                    // Only auto-generate if we assume the user WANTS to generate immediately upon entering
                    // usage requirements say: "if not generated, webhook should get triggered... when it get generated then it should be shown"
                    startGenerationFlow();
                }
            } catch (err) {
                console.error("Failed to load history:", err);
                startGenerationFlow(); // Fallback
            } finally {
                setIsCheckingHistory(false);
            }
        };

        initializeFlow();
    }, [idea, brand]);

    /* Removed redundant separate auto-trigger useEffect */

    const startGenerationFlow = async (isRetry = false) => {
        // De-duplication check
        const triggerKey = `${brand.url}-${idea.idea_name}`;
        if (!isRetry && triggeredGenerations.has(triggerKey)) {
            console.log("⚠️ Generation already triggered for this session. Skipping.");
            return;
        }
        triggeredGenerations.add(triggerKey);

        // Generate unique request ID
        const requestId = generateRequestId();
        setCurrentRequestId(requestId);
        console.log('🆔 Generated Request ID:', requestId);

        setIsLoading(true);
        setError(null);
        setLoadingMessage(loadingMessages[0]);

        let messageIndex = 0;
        const messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            setLoadingMessage(loadingMessages[messageIndex]);
        }, 3000);

        try {
            const webhookUrl = 'https://studio.pucho.ai/api/v1/webhooks/1zaCA2WF2KLRozuOMiWAP';
            const payload = {
                requestId: requestId,
                brand_name: (brand?.name || "Unknown Brand").trim(),
                brand_url: (brand?.url || "").trim(),
                logo_url: (brand?.logo || "").trim(),
                campaign_idea: (idea?.idea_name || "").trim(),
                one_liner: (idea?.one_liner || "").trim(),
                aspect_ratio: "1:1", // Add default aspect ratio
                // Send essential DNA data only (exclude heavy assets) to avoid payload limit
                brand_dna: {
                    name: brand?.name,
                    colors: brand?.colors,
                    fonts: brand?.fonts,
                    vibe: brand?.vibe
                },
                spreadsheet_config: {
                    spreadsheet_id: user?.spreadsheet_id || "",
                    input_url_worksheet_id: user?.input_url_worksheet_id || "",
                    campaign_ideas_id: user?.campaign_ideas_id || "",
                    creatives_id: user?.creatives_id || "",
                    animated_creatives_id: user?.animated_creatives_id || "",
                    custom_creatives_id: user?.custom_creatives_id || ""
                }
            };

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to trigger creative generation');

            clearInterval(messageInterval);
            setLoadingMessage('Waiting for creatives to be ready...');

            // Start polling with request ID
            pollingStartTime.current = Date.now();
            startPolling(requestId);

        } catch (err) {
            clearInterval(messageInterval);
            setError(err.message);
            setIsLoading(false);
            // Allow retry if it failed
            triggeredGenerations.delete(triggerKey);
        }
    };

    const startPolling = (requestId) => {
        console.log('🔄 Starting polling for Request ID:', requestId);

        pollingInterval.current = setInterval(async () => {
            const elapsed = Date.now() - pollingStartTime.current;
            console.log(`⏱️ Polling attempt (${Math.floor(elapsed / 1000)}s elapsed)...`);

            if (elapsed > MAX_POLL_TIME) {
                clearInterval(pollingInterval.current);
                setError('Creative generation timed out. Please try again.');
                setIsLoading(false);
                return;
            }

            try {
                // Strategy: Poll ALL brand creatives and filter locally (Same logic as Page Load / Refresh)
                // This guarantees that if "refresh works", polling works.
                const fullHistory = await fetchBrandCreatives(brand.url, user);

                const matchingItems = fullHistory?.filter(item => {
                    const itemName = (item.prompt || "").toLowerCase().trim();
                    const targetName = (idea.idea_name || "").toLowerCase().trim();
                    return itemName === targetName || itemName.includes(targetName) || targetName.includes(itemName);
                });

                console.log('📊 Polling found', matchingItems?.length || 0, 'items for this idea.');

                // If we found any items, we consider it a success for the initial generation flow
                if (matchingItems && matchingItems.length > 0) {
                    console.log('✅ Found creatives via poll:', matchingItems);
                    clearInterval(pollingInterval.current);

                    // Update state with the definitive list from the sheet
                    setCreativeIdeas(matchingItems);
                    setIsLoading(false);

                    // Force refresh to ensure UI sync as per user request
                    window.location.reload();
                } else {
                    console.log('⏳ No creatives found yet, continuing to poll...');
                }
            } catch (err) {
                console.error('❌ Polling error:', err);
            }
        }, 5000);
    };

    const requestSent = useRef(false);
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
            if (animationPollingInterval.current) clearInterval(animationPollingInterval.current);
            // Clear all custom polling intervals
            customPollingIntervals.current.forEach(id => clearInterval(id));
            customPollingIntervals.current.clear();
        };
    }, []);

    const handleCustomGeneration = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!customPrompt.trim() || isCustomLoading) return;

        // Store the prompt before clearing
        const promptToSearch = customPrompt.trim();

        // Clear input and disable button immediately
        setCustomPrompt('');
        setIsCustomLoading(true);
        setCustomError(null);

        try {
            const webhookUrl = 'https://studio.pucho.ai/api/v1/webhooks/NvZX7JfssDTT7R9Q900k3';

            // Determine image extension
            let imageExtension = 'png'; // Default
            if (imageState.file) {
                imageExtension = imageState.file.name.split('.').pop().toLowerCase();
            } else if (imageState.preview && typeof imageState.preview === 'string') {
                const urlParts = imageState.preview.split('.');
                if (urlParts.length > 1) {
                    const ext = urlParts[urlParts.length - 1].split(/[?#]/)[0].toLowerCase();
                    if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) {
                        imageExtension = ext;
                    }
                }
            }

            const payload = {
                input_line: promptToSearch,
                image_selected: imageState.file ? await convertToBase64(imageState.file) : imageState.preview,
                image_extension: imageExtension, // Added extension field
                aspect_selected: selectedAspectRatio,
                text_options_selected: selectedTextOptions,
                brand_dna: brand,
                spreadsheet_config: {
                    spreadsheet_id: user?.spreadsheet_id || "",
                    input_url_worksheet_id: user?.input_url_worksheet_id || "",
                    campaign_ideas_id: user?.campaign_ideas_id || "",
                    creatives_id: user?.creatives_id || "",
                    animated_creatives_id: user?.animated_creatives_id || "",
                    custom_creatives_id: user?.custom_creatives_id || ""
                }
            };

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to trigger custom generation');

            // 1. Success! Enable input immediately
            setIsCustomLoading(false);

            // 2. Add placeholder to UI
            const tempId = Date.now();
            setPendingGenerations(prev => [...prev, tempId]);

            // 3. Start polling in background
            const startTime = Date.now();
            const customInterval = setInterval(async () => {
                const elapsed = Date.now() - startTime;

                // Timeout check
                if (elapsed > MAX_POLL_TIME) {
                    clearInterval(customInterval);
                    customPollingIntervals.current.delete(customInterval);

                    // Remove placeholder on timeout (and maybe show error toast?)
                    setPendingGenerations(prev => prev.filter(id => id !== tempId));
                    return;
                }

                try {
                    const result = await fetchCustomCreatives(promptToSearch, user);
                    if (result && result.length > 0) {
                        clearInterval(customInterval);
                        customPollingIntervals.current.delete(customInterval);

                        // Append results with source tag
                        const newCreatives = result.map(item => ({ ...item, source: 'custom' }));
                        setCreativeIdeas(prev => [...(prev || []), ...newCreatives]);

                        // Remove ONE placeholder (using our specific tempId)
                        setPendingGenerations(prev => prev.filter(id => id !== tempId));
                    }
                } catch (err) {
                    console.error('Custom polling error:', err);
                }
            }, 5000);

            // Track the interval
            customPollingIntervals.current.add(customInterval);

        } catch (err) {
            setCustomError(err.message);
            setIsCustomLoading(false); // Enable even on error
        }
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageState({
                file: file,
                preview: URL.createObjectURL(file)
            });
        }
    };

    const handleBrandAssetSelect = (url) => {
        setImageState({
            file: null,
            preview: url
        });
    };

    const clearImage = () => {
        setImageState({ file: null, preview: null });
    };

    const selectRatio = (ratio) => {
        setSelectedAspectRatio(ratio);
        setActiveMode('story');
        setDropdownState(null);
    };

    const handleAnimate = async (creative, index) => {
        if (animatingIndices.has(index)) return;

        console.log("🎬 Starting animation for creative:", index + 1);

        // Add index to animating set
        setAnimatingIndices(prev => new Set(prev).add(index));

        try {
            const webhookUrl = 'https://studio.pucho.ai/api/v1/webhooks/PWGXbOrfXebCIGeut7lvX';

            // Construct payload matching the requirement
            // pass the brand dna, creative url, campaign idea to the webhook.
            // Reverting to sending RAW OBJECTS as requested ("same logic as other buttons").
            // handleCustomGeneration sends 'brand_dna': brand (object).
            const payload = {
                brand_dna: brand,
                creative_url: creative.image_url,
                campaign_idea: idea,
                aspect_ratio: creative.size || selectedAspectRatio || "1:1"
            };

            console.log("🚀 Sending Animation Payload (Raw Objects):", payload);

            // Trigger Webhook using standard JSON POST
            // The previous URL was a form endpoint, hence the need for no-cors/FormData.
            // The new URL is an API webhook, so standard JSON with CORS support is expected.
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.error("Webhook failed:", response.status, response.statusText);
                throw new Error('Failed to trigger animation workflow');
            }

            // Start Polling if not already running
            if (!animationPollingInterval.current) {
                const startTime = Date.now();
                animationPollingInterval.current = setInterval(async () => {

                    // Check timeout (global timeout for simplicity, or we could track per-item times if needed)
                    // For now, if 5 mins pass since LAST start, we might timeout. 
                    // Better: just poll. The backend won't fail if we poll extra.
                    const elapsed = Date.now() - startTime;
                    if (elapsed > MAX_POLL_TIME) {
                        clearInterval(animationPollingInterval.current);
                        animationPollingInterval.current = null;
                        setAnimatingIndices(new Set()); // Clear all animating
                        alert("Animation timed out. Please try again.");
                        return;
                    }

                    try {
                        // Poll for animated creatives
                        const animationMap = await fetchAnimatedCreatives(brand.url, user);

                        // Check if our idea has an animation
                        // The sheet keys by 'Idea Name', so we look up by the current idea's name
                        const videoUrl = animationMap[idea.idea_name];

                        if (videoUrl) {
                            console.log("🎥 Found animated video:", videoUrl);

                            // Check which animating index "claimed" this? 
                            // Since we only get 1 URL per Idea Name, we have to assume it satisfies *one* or *all* pending requests for this idea.
                            // To be safe and compliant with the UI flow, let's satisfy the *pending* ones.
                            // BUT, validating if the videoUrl is "new" is hard without history.
                            // We will simply check if we have pending animations.

                            setAnimatingIndices(prev => {
                                const next = new Set(prev);
                                // For now, we don't know EXACTLY which request finished if multiple were sent.
                                // But if ANY finished, it likely means the sheet updated.
                                // We will clear the FIRST one found in the set? Or all?
                                // If we clear all, they all show the same video. That's probably expected behavior for "Animating this idea".

                                // Actually, let's just use the index we launched with? 
                                // The poller runs in a closure. 
                                // We need to break out of the closure to access current `animatingIndices`? No, we need to use functional updates.

                                // Let's simplify: Any URL found for this idea satisfies ALL pending animations for this idea.
                                if (next.size > 0) {
                                    setAnimatedCreatives(prevAnimated => {
                                        const newAnimated = { ...prevAnimated };
                                        next.forEach(idx => {
                                            if (!newAnimated[idx]) newAnimated[idx] = videoUrl;
                                        });
                                        return newAnimated;
                                    });
                                    // Clear all indices because they are all for the same Idea Name
                                    return new Set();
                                }
                                return next;
                            });

                            // If we cleared everything, stop polling
                            // We need to check inside the setState callback? 
                            // Actually the polling check runs every 5s. 
                            // If set is empty, we should stop polling?
                        }
                    } catch (e) {
                        console.error("Polling error:", e);
                    }

                    // Cleanup polling if no indices left (needs access to current state, tricky in interval)
                    // We will rely on the functional update above to clear indices. 
                    // We can check ref or just let it run until 5 min timeout?
                    // Proper way: use a ref for animatingIndices to check inside interval, or just let it run.

                }, 5000);
            }

        } catch (error) {
            console.error("Animation trigger failed:", error);
            setAnimatingIndices(prev => {
                const next = new Set(prev);
                next.delete(index);
                return next;
            });
            alert("Failed to start animation.");
        }
    };



    const handleDownload = async (url, creativeOrSource) => {
        if (!url) {
            console.error("handleDownload: No URL provided");
            return;
        }

        console.log("⬇️ Initiating download for:", url);

        try {
            // Determine filename checking...
            let filenameBase = "creative_asset";
            let isCustom = false;

            if (typeof creativeOrSource === 'object' && creativeOrSource !== null) {
                isCustom = creativeOrSource.source === 'custom';
            } else if (creativeOrSource === 'custom') {
                isCustom = true;
            }

            // Sanitize Brand Name
            const safeBrand = (brand?.name || "Brand").replace(/[^a-zA-Z0-9\s-_]/g, '').trim();
            // Sanitize Campaign Idea (Handle undefined idea case safely)
            const safeIdea = (idea?.idea_name || "Campaign").replace(/[^a-zA-Z0-9\s-_]/g, '').trim();

            if (isCustom) {
                filenameBase = `${safeBrand}_Custom_${Date.now()}`;
            } else {
                filenameBase = `${safeBrand}_${safeIdea}_${Date.now()}`;
            }

            // Determine extension
            let extension = 'png';
            const urlParts = url.split('.');
            if (urlParts.length > 1) {
                // Remove query params
                const ext = urlParts[urlParts.length - 1].split(/[?#]/)[0].toLowerCase();
                if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
                    extension = ext;
                }
            }

            const filename = `${filenameBase}.${extension}`;

            // Fetch Blob
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            // Create invisible link
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            // Delay revoke to ensure click registers
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);

            console.log("✅ Download triggered successfully");

        } catch (error) {
            console.error("❌ Download failed (CORS likely), falling back to new tab:", error);
            window.open(url, '_blank');
        }
    };

    // Helper to render grid items including placeholders
    const renderCreativeGrid = () => {
        if (!creativeIdeas) return null;

        const gridItems = [];

        creativeIdeas.forEach((creative, index) => {
            // 1. Render the original Image Card
            gridItems.push(
                <div key={`creative-${index}`} className="group relative">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                        onClick={() => setPreviewImage(creative.image_url)}
                    >
                        <img
                            src={creative.image_url}
                            alt={`Creative ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Actions Overlay */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        {/* Default Animate Button (Visible if no video exists yet) */}
                        {!animatedCreatives[index] && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAnimate(creative, index);
                                }}
                                disabled={animatingIndices.has(index)}
                                className={`bg-white/90 hover:bg-white p-2 rounded-full shadow-lg border border-gray-200 transition-all ${animatingIndices.has(index) ? 'cursor-not-allowed opacity-50' : ''}`}
                                title="Animate this creative"
                            >
                                <Video className="w-4 h-4 text-purple-600" />
                            </button>
                        )}

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(creative.image_url, creative);
                            }}
                            className="bg-white/90 hover:bg-white p-2 rounded-full shadow-lg border border-gray-200"
                            title="Download"
                        >
                            <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                    </div>
                </div>
            );

            // 2. Render Animation Placeholder OR Valid Video Card (Targeting right side of specific card)
            if (animatingIndices.has(index)) {
                // LOADING STATE
                gridItems.push(
                    <div key={`animating-${index}`} className="aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 shadow-inner flex flex-col items-center justify-center animate-pulse">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                        <span className="text-xs text-gray-500 font-medium">Animating...</span>
                        <span className="text-[10px] text-gray-400 mt-1">This may take a few minutes</span>
                    </div>
                );
            } else if (animatedCreatives[index]) {
                // RESULT STATE (Video)
                gridItems.push(
                    <div key={`video-${index}`} className="group relative aspect-square rounded-2xl overflow-hidden bg-black border border-gray-200 shadow-sm">
                        <video
                            src={animatedCreatives[index]}
                            className="w-full h-full object-cover"
                            controls
                            playsInline
                            loop
                            autoPlay
                            muted
                        />
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Use same download logic but for video? 
                                    // Normally we might want a specific video downloader, but browser native controls handle it usually.
                                    // If requested, we can add a specific download button. For now native controls suffice.
                                    window.open(animatedCreatives[index], '_blank');
                                }}
                                className="bg-white/90 hover:bg-white p-2 rounded-full shadow-lg border border-gray-200"
                            >
                                <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>
                        </div>
                    </div>
                );
            }
        });

        // 3. Render Pending Placeholders
        pendingGenerations.forEach(id => {
            gridItems.push(
                <div key={id} className="aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 shadow-inner flex flex-col items-center justify-center animate-pulse">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                    <span className="text-xs text-gray-500 font-medium">Generating...</span>
                    <span className="text-[10px] text-gray-400 mt-1">This may take a few minutes</span>
                </div>
            );
        });

        return gridItems;
    };


    // Empty State Check
    if (!idea || !brand) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] w-full relative overflow-hidden bg-transparent">
                {/* Main Card Container */}
                <div className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-12 md:p-24 flex flex-col items-center text-center overflow-hidden border border-gray-100 mx-4">

                    {/* Centered Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center flex-1">


                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
                            Generate Creative Assets
                        </h2>
                        <p className="text-slate-500 text-xl leading-relaxed font-medium max-w-lg mx-auto mb-10">
                            To start creating visuals, you first need to brainstorm campaign concepts.
                        </p>

                        <button
                            onClick={() => navigate('/admin/agents')}
                            className="
                                px-10 py-4 rounded-full font-bold text-white
                                bg-gray-500
                                shadow-[0_8px_20px_rgba(107,114,128,0.25)]
                                hover:shadow-[0_12px_25px_rgba(107,114,128,0.35)]
                                hover:scale-[1.02] active:scale-[0.98]
                                transition-all duration-200
                                flex items-center gap-2.5 text-[16px] tracking-wide
                            "
                        >
                            Get Campaign Ideas
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- LIGHT THEME RENDER ---
    return (
        <div className="relative w-full h-[calc(100vh-7rem)] bg-[#F3F4F6] text-gray-900 overflow-hidden font-sans selection:bg-[#A0D296]/30 flex rounded-3xl border border-gray-200 shadow-sm -mt-2 mb-6">

            {/* SIDEBAR: Context & Navigation (Light Mode) */}
            <div className="w-[340px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col h-full relative z-20 shadow-sm">

                {/* 1. App Header */}
                <div className="p-4 border-b border-gray-100">
                    <button
                        onClick={() => navigate('/admin/agents', { state: { brand: brand, ideas: allIdeas } })}
                        className="flex items-center gap-3 text-gray-500 hover:text-gray-900 transition-colors group mb-4"
                    >
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 group-hover:border-gray-300 transition-all">
                            <ArrowLeft size={14} />
                        </div>
                        <span className="text-sm font-medium">Back to Ideas</span>
                    </button>

                    <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        Creative Studio
                    </h1>
                </div>

                {/* 2. Context Scroll Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                    {/* Active Campaign Context */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                            <Sparkles size={10} />
                            Active Campaign
                        </div>
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                            <h3 className="font-bold text-lg leading-tight mb-2 text-gray-900">{idea.idea_name}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed font-light">{idea.one_liner}</p>
                        </div>
                    </div>

                    {/* Brand Context */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                            Brand DNA
                        </div>
                        <div className="relative group">
                            <div className="relative p-4 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3">
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1">{brand.name}</h4>
                                    <p className="text-xs text-gray-500">Visual Identity Loaded</p>
                                </div>

                                {/* Brand Elements Gallery */}
                                {brand.elements && brand.elements.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Assets</span>
                                            <span className="text-[10px] text-gray-400 font-mono">{brand.elements.length}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {brand.elements.slice(0, 6).map((element, idx) => (
                                                <div
                                                    key={idx}
                                                    className="aspect-square rounded-lg overflow-hidden border border-gray-100 bg-gray-50 hover:border-gray-300 transition-colors"
                                                >
                                                    <img
                                                        src={element.url}
                                                        alt={`Brand element ${idx + 1}`}
                                                        className="w-full h-full object-contain p-1"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-300"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>';
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        {brand.elements.length > 6 && (
                                            <p className="text-[10px] text-gray-400 text-center mt-2">
                                                +{brand.elements.length - 6} more in library
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status / Output Log */}
                    {/* Status / Output Log */}
                    <div className="pt-6 border-t border-gray-100">
                        <div className="flex justify-between items-end mb-3">
                            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-1.5">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                                Session Output
                            </span>
                        </div>

                        <div className="bg-gray-50 border border-gray-200/60 rounded-2xl p-4 flex items-center justify-between shadow-sm transition-all hover:border-gray-300/60 hover:shadow-md">
                            <div className="flex items-center gap-3.5">
                                {isLoading ? (
                                    <>
                                        <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100">
                                            <Loader2 className="w-5 h-5 text-[#6C5FBC] animate-spin" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 leading-tight">Generating...</p>
                                            <p className="text-[10px] text-gray-500 font-medium">{loadingMessage || "Processing assets..."}</p>
                                        </div>
                                    </>
                                ) : error ? (
                                    <>
                                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                                            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 leading-tight">Generation Failed</p>
                                            <p className="text-[10px] text-red-500 font-medium truncate max-w-[150px]">{error}</p>
                                        </div>
                                    </>
                                ) : creativeIdeas && creativeIdeas.length > 0 ? (
                                    <>
                                        <div className="w-10 h-10 rounded-full bg-[#EBF7E9] flex items-center justify-center border border-[#A0D296]/30">
                                            <svg className="w-5 h-5 text-[#6ea362]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 leading-tight">Success</p>
                                            <p className="text-[10px] text-gray-500 font-medium">{creativeIdeas.length} new asset(s) created</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                                            <Sparkles className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-400 leading-tight shadow-sm">Getting Ready</p>
                                            <p className="text-[10px] text-gray-400 font-medium">Processing...</p>
                                        </div>
                                    </>
                                )}
                            </div>


                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CANVAS: Creative Grid (Light Mode) */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">

                {/* Loading State - Premium Skeleton Grid */}
                {((!creativeIdeas || creativeIdeas.length === 0) && (isLoading || !error)) && (
                    <div className="absolute inset-0 bg-[#F3F4F6] z-30 overflow-y-auto custom-scrollbar p-8 pb-64">
                        {/* Centered Processing Header */}
                        <div className="text-center mb-8 animate-fade-in">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
                                {isCheckingHistory ? (
                                    <>
                                        <div className="relative">
                                            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                                        </div>
                                        Preparing Studio
                                    </>
                                ) : (
                                    <>
                                        <div className="relative">
                                            <Sparkles className="w-6 h-6 text-[#A0D296] animate-pulse" />
                                        </div>
                                        Creating Your Visuals
                                    </>
                                )}
                            </h3>
                            <p className="text-gray-500 text-sm font-medium animate-pulse">
                                {isCheckingHistory ? "Checking for existing assets..." : loadingMessage}
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-6 auto-rows-min">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="aspect-square rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden relative">
                                    {/* Shimmer Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-12 translate-x-[-150%] animate-shimmer z-10" />

                                    {/* Card Content Skeleton */}
                                    <div className="w-full h-full p-6 flex flex-col items-center justify-center gap-4 bg-gray-50/50">
                                        <div className="w-16 h-16 rounded-full bg-gray-200/50 animate-pulse flex items-center justify-center">
                                            <Sparkles className="w-8 h-8 text-gray-300/50" />
                                        </div>
                                        <div className="space-y-2 w-full px-8">
                                            <div className="h-2 bg-gray-200/50 rounded-full w-3/4 mx-auto animate-pulse delay-75"></div>
                                            <div className="h-2 bg-gray-200/50 rounded-full w-1/2 mx-auto animate-pulse delay-150"></div>
                                        </div>
                                    </div>

                                    {/* Bottom Bar Skeleton */}
                                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 px-4 flex items-center justify-between opacity-50">
                                        <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse" />
                                        <div className="h-8 w-8 bg-gray-100 rounded-full animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div className="absolute inset-0 bg-[#F3F4F6] z-30 flex items-center justify-center">
                        <div className="text-center space-y-4 max-w-md px-8">
                            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center border border-red-200">
                                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Generation Failed</h3>
                                <p className="text-gray-500 text-sm">{error}</p>
                            </div>
                            <button
                                onClick={() => { setError(null); startGenerationFlow(true); }}
                                className="px-6 py-3 bg-[#6C5FBC] text-white font-bold rounded-xl hover:bg-[#5a4e9e] transition-all"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {/* Creative Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pb-64">
                    {creativeIdeas && creativeIdeas.length > 0 && (
                        <div className="grid grid-cols-3 gap-6 auto-rows-min">
                            {renderCreativeGrid()}
                        </div>
                    )}
                </div>

                {/* Floating Command Bar (Light Mode) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-3xl z-40">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 p-4">
                        <div className="flex gap-3 items-center mb-3">
                            <button
                                onClick={() => setIsImageModalOpen(true)}
                                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-all flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                                Image
                                {imageState.preview && (
                                    <span className="flex items-center justify-center bg-[#A0D296] text-white text-[10px] font-bold w-2 h-2 rounded-full ml-1"></span>
                                )}
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => setDropdownState(dropdownState === 'aspect' ? null : 'aspect')}
                                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-all flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    </svg>
                                    Aspect
                                    {selectedAspectRatio && (
                                        <span className="flex items-center justify-center bg-[#A0D296] text-white text-[10px] font-bold w-2 h-2 rounded-full ml-1"></span>
                                    )}
                                </button>
                                {dropdownState === 'aspect' && (
                                    <div className="absolute bottom-full mb-2 left-0 bg-white rounded-xl shadow-xl border border-gray-200 p-2 min-w-[140px] z-50 max-h-60 overflow-y-auto custom-scrollbar">
                                        {['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'].map(ratio => (
                                            <button
                                                key={ratio}
                                                onClick={() => selectRatio(ratio)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedAspectRatio === ratio ? 'bg-[#A0D296]/10 text-[#6ea362] font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
                                            >
                                                {ratio}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>


                            {/* Text Options Dropdown */}
                            <div className="relative ml-2">
                                <button
                                    onClick={() => setDropdownState(dropdownState === 'text' ? null : 'text')}
                                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-all flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                                    </svg>
                                    Text Options
                                    {selectedTextOptions.length > 0 && (
                                        <span className="flex items-center justify-center bg-[#A0D296] text-white text-[10px] font-bold w-5 h-5 rounded-full ml-1">
                                            {selectedTextOptions.length}
                                        </span>
                                    )}
                                </button>
                                {dropdownState === 'text' && (
                                    <div className="absolute bottom-full mb-2 left-0 bg-white rounded-xl shadow-xl border border-gray-200 p-2 min-w-[160px] z-50">
                                        {['Header', 'Description', 'Call To Action'].map(option => {
                                            const isSelected = selectedTextOptions.includes(option);
                                            return (
                                                <button
                                                    key={option}
                                                    onClick={() => {
                                                        setSelectedTextOptions(prev =>
                                                            isSelected
                                                                ? prev.filter(item => item !== option)
                                                                : [...prev, option]
                                                        );
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group ${isSelected
                                                        ? 'bg-[#A0D296]/10 text-[#6ea362] font-medium'
                                                        : 'hover:bg-gray-50 text-gray-700'
                                                        }`}
                                                >
                                                    {option}
                                                    {isSelected && (
                                                        <svg className="w-3.5 h-3.5 text-[#6ea362]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleCustomGeneration()}
                                placeholder="Describe your creative vision..."
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A0D296]/20 focus:border-[#A0D296] transition-all text-gray-900"
                                disabled={isCustomLoading}
                            />
                            <div className="flex flex-col items-end">
                                <button
                                    onClick={handleCustomGeneration}
                                    disabled={isCustomLoading || !customPrompt.trim() || !selectedAspectRatio}
                                    className="px-6 py-3 bg-[#6ea362] hover:bg-[#5f9154] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-[#6ea362]/20 active:scale-95 disabled:shadow-none flex items-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span>Generate</span>
                                </button>
                                {!selectedAspectRatio && customPrompt.trim() && (
                                    <span className="text-[10px] text-red-500 font-medium mt-1 mr-1">
                                        *Aspect ratio required
                                    </span>
                                )}
                            </div>
                        </div>

                        {customError && (
                            <div className="mt-3 text-xs text-red-500 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {customError}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Selection Modal */}
            {
                isImageModalOpen && createPortal(
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <div className="w-1 h-5 bg-[#A0D296] rounded-full"></div>
                                        Reference Image
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Pick an existing image to use in your new creative.</p>
                                </div>
                                <button
                                    onClick={() => setIsImageModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-colors"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="overflow-y-auto custom-scrollbar flex-1 -mr-2 pr-2">
                                <div className="grid grid-cols-2 gap-6">
                                    {/* 1. Upload Option */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-3.5 text-center">Preview</h4>
                                        <div
                                            className="w-[270px] h-[270px] mx-auto rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-50 transition-all flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
                                        >
                                            {imageState.preview ? (
                                                <div className="relative w-full h-full">
                                                    <img
                                                        src={imageState.preview}
                                                        alt="Preview"
                                                        className="w-full h-full object-contain p-2"
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            clearImage();
                                                        }}
                                                        className="absolute top-2 right-2 bg-white text-gray-400 hover:text-red-500 rounded-full p-1 shadow-md hover:bg-gray-50 transition-all border border-gray-200 z-20"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-400 relative z-10">No Image Selected</span>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageUpload}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <div className="mt-4 mb-[10px] flex gap-2 w-[270px] mx-auto">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex-1 flex items-center justify-center gap-2 px-2 py-2 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-xl font-bold transition-all border border-gray-200 hover:border-gray-300 active:scale-95 text-xs group shadow-sm"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 group-hover:text-gray-600 transition-colors"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                                Upload Images
                                            </button>
                                            <button
                                                onClick={() => setIsImageModalOpen(false)}
                                                className="flex-1 flex items-center justify-center gap-2 px-2 py-2 bg-[#A0D296] hover:bg-[#8ec284] text-white rounded-xl font-bold transition-all shadow-sm shadow-[#A0D296]/20 active:scale-95 text-xs"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>

                                    {/* 2. Brand Assets */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-3.5">
                                            Brand Assets ({brand?.elements?.length || 0})
                                        </h4>
                                        {brand?.elements && brand.elements.length > 0 ? (
                                            <div className="grid grid-cols-3 gap-2 h-fit max-h-[400px] overflow-y-auto custom-scrollbar mr-5 mb-3.5">
                                                {brand.elements.map((el, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => {
                                                            console.log('Selected element:', el);
                                                            handleBrandAssetSelect(el.url);
                                                        }}
                                                        className="aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 hover:border-[#A0D296] hover:bg-white transition-all relative group"
                                                    >
                                                        <img
                                                            src={el.url}
                                                            alt={`Brand asset ${i + 1}`}
                                                            className="w-full h-full object-contain p-2"
                                                            onError={(e) => {
                                                                console.error('Failed to load image:', el.url);
                                                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="12"%3EImage Error%3C/text%3E%3C/svg%3E';
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 bg-[#A0D296]/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity border-2 border-[#A0D296] rounded-xl">
                                                            <div className="bg-[#A0D296] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">Select</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-400">
                                                <svg className="mx-auto w-12 h-12 mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                    <polyline points="21 15 16 10 5 21"></polyline>
                                                </svg>
                                                <p className="text-xs">No brand assets available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>,
                    document.body
                )

            }

            {/* Full Screen Image Preview Modal */}
            {previewImage && createPortal(
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-8 active">
                    <div className="w-full h-full max-w-7xl flex gap-8 items-center justify-center relative">
                        {/* Close Button */}
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 text-white/50 hover:text-white bg-black/50 hover:bg-black/80 p-3 rounded-full backdrop-blur-sm transition-all z-20"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>

                        <div className="relative group max-h-full max-w-full">
                            <img
                                src={previewImage}
                                alt="Full Preview"
                                className="max-h-[85vh] w-auto rounded-xl shadow-2xl"
                            />

                            {/* Floating Action Bar */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/70 backdrop-blur-xl p-2 rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                                <button
                                    onClick={() => {
                                        const creative = creativeIdeas?.find(c => c.image_url === previewImage);
                                        // Pass object if found, otherwise assume batch
                                        handleDownload(previewImage, creative || 'batch');
                                    }}
                                    className="px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download Image
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div >
    );
};

export default GenerateCreatives;
