import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Target, Plus, X, Loader2, Building2, Globe, FileText, ExternalLink } from 'lucide-react';
import { fetchCompetitorAnalysisReports } from '../services/googleSheetsService';

const CompetitorAnalysis = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data State
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewModal, setPreviewModal] = useState({ isOpen: false, title: '', content: '' });

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        setLoading(true);
        try {
            const data = await fetchCompetitorAnalysisReports();
            setReports(data);
        } catch (error) {
            console.error("Failed to load reports:", error);
        } finally {
            setLoading(false);
        }
    };

    const openPreview = (title, content) => {
        setPreviewModal({ isOpen: true, title, content });
    };

    const closePreview = () => {
        setPreviewModal({ ...previewModal, isOpen: false });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('companyName', companyName);
        formData.append('websiteUrl', websiteUrl);

        try {
            const response = await fetch('https://studio.pucho.ai/api/v1/webhooks/KUJqv8QGxlBsbjkDZrPoz', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert("Competitor analysis request sent successfully!");
                setIsModalOpen(false);
                setCompanyName('');
                setWebsiteUrl('');
                // Optionally reload reports after submission if it was instant, but likely strictly async
            } else {
                alert("Failed to send request. Please try again.");
                console.error("Webhook error:", await response.text());
            }
        } catch (error) {
            console.error("Submission error:", error);
            alert("An error occurred. Please check console.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] py-6 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">

                {/* Header Action */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Competitor Analysis Reports</h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-white bg-[#6366f1] rounded-xl hover:bg-[#5558dd] transition-all shadow-md hover:shadow-lg ring-offset-2 focus:ring-2 ring-indigo-500"
                    >
                        <Plus className="w-5 h-5 mr-1.5" />
                        New Analysis
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : reports.length === 0 ? (
                    /* Empty State */
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                            <Target size={40} className="text-indigo-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Analyses Yet</h3>
                        <p className="text-gray-500 max-w-sm">
                            Start by adding a competitor to generate detailed insights and comparisons.
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-6 inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                            Add First Competitor
                        </button>
                    </div>
                ) : (
                    /* Grid of Reports */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reports.map((report, index) => (
                            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 group">
                                <div className="p-6 pb-4 flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0 group-hover:scale-105 transition-transform duration-300">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 truncate" title={report.companyName}>
                                            {report.companyName}
                                        </h3>
                                        <a
                                            href={report.websiteUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors truncate"
                                        >
                                            <Globe className="w-3 h-3" />
                                            {report.websiteUrl}
                                        </a>
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 mt-auto">
                                    <button
                                        onClick={() => openPreview(`Analysis: ${report.companyName}`, report.htmlContent)}
                                        className="w-full py-2.5 px-4 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 font-medium rounded-xl transition-all flex items-center justify-center text-sm shadow-sm"
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        View Analysis
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal for New Analysis */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Competitor Analysis Agent</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Company Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#6366f1] focus:border-[#6366f1] outline-none transition-all placeholder:text-gray-400"
                                        placeholder="e.g. Acme Corp"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Website URL <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="url"
                                        required
                                        value={websiteUrl}
                                        onChange={(e) => setWebsiteUrl(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#6366f1] focus:border-[#6366f1] outline-none transition-all placeholder:text-gray-400"
                                        placeholder="e.g. https://example.com"
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
                                        "Submit"
                                    )}
                                </button>
                            </div>

                            <div className="text-center">
                                <span className="text-xs text-gray-400">Built with PuchoAI</span>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Preview Modal */}
            {previewModal.isOpen && createPortal(
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
                            <h3 className="text-lg font-bold text-gray-900">{previewModal.title}</h3>
                            <button
                                onClick={closePreview}
                                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-0 overflow-y-auto custom-scrollbar bg-white flex-1 relative">
                            <div
                                className="prose prose-sm md:prose-base max-w-none p-8"
                                dangerouslySetInnerHTML={{ __html: previewModal.content }}
                            />
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end">
                            <button
                                onClick={closePreview}
                                className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
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

export default CompetitorAnalysis;
