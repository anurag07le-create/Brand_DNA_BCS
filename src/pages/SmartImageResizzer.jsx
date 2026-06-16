import React, { useState } from 'react';
import { Image, Loader2, X, Upload, Download, Check, Sparkles, Maximize2 } from 'lucide-react';
import Papa from 'papaparse';
import { createPortal } from 'react-dom';

const ASPECT_RATIOS = [
    { id: '1:1', label: '1:1', name: 'Square', width: 1080, height: 1080 },
    { id: '2:3', label: '2:3', name: 'Portrait', width: 720, height: 1080 },
    { id: '3:2', label: '3:2', name: 'Classic', width: 1080, height: 720 },
    { id: '3:4', label: '3:4', name: 'Portrait Std', width: 810, height: 1080 },
    { id: '4:3', label: '4:3', name: 'Standard', width: 1080, height: 810 },
    { id: '4:5', label: '4:5', name: 'Instagram', width: 864, height: 1080 },
    { id: '5:4', label: '5:4', name: 'Large Format', width: 1080, height: 864 },
    { id: '9:16', label: '9:16', name: 'Story/Reel', width: 607, height: 1080 },
    { id: '16:9', label: '16:9', name: 'Widescreen', width: 1080, height: 607 },
    { id: '21:9', label: '21:9', name: 'Cinematic', width: 1080, height: 463 },
];

