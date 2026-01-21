import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Loader2, Target, TrendingUp, DollarSign, Building2, Quote, ArrowRight, Code, X, Download, ExternalLink } from 'lucide-react';
import { fetchMarketIntelligenceReports } from '../services/googleSheetsService';

const MarketIntelligenceReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        const loadReports = async () => {
            try {
                const data = await fetchMarketIntelligenceReports();
                setReports(data);
            } catch (err) {
                console.error("Failed to load reports:", err);
                setError("Failed to load reports. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        loadReports();
    }, []);

    const openPreview = (report) => {
        setSelectedReport(report);
    };

    const closePreview = () => {
        setSelectedReport(null);
    };



    if (loading) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Gathering market insights...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg shadow-indigo-100/50 border border-red-100">
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-6 h-6 text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to Load Reports</h3>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] py-10 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto">

                {/* Header Actions */}


                {reports.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-dashed border-gray-300 p-20 text-center space-y-6 max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <FileText size={40} className="text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">No Reports Available</h2>
                            <p className="text-gray-500 mt-2 max-w-md mx-auto">
                                Connect your data source to start generating detailed market intelligence reports.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {reports.map((report, index) => (
                            <div key={index} className="group bg-white rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-indigo-100 transition-all duration-300 flex flex-col h-full overflow-hidden">
                                {/* Header Section */}
                                <div className="p-6 pb-4 border-b border-gray-50 bg-gradient-to-br from-white to-gray-50/50">
                                    <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                                        {report.brandProduct || 'Untitled Product'}
                                    </h3>
                                </div>

                                {/* Spacer/Body removed, just flexible space if needed or remove entirely */}
                                <div className="flex-1"></div>

                                {/* Actions Footer */}
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between group-hover:bg-indigo-50/30 transition-colors gap-3">
                                    {/* Download Button */}
                                    {report.reportLink && (
                                        <a
                                            href={report.reportLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download // Added specific download attribute functionality if it's a direct file
                                            className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-100 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
                                            title="Download Report"
                                        >
                                            <Download className="w-4 h-4 mr-1.5" />
                                            Download
                                        </a>
                                    )}

                                    {/* Preview/Code Button */}
                                    {report.htmlContent && (
                                        <button
                                            onClick={() => openPreview(report)}
                                            className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
                                            title="Preview Report"
                                        >
                                            <Code className="w-4 h-4 mr-1.5" />
                                            Preview
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}



                {/* Full Screen Preview Modal */}
                {selectedReport && createPortal(
                    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white w-[95vw] h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="relative z-10 shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-none">
                                            {selectedReport.brandProduct}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">Report Preview</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {selectedReport.reportLink && (
                                        <a
                                            href={selectedReport.reportLink}
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                                        >
                                            <Download className="w-4 h-4 mr-1.5" />
                                            Download
                                        </a>
                                    )}
                                    <button
                                        onClick={closePreview}
                                        className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body (Iframe) */}
                            <div className="flex-1 bg-gray-50 p-0 overflow-hidden relative">
                                <iframe
                                    srcDoc={selectedReport.htmlContent}
                                    title="Report Preview"
                                    className="w-full h-full border-0"
                                    sandbox="allow-scripts allow-same-origin"
                                />
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
};

export default MarketIntelligenceReports;
