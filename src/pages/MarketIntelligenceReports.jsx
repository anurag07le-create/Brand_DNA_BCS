import React from 'react';
import { FileText } from 'lucide-react';

const MarketIntelligenceReports = () => {
    return (
        <div className="min-h-screen bg-[#fafafa] py-6 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                        <FileText size={32} className="text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">No Reports Generated Yet</h2>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Generate your first market intelligence report to see it listed here.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MarketIntelligenceReports;