const SmartImageResizzer = () => {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedRatios, setSelectedRatios] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resizedImages, setResizedImages] = useState([]);
    const [pollingIntervalId, setPollingIntervalId] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
            setResizedImages([]);
        }
    };

    const toggleRatio = (ratioId) => {
        setSelectedRatios(prev =>
            prev.includes(ratioId) ? prev.filter(id => id !== ratioId) : [...prev, ratioId]
        );
    };

    const handleResize = async () => {
        if (!imageFile || selectedRatios.length === 0) {
            alert("Please upload an image and select at least one aspect ratio.");
            return;
        }

        // Clear any existing polling
        if (pollingIntervalId) {
            clearInterval(pollingIntervalId);
            setPollingIntervalId(null);
        }

        setIsProcessing(true);
        setResizedImages([]);

const toBase64 = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        };

        const generateLogId = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < 25; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };

        const logId = generateLogId();
        console.log('Generated log_id:', logId);
        console.log('Selected aspect_ratios:', selectedRatios);

        try {
            const base64Image = await toBase64(imageFile);
            const base64Data = base64Image.split(',')[1];

            const response = await fetch('https://studio.pucho.ai/api/v1/webhooks/BwEg0ACL4TyTdUhXKNhCq', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: base64Data,
                    aspect_ratios: selectedRatios,
                    log_id: logId
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Response:', data);
                // If webhook returns immediate images, use them. Otherwise start polling the sheet below.
                if (data && (data.results || data.images)) {
                    setResizedImages(data.results || data.images || []);
                }
            } else {
                alert("Failed to process image. Please try again.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred. Please try again.");
        }

        // Start polling the Google Sheet for results (every 2s, up to 5 minutes)
        pollSheetForLogId(logId, selectedRatios);
    };

    const resetAll = () => {
        if (pollingIntervalId) {
            clearInterval(pollingIntervalId);
            setPollingIntervalId(null);
        }
        setImageFile(null);
        setImagePreview(null);
        setSelectedRatios([]);
        setResizedImages([]);
        setIsProcessing(false);
    };

    // Poll the Google Sheet for the given log id. Checks every 2s up to 5 minutes.
    const pollSheetForLogId = async (logId, targetRatios) => {
        const SPREADSHEET_ID = '1trmuPKla4JjrNEJbj0_Ll2uXpbws0g2e7FhXa4rUdDU';
        const GID = '144898735';
        const INTERVAL_MS = 2000;
        const MAX_MS = 5 * 60 * 1000;

        let attempts = 0;
        const maxAttempts = Math.ceil(MAX_MS / INTERVAL_MS);

        const check = async () => {
            attempts += 1;
            console.log(`Polling attempt ${attempts} for log_id: ${logId}`);

            try {
                const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}&_t=${Date.now()}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error('Failed to fetch sheet');
                const csvText = await res.text();

                const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
                const rows = parsed.data || [];

                console.log(`Found ${rows.length} rows in sheet`);
                if (rows.length > 0) {
                    console.log('Column names:', Object.keys(rows[0]));
                    console.log('First 3 Log IDs in sheet:', rows.slice(0, 3).map(r => r['Log ID']));
                }

                const match = rows.find(row => {
                    const rowId = String(row['Log ID'] || row['Log id'] || '').trim();
                    const targetId = String(logId).trim();
                    console.log(`Comparing: rowId="${rowId}" vs targetId="${targetId}" - Match: ${rowId === targetId}`);
                    return rowId === targetId;
                });

                if (match) {
                    console.log('Found matching row:', match);
                    
                    if (pollingIntervalId) {
                        clearInterval(pollingIntervalId);
                        setPollingIntervalId(null);
                    }

                    const raw = match['Resized Images'] || '';
                    console.log('Raw Resized Images:', raw);

                    try {
                        let normalized = String(raw).trim();
                        if (normalized.startsWith('"') && normalized.endsWith('"')) {
                            normalized = normalized.slice(1, -1).replace(/""/g, '"');
                        }
                        const parsedJson = JSON.parse(normalized);
                        console.log('Parsed images:', parsedJson);

                        // Filter to only show images matching selected aspect ratios
                        const filteredResults = parsedJson.filter(item =>
                            targetRatios && targetRatios.length > 0
                                ? targetRatios.includes(item.aspect_ratio)
                                : true
                        );
                        console.log('Target ratios:', targetRatios, '- Filtered from', parsedJson.length, 'to', filteredResults.length);

                        const results = filteredResults.map(item => ({
                            ratio: { id: item.aspect_ratio, label: item.aspect_ratio, name: item.aspect_ratio },
                            url: item.image_link,
                            success: true
                        }));
                        setResizedImages(results);
                        setIsProcessing(false);
                    } catch (e) {
                        console.error('Failed to parse Resized Images JSON:', e);
                        setResizedImages([]);
                        setIsProcessing(false);
                    }
                    return true;
                } else {
                    console.log(`No match found for log_id: ${logId}`);
                }
            } catch (e) {
                console.error('Polling error:', e);
            }

            if (attempts >= maxAttempts) {
                console.warn('Polling timed out for log_id:', logId);
                if (pollingIntervalId) {
                    clearInterval(pollingIntervalId);
                    setPollingIntervalId(null);
                }
                setIsProcessing(false);
                return false;
            }
            return false;
        };

        await check();

        const intervalId = setInterval(async () => {
            const found = await check();
            if (found) {
                clearInterval(intervalId);
                setPollingIntervalId(null);
            }
        }, INTERVAL_MS);

        setPollingIntervalId(intervalId);
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">
            <div className="flex-1 flex gap-6 min-h-0">
                {/* Left Panel */}
                <div className="w-[320px] flex-shrink-0 flex flex-col gap-4">
                    {/* Upload */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Upload Image</h3>
                        <label className="relative block border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-violet-300 hover:bg-violet-50/30 transition-all cursor-pointer text-center">
                            <input type="file" accept="image/*" onChange={handleImageSelect} className="absolute inset-0 opacity-0" />
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="h-24 mx-auto rounded-lg object-contain" />
                            ) : (
                                <div className="py-4">
                                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Click to upload</p>
                                </div>
                            )}
                        </label>
                        {imageFile && (
                            <button onClick={resetAll} className="mt-2 text-xs text-gray-500 hover:text-red-500 transition-colors">
                                Remove image
                            </button>
                        )}
                    </div>

                    {/* Aspect Ratios */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 flex-1 min-h-0 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">Aspect Ratios</h3>
                            <button
                                onClick={() => setSelectedRatios(selectedRatios.length === ASPECT_RATIOS.length ? [] : ASPECT_RATIOS.map(r => r.id))}
                                className="text-xs text-violet-600 hover:text-violet-700"
                            >
                                {selectedRatios.length === ASPECT_RATIOS.length ? 'Clear' : 'Select all'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 overflow-y-auto flex-1">
                            {ASPECT_RATIOS.map((ratio) => {
                                const isSelected = selectedRatios.includes(ratio.id);
                                return (
                                    <button
                                        key={ratio.id}
                                        onClick={() => toggleRatio(ratio.id)}
                                        className={`p-2 rounded-lg border text-left transition-all ${isSelected
                                                ? 'border-violet-500 bg-violet-50'
                                                : 'border-gray-100 hover:border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-gray-700">{ratio.label}</span>
                                            {isSelected && <Check className="w-3 h-3 text-violet-600" />}
                                        </div>
                                        <span className="text-[10px] text-gray-500">{ratio.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleResize}
                        disabled={!imageFile || selectedRatios.length === 0 || isProcessing}
                        className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Generate ({selectedRatios.length})
                            </>
                        )}
                    </button>
                </div>

                {/* Right Panel - Results */}
                <div className="flex-1 bg-white rounded-xl border border-gray-100 flex flex-col min-h-0">
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Results</h3>
                        {resizedImages.length > 0 && (
                            <button onClick={() => setResizedImages([])} className="text-xs text-gray-500 hover:text-gray-700">
                                Clear
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {resizedImages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <Maximize2 className="w-12 h-12 mb-3 opacity-50" />
                                <p className="text-sm">Resized images will appear here</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-4">
                                {resizedImages.map((result, index) => (
                                    <div key={index} className="bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                                        <div className="aspect-square flex items-center justify-center p-3 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => result.success && setSelectedImage(result)}>
                                            {result.success ? (
                                                <img src={result.url} alt={result.ratio.name} className="max-w-full max-h-full object-contain" />
                                            ) : (
                                                <div className="text-center text-gray-400">
                                                    <X className="w-6 h-6 mx-auto mb-1" />
                                                    <span className="text-xs">Failed</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-medium text-gray-700">{result.ratio.name}</p>
                                                <p className="text-[10px] text-gray-400">{result.ratio.label}</p>
                                            </div>
                                            {result.success && (
                                                <a href={result.url} download className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <Download className="w-4 h-4 text-gray-500" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Full-screen Image Modal */}
            {selectedImage && createPortal(
                <div
                    className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                    <img
                        src={selectedImage.url}
                        alt={selectedImage.ratio.name}
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                        <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                            {selectedImage.ratio.label}
                        </span>
                        <a
                            href={selectedImage.url}
                            download
                            onClick={(e) => e.stopPropagation()}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </a>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default SmartImageResizzer;
