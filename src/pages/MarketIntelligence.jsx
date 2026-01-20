import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

const MarketIntelligence = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        clientName: '',
        brandProduct: '',
        problemStatement: '',
        targetConsumer: '',
        singleMindedProposition: '',
        desiredAction: '',
        toneCommunication: '',
        functionalReasons: '',
        emotionalReasons: '',
        kpis: '',
        dosDonots: '',
        budget: '',
        otherInfo: '',
        complications: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const generateRandomKey = (length) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const secretKey = generateRandomKey(25);
        const payload = {
            ...formData,
            key: secretKey
        };

        try {
            const response = await fetch('https://studio.pucho.ai/api/v1/webhooks/gMMlCdqru9QDtPM0Xs6LX', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log('Webhook success:', payload);
                alert('Report generation started successfully!');
            } else {
                console.error('Webhook failed:', response.statusText);
                alert('Failed to start report generation. Please try again.');
            }
        } catch (error) {
            console.error('Webhook error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Reusable Label Component
    const Label = ({ children }) => (
        <label className="block text-sm font-semibold text-gray-900 mb-2">
            {children}
        </label>
    );

    // Reusable Input Component
    const Input = ({ name, placeholder, value, onChange }) => (
        <input
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all duration-200 text-gray-900 placeholder:text-gray-400"
        />
    );

    // Reusable Textarea Component
    const Textarea = ({ name, placeholder, value, onChange, rows = 3, helpText }) => (
        <div className="space-y-2">
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                rows={rows}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all duration-200 text-gray-900 placeholder:text-gray-400 resize-none"
            />
            {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fafafa] py-6 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header Removed - Moved to Global Header */}

                {/* Main Form Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-10">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Core Details Section */}
                        <section className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
                                1. Core Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label>Client Name</Label>
                                    <Input name="clientName" value={formData.clientName} onChange={handleChange} placeholder="e.g. Acme Corp" />
                                </div>
                                <div>
                                    <Label>Brand & Product</Label>
                                    <Input name="brandProduct" value={formData.brandProduct} onChange={handleChange} placeholder="e.g. SuperWidget 3000" />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Problem Statement</Label>
                                    <Textarea name="problemStatement" value={formData.problemStatement} onChange={handleChange} placeholder="What is the business problem we are solving?" />
                                </div>
                            </div>
                        </section>

                        {/* Strategy Section */}
                        <section className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
                                2. Strategic Insight
                            </h2>
                            <div>
                                <Label>Target Consumer</Label>
                                <Textarea name="targetConsumer" value={formData.targetConsumer} onChange={handleChange} placeholder="Demographics, psychographics, behaviors..." rows={4} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label>Single-Minded Proposition</Label>
                                    <Textarea name="singleMindedProposition" value={formData.singleMindedProposition} onChange={handleChange} placeholder="The one key message..." />
                                </div>
                                <div>
                                    <Label>Desired Action</Label>
                                    <Textarea name="desiredAction" value={formData.desiredAction} onChange={handleChange} placeholder="What should they do?" />
                                </div>
                            </div>
                        </section>

                        {/* Execution Section */}
                        <section className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
                                3. Execution & Context
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label>Tone of Communication</Label>
                                    <Input name="toneCommunication" value={formData.toneCommunication} onChange={handleChange} placeholder="e.g. Witty, Professional" />
                                </div>
                                <div>
                                    <Label>Budget</Label>
                                    <Input name="budget" value={formData.budget} onChange={handleChange} placeholder="e.g. $50,000" />
                                </div>
                                <div>
                                    <Label>Functional Reasons to Believe</Label>
                                    <Textarea name="functionalReasons" value={formData.functionalReasons} onChange={handleChange} placeholder="Key features & specs..." />
                                </div>
                                <div>
                                    <Label>Emotional Reasons to Believe</Label>
                                    <Textarea name="emotionalReasons" value={formData.emotionalReasons} onChange={handleChange} placeholder="How does it make them feel?" />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>KPIs for Success</Label>
                                    <Textarea name="kpis" value={formData.kpis} onChange={handleChange} placeholder="Metrics for success..." rows={2} />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Competition / Market Landscape</Label>
                                    <Textarea name="complications" value={formData.complications} onChange={handleChange} placeholder="Competitors and market context..." rows={3} />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Do's & Don'ts</Label>
                                    <Textarea name="dosDonots" value={formData.dosDonots} onChange={handleChange} placeholder="Guidelines and mandatories..." rows={2} />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Other Key Information</Label>
                                    <Textarea name="otherInfo" value={formData.otherInfo} onChange={handleChange} placeholder="Any other relevant details..." rows={3} />
                                </div>
                            </div>
                        </section>

                        {/* Submit Action */}
                        <div className="pt-6 border-t border-gray-100 flex items-center justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-4 bg-black hover:bg-gray-800 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Sparkles className="w-5 h-5 animate-spin" />
                                        <span>Generating Report...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Get Report</span>
                                        <Send className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default MarketIntelligence;
