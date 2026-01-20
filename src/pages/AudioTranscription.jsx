import React from 'react';
import { Mic } from 'lucide-react';

const AudioTranscription = () => {
    return (
        <div className="min-h-screen bg-[#fafafa] py-6 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                        <Mic size={32} className="text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Audio Transcription Summary</h2>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Upload audio files to generate transcriptions and summaries. Module coming soon.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AudioTranscription;
