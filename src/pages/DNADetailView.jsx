import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Globe, MoreHorizontal, User, Plus, Sparkles, Upload, Palette, Type, Shield, Bot, Zap, Linkedin, Twitter, Instagram, Facebook, Youtube, Github, Disc as Discord } from 'lucide-react';
import { useBrands } from '../context/BrandContext';

const DNADetailView = () => {
    const navigate = useNavigate();
    const { brandName } = useParams();
    const { brands, loading } = useBrands();

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pucho-purple"></div>
            </div>
        );
    }

    // Find dynamic brand data based on slug (brandName param)
    const brandData = brands.find(b => b.slug === brandName) || brands[0];

    if (!brandData) return null;

    return (
        <div className="animate-fade-in space-y-8 pb-12">

            {/* Context Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            {brandData.name} <span className="text-gray-300 font-normal">/</span> <span className="text-pucho-purple/60 text-lg">Brand DNA</span>
                        </h1>
                    </div>
                </div>
            </div>

            {/* The Bento Grid DNA Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* 1. Main Identity Hero - Large Span */}
                <div className="lg:col-span-8 bg-white rounded-[32px] overflow-hidden border border-gray-100 relative shadow-md group">
                    {/* Subtle Gradient Glow */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#A0D296]/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-[#A0D296]/20 transition-colors"></div>

                    <div className="relative p-10 flex flex-col h-full min-h-[400px]">
                        <div className="flex items-start justify-between">
                            <div className="bg-gray-50 backdrop-blur-md rounded-2xl px-4 py-2 border border-gray-200 flex items-center gap-2">
                                <Shield size={14} className="text-[#A0D296]" />
                                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">Core Identity</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {brandData.socials?.linkedin && (
                                    <a href={brandData.socials.linkedin} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#A0D296] transition-colors">
                                        <Linkedin size={18} />
                                    </a>
                                )}
                                {brandData.socials?.twitter && (
                                    <a href={brandData.socials.twitter} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#A0D296] transition-colors">
                                        <Twitter size={18} />
                                    </a>
                                )}
                                {brandData.socials?.instagram && (
                                    <a href={brandData.socials.instagram} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#A0D296] transition-colors">
                                        <Instagram size={18} />
                                    </a>
                                )}
                                {brandData.socials?.facebook && (
                                    <a href={brandData.socials.facebook} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#A0D296] transition-colors">
                                        <Facebook size={18} />
                                    </a>
                                )}
                                {brandData.socials?.youtube && (
                                    <a href={brandData.socials.youtube} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#A0D296] transition-colors">
                                        <Youtube size={18} />
                                    </a>
                                )}
                                {brandData.socials?.github && (
                                    <a href={brandData.socials.github} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#A0D296] transition-colors">
                                        <Github size={18} />
                                    </a>
                                )}
                                {brandData.socials?.discord && (
                                    <a href={brandData.socials.discord} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#A0D296] transition-colors">
                                        <Discord size={18} />
                                    </a>
                                )}
                                {brandData.url && (
                                    <a href={brandData.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#A0D296] transition-colors">
                                        <Globe size={18} />
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="mt-auto space-y-6">
                            <div className="bg-gradient-to-br from-gray-50 to-gray-200 rounded-3xl p-8 w-[280px] h-[160px] flex items-center justify-center shadow-[inset_0_1px_4px_rgba(255,255,255,0.8),0_8px_20px_rgba(0,0,0,0.05)] border border-white/60 relative group-hover:shadow-lg transition-all">
                                <img src={brandData.logo} alt="Brand Logo" className="w-full h-full object-contain drop-shadow-sm relative z-10" />
                            </div>
                            <div>
                                <h1 className="text-[56px] font-bold text-gray-900 tracking-tight leading-none mb-4">{brandData.fullName}</h1>
                                <p className="text-xl text-gray-500 italic font-medium max-w-2xl leading-snug">"{brandData.tagline}"</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Strategy Matrix - Vertical Span */}
                <div className="lg:col-span-4 bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[#A0D296]">
                            <Bot size={18} />
                            <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold opacity-80">Mission Statement</h3>
                        </div>
                        <p className="text-[15px] text-gray-600 leading-relaxed font-medium">
                            {brandData.shortDescription}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400">Strategic Values</h3>
                        <div className="flex flex-wrap gap-2">
                            {brandData.values.map((v, i) => (
                                <span key={i} className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-[12px] text-gray-700 font-medium hover:bg-gray-100 transition-colors cursor-default">
                                    {v}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 mt-auto">
                        <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400">Tone Matrix</h3>
                        <p className="text-[13px] text-gray-400 font-medium">
                            {brandData.tone.join(' • ')}
                        </p>
                    </div>
                </div>

                {/* 2.5 Quick Facts - Vertical Span (New) */}
                <div className="lg:col-span-4 bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                        <Globe size={18} className="text-gray-400" />
                        <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">Quick Facts</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <h4 className="text-xs uppercase tracking-wider font-bold text-gray-400">Industry</h4>
                            <p className="text-lg text-gray-900 font-semibold">{brandData.industry || 'Not specified'}</p>
                        </div>

                        <div className="space-y-1">
                            <h4 className="text-xs uppercase tracking-wider font-bold text-gray-400">Location</h4>
                            <p className="text-lg text-gray-900 font-medium">
                                {[brandData.city, brandData.state, brandData.country].filter(Boolean).join(', ') || 'Global'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-gray-50">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Shield size={14} />
                            <span>Verified Entity</span>
                        </div>
                    </div>
                </div>

                {/* 3. Typography Card */}
                <div className="lg:col-span-4 bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm group">
                    <div className="flex items-center justify-between mb-6">
                        <Type size={18} className="text-gray-400" />
                        <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">Typography</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-end justify-between border-b border-gray-50 pb-4">
                            <div>
                                <h4 className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Heading</h4>
                                <p className="text-xl text-gray-900 font-bold leading-none">{brandData.headingFont}</p>
                            </div>
                            <span className="text-4xl font-bold text-gray-900/10">Aa</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <h4 className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Body</h4>
                                <p className="text-lg text-gray-900 font-medium leading-none">{brandData.bodyFont}</p>
                            </div>
                            <span className="text-4xl font-medium text-gray-900/10">Aa</span>
                        </div>
                    </div>
                </div>

                {/* 4. Vibe Check Matrix (Moved Up) */}
                <div className="lg:col-span-4 bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <Zap size={18} className="text-[#DEAE3D]" />
                        <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">Vibe Check</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {brandData.aesthetics.map((a, i) => (
                            <span key={i} className="px-4 py-2 bg-gray-50 rounded-lg text-[12px] text-gray-700 font-semibold border border-gray-100 hover:border-[#DEAE3D]/40 transition-all">
                                #{a}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 5. Color Palette Card (Full Width) */}
                <div className="lg:col-span-12 bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <Palette size={18} className="text-gray-400" />
                        <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">Spectrum</h3>
                    </div>
                    <div className="flex items-center gap-4 h-28">
                        {brandData.colors.map((color, i) => (
                            <div key={i} className="flex-1 h-full rounded-2xl relative group cursor-pointer border border-gray-100 transition-all hover:-translate-y-2 shadow-sm hover:shadow-lg" style={{ backgroundColor: color }}>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-2xl">
                                    <div className="bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-gray-900 uppercase tracking-wide shadow-sm">
                                        {color}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 6. Comprehensive Asset Gallery - Bottom Row */}
                <div className="lg:col-span-12 bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-[11px] uppercase tracking-[0.3em] font-black text-gray-400 mb-1">Visual Repository</h3>
                            <h2 className="text-2xl font-bold text-gray-900">Brand Artifacts</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-[1000px] overflow-y-auto custom-scrollbar pr-2">
                        {brandData.elements.map((img, i) => (
                            <div key={i} className="aspect-square bg-gray-50 rounded-[24px] border border-gray-100 overflow-hidden group cursor-pointer relative p-4 flex items-center justify-center hover:border-gray-200 transition-all duration-500">
                                <div className="absolute inset-0 bg-[#A0D296] opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                <img
                                    src={img.url || img}
                                    alt={`Asset ${i}`}
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                                />
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Footer Engagement */}
            <div className="bg-gray-50 rounded-[32px] p-8 flex items-center justify-between border border-gray-100">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center">
                        <Sparkles size={24} className="text-[#A0D296]" />
                    </div>
                    <div>
                        <h4 className="text-gray-900 font-bold">DNA Verified</h4>
                        <p className="text-sm text-gray-500">Your brand intelligence is locked and ready for campaign synthesis.</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/admin/agents', { state: { brand: brandData } })}
                    className="group flex items-center gap-3 text-black font-bold text-sm hover:translate-x-1 transition-transform"
                >
                    Start Generating <ArrowLeft size={18} className="rotate-180" />
                </button>
            </div>
        </div>
    );
};

export default DNADetailView;
