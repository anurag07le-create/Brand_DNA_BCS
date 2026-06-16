import React, { useState, useEffect } from 'react';
import { Loader2, Image, Download, X } from 'lucide-react';
import Papa from 'papaparse';
import { createPortal } from 'react-dom';

const SPREADSHEET_ID = '1trmuPKla4JjrNEJbj0_Ll2uXpbws0g2e7FhXa4rUdDU';
const GID = '144898735';

const ASPECT_RATIO_COLORS = {
    '1:1': { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
    '2:3': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    '3:2': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
    '3:4': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    '4:3': { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
    '4:5': { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
    '5:4': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    '9:16': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    '16:9': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    '21:9': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
};

const MyHistory = () => {
    const [loading, setLoading] = useState(true);
    const [historyData, setHistoryData] = useState([]);
    const [groupedImages, setGroupedImages] = useState({});
    const [selectedRatio, setSelectedRatio] = useState('all');
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}&_t=${Date.now()}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch sheet');
            const csvText = await res.text();

            const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
            const rows = parsed.data || [];

            const allImages = [];
            const grouped = {};

            rows.forEach(row => {
                const logId = row['Log ID'];
                const originalUrl = row['Original Image URL'];
                const rawResized = row['Resized Images'];

                if (rawResized) {
                    try {
                        let normalized = String(rawResized).trim();
                        if (normalized.startsWith('"') && normalized.endsWith('"')) {
                            normalized = normalized.slice(1, -1).replace(/""/g, '"');
                        }
                        const images = JSON.parse(normalized);

                        images.forEach(img => {
                            const item = {
                                logId,
                                originalUrl,
                                aspectRatio: img.aspect_ratio,
                                imageLink: img.image_link,
                            };
                            allImages.push(item);

                            if (!grouped[img.aspect_ratio]) {
                                grouped[img.aspect_ratio] = [];
                            }
                            grouped[img.aspect_ratio].push(item);
                        });
                    } catch (e) {
                        console.error('Parse error:', e);
                    }
                }
            });

            setHistoryData(allImages);
            setGroupedImages(grouped);
            setLoading(false);
        } catch (e) {
            console.error('Error fetching history:', e);
            setLoading(false);
        }
    };

    const getColorClasses = (ratio) => {
        return ASPECT_RATIO_COLORS[ratio] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    };

    const filteredImages = selectedRatio === 'all'
        ? historyData
        : groupedImages[selectedRatio] || [];

    const sortedRatios = Object.keys(groupedImages).sort();

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">
            {/* Actions Bar */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{historyData.length} images total</p>
                <button
                    onClick={fetchHistory}
                    className="px-4 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                >
                    Refresh
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <button
                    onClick={() => setSelectedRatio('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedRatio === 'all'
                            ? 'bg-violet-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    All ({historyData.length})
                </button>
                {sortedRatios.map(ratio => {
                    const colors = getColorClasses(ratio);
                    return (
                        <button
                            key={ratio}
                            onClick={() => setSelectedRatio(ratio)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                selectedRatio === ratio
                                    ? 'bg-violet-600 text-white'
                                    : `${colors.bg} ${colors.text} hover:opacity-80`
                            }`}
                        >
                            {ratio} ({groupedImages[ratio].length})
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                </div>
            ) : filteredImages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <Image className="w-16 h-16 mb-3 opacity-50" />
                    <p className="text-sm">No images found</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredImages.map((item, index) => {
                            const colors = getColorClasses(item.aspectRatio);
                            return (
                                <div
                                    key={index}
                                    className={`bg-white rounded-xl border ${colors.border} overflow-hidden hover:shadow-md transition-shadow cursor-pointer group`}
                                    onClick={() => setSelectedImage(item)}
                                >
                                    <div className="aspect-square flex items-center justify-center p-2 bg-gray-50">
                                        <img
                                            src={item.imageLink}
                                            alt={item.aspectRatio}
                                            className="max-w-full max-h-full object-contain rounded-lg"
                                        />
                                    </div>
                                    <div className={`px-3 py-2 ${colors.bg} flex items-center justify-between`}>
                                        <span className={`text-xs font-medium ${colors.text}`}>{item.aspectRatio}</span>
                                        <a
                                            href={item.imageLink}
                                            download
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1 hover:bg-white/50 rounded transition-colors"
                                        >
                                            <Download className={`w-4 h-4 ${colors.text}`} />
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

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
                        src={selectedImage.imageLink}
                        alt={selectedImage.aspectRatio}
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                        <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                            {selectedImage.aspectRatio}
                        </span>
                        <a
                            href={selectedImage.imageLink}
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

export default MyHistory;
