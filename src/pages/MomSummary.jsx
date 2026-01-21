import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ClipboardList, Plus, X, Loader2, FileText, Send, Calendar, Clock, Eye } from 'lucide-react';
import { fetchMomSummaries } from '../services/googleSheetsService';

const MomSummary = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [meetingTitle, setMeetingTitle] = useState('');
    const [meetingDate, setMeetingDate] = useState('');
    const [meetingTime, setMeetingTime] = useState('');
    const [meetingNotes, setMeetingNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data State
    const [summaries, setSummaries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [previewModal, setPreviewModal] = useState({ isOpen: false, title: '', content: '' });

    // Fetch Data on Mount
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const data = await fetchMomSummaries();
            setSummaries(data);
            setIsLoading(false);
        };
        loadData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('meeting_title', meetingTitle);
        formData.append('meeting_date', meetingDate);
        formData.append('meeting_time', meetingTime);
        formData.append('meeting_notes', meetingNotes);

        try {
            const response = await fetch('https://studio.pucho.ai/api/v1/webhooks/KiYaHcJAltduXjM7tdYYH', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert("Meeting notes submitted successfully!");
                setIsModalOpen(false);
                setMeetingTitle('');
                setMeetingDate('');
                setMeetingTime('');
                setMeetingNotes('');
                // Optionally reload data here if the webhook updates the sheet immediately
            } else {
                const errorText = await response.text();
                console.error("Webhook error:", errorText);
                alert("Failed to submit notes. Please try again.");
            }
        } catch (error) {
            console.error("Submission error:", error);
            alert("An error occurred. Please check console.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openPreview = (title, content) => {
        setPreviewModal({ isOpen: true, title, content });
    };

    const closePreview = () => {
        setPreviewModal({ isOpen: false, title: '', content: '' });
    };

    return (
        <div className="min-h-screen bg-[#fafafa] py-6 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">MOM Summary</h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-white bg-[#6366f1] rounded-xl hover:bg-[#5558dd] transition-all shadow-md hover:shadow-lg ring-offset-2 focus:ring-2 ring-indigo-500"
                    >
                        <Plus className="w-5 h-5 mr-1.5" />
                        New Summary
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px]">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                        <p className="text-gray-500">Loading summaries...</p>
                    </div>
                ) : summaries.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                            <ClipboardList size={40} className="text-indigo-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Summaries Yet</h3>
                        <p className="text-gray-500 max-w-sm">
                            Submit your first meeting notes to generate a summary.
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-6 inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                            Create First Summary
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {summaries.map((item, index) => (
                            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden flex flex-col h-full group">
                                <div className="p-6 flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        {item.date && (
                                            <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {item.date}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2" title={item.title}>
                                        {item.title}
                                    </h3>

                                    {item.time && (
                                        <div className="text-xs text-gray-500 flex items-center mb-3">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {item.time}
                                        </div>
                                    )}

                                    <div className="text-sm text-gray-600 line-clamp-3 mb-4">
                                        {/* Display snippet of content if HTML, strip tags roughly for preview */}
                                        {item.summaryContent.replace(/<[^>]*>?/gm, '').substring(0, 150)}...
                                    </div>
                                </div>

                                <div className="p-4 border-t border-gray-100 bg-gray-50/50 mt-auto">
                                    <button
                                        onClick={() => openPreview(item.title, item.summaryContent)}
                                        className="w-full py-2.5 px-4 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 font-medium rounded-xl transition-all flex items-center justify-center shadow-sm text-sm"
                                    >
                                        <Eye className="w-4 h-4 mr-2 text-indigo-500" />
                                        Preview Summary
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Submission Modal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">New Meeting Summary</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Meeting Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Meeting Title
                                </label>
                                <input
                                    type="text"
                                    value={meetingTitle}
                                    onChange={(e) => setMeetingTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#6366f1] focus:border-[#6366f1] outline-none transition-all placeholder:text-gray-400 text-sm"
                                    placeholder="e.g. Weekly Sync"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        value={meetingDate}
                                        onChange={(e) => setMeetingDate(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#6366f1] focus:border-[#6366f1] outline-none transition-all text-sm text-gray-600"
                                    />
                                </div>
                                {/* Time */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Time
                                    </label>
                                    <input
                                        type="time"
                                        value={meetingTime}
                                        onChange={(e) => setMeetingTime(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#6366f1] focus:border-[#6366f1] outline-none transition-all text-sm text-gray-600"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Meeting Notes <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <textarea
                                        required
                                        rows={6}
                                        value={meetingNotes}
                                        onChange={(e) => setMeetingNotes(e.target.value)}
                                        className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#6366f1] focus:border-[#6366f1] outline-none transition-all placeholder:text-gray-400 resize-none text-sm"
                                        placeholder="Paste your raw meeting notes here..."
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3 px-4 bg-[#6366f1] hover:bg-[#5558dd] text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Generate Summary
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

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
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <div
                                className="prose prose-sm max-w-none text-gray-600 space-y-4 [&_b]:text-gray-900 [&_b]:font-semibold whitespace-pre-line"
                                dangerouslySetInnerHTML={{ __html: previewModal.content?.trim() }}
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
        </div>
    );
};

export default MomSummary;
