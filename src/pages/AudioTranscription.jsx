import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mic, FileText, Loader2, X, FileAudio } from 'lucide-react';
import { fetchAudioTranscriptionSummaries } from '../services/googleSheetsService';

const AudioTranscription = () => {
    const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
    const [audioFile, setAudioFile] = useState(null);
    const [audioLanguage, setAudioLanguage] = useState('');
    const [isSubmittingAudio, setIsSubmittingAudio] = useState(false);

    const [summaries, setSummaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [previewModal, setPreviewModal] = useState({ isOpen: false, title: '', content: '' });

    const openPreview = (title, content) => {
        setPreviewModal({ isOpen: true, title, content });
    };

    const closePreview = () => {
        setPreviewModal({ ...previewModal, isOpen: false });
    };

    useEffect(() => {
        const loadSummaries = async () => {
            try {
                const data = await fetchAudioTranscriptionSummaries();
                setSummaries(data);
            } catch (err) {
                console.error("Failed to load summaries:", err);
                setError("Failed to load summaries.");
            } finally {
                setLoading(false);
            }
        };

        loadSummaries();
    }, []);

    const handleAudioSubmit = async (e) => {
        e.preventDefault();
        if (!audioFile || !audioLanguage) {
            alert("Please provide both an audio file and a language.");
            return;
        }

        setIsSubmittingAudio(true);

        // Generate 25-digit alphanumeric trigger_id
        const generateTriggerId = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < 25; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };

        const triggerId = generateTriggerId();
        const fileName = audioFile.name;

        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('language', audioLanguage);
        formData.append('fileName', fileName);
        formData.append('trigger_id', triggerId);

        try {
            const response = await fetch('https://studio.pucho.ai/api/v1/webhooks/3wJ7qH0E06qpIsuoCaSJ0', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert("Audio sent for transcription successfully!");
                setIsAudioModalOpen(false);
                setAudioFile(null);
                setAudioLanguage('');
            } else {
                alert("Failed to send audio. Please try again.");
                console.error("Webhook error:", await response.text());
            }
        } catch (error) {
            console.error("Submission error:", error);
            alert("An error occurred. Please check console.");
        } finally {
            setIsSubmittingAudio(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] py-6 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header Action */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => setIsAudioModalOpen(true)}
                        className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-pink-600 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg ring-offset-2 focus:ring-2 ring-red-500"
                    >
                        <Mic className="w-4 h-4 mr-2" />
                        Transcribe Audio
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
                        {error}
                    </div>
                ) : summaries.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                            <Mic size={32} className="text-gray-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Audio Transcription Summary</h2>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Upload audio files to generate transcriptions and summaries.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {summaries.map((item, index) => (
                            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 group">
                                {/* Card Header */}
                                <div className="p-6 pb-4 flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0 group-hover:scale-105 transition-transform duration-300">
                                        <FileAudio className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 truncate" title={item.fileName}>
                                            {item.fileName}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-xs font-mono border border-gray-200">
                                                ID: {item.triggerId ? item.triggerId.slice(0, 8) + '...' : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Preview */}
                                <div className="px-6 mb-6 flex-1">
                                    <div className="prose prose-sm max-w-none">
                                        <div
                                            className="text-gray-500 text-sm leading-relaxed line-clamp-3"
                                            dangerouslySetInnerHTML={{ __html: item.summary }}
                                        />
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex gap-3 mt-auto">
                                    <button
                                        onClick={() => openPreview("Audio Transcription Summary", item.summary)}
                                        className="flex-1 py-2.5 px-3 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 font-medium rounded-xl transition-all flex items-center justify-center text-sm shadow-sm"
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        Summary
                                    </button>

                                    {item.transcription && (
                                        <button
                                            onClick={() => openPreview("Full Transcription", item.transcription)}
                                            className="flex-1 py-2.5 px-3 bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700 hover:text-purple-700 font-medium rounded-xl transition-all flex items-center justify-center text-sm shadow-sm"
                                        >
                                            <Mic className="w-4 h-4 mr-2" />
                                            Transcript
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Audio Upload Modal */}
            {
                isAudioModalOpen && createPortal(
                    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">Transcribe Audio</h3>
                                <button
                                    onClick={() => setIsAudioModalOpen(false)}
                                    className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAudioSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Audio File</label>
                                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-red-400 hover:bg-red-50/30 transition-all text-center">
                                        <input
                                            type="file"
                                            accept="audio/*"
                                            required
                                            onChange={(e) => setAudioFile(e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="flex flex-col items-center pointer-events-none">
                                            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {audioFile ? audioFile.name : "Click to upload audio"}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">MP3, WAV, M4A up to 25MB</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. English, Hindi, Spanish"
                                        value={audioLanguage}
                                        onChange={(e) => setAudioLanguage(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder:text-gray-400"
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmittingAudio}
                                        className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {isSubmittingAudio ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                                Processing...
                                            </>
                                        ) : (
                                            "Start Transcription"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )
            }
            {/* Content Preview Modal */}
            {previewModal.isOpen && createPortal(
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <h3 className="text-lg font-bold text-gray-900">{previewModal.title}</h3>
                            <button
                                onClick={closePreview}
                                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scrollbar bg-gray-50">
                            <div
                                className="prose prose-sm max-w-none text-gray-600 space-y-4 [&_b]:text-gray-900 [&_b]:font-semibold whitespace-pre-line bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
                                dangerouslySetInnerHTML={{ __html: previewModal.content }}
                            />
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex justify-end">
                            <button
                                onClick={closePreview}
                                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div >
    );
};

export default AudioTranscription;
