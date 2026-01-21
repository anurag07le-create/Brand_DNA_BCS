import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BrandProvider } from "./context/BrandContext";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import GenerateCreatives from "./pages/GenerateCreatives";

import CardsGrid from "./pages/CardsGrid";
import DNADetailView from "./pages/DNADetailView";

import CampaignIdeas from "./pages/CampaignIdeas";
import MarketIntelligence from "./pages/MarketIntelligence";
import MarketIntelligenceReports from "./pages/MarketIntelligenceReports";
import AudioTranscription from "./pages/AudioTranscription";
import CompetitorAnalysis from "./pages/CompetitorAnalysis";
import UserManagement from "./pages/admin/UserManagement";
import ActivityLogs from "./pages/admin/ActivityLogs";
import MomSummary from "./pages/MomSummary";

// GUARD: Protects routes from unauthenticated users
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-pucho-purple animate-pulse">Loading Pucho OS...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
};

const DummyPage = ({ title }) => (
    <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-subtle flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No Data Available</h3>
            <p className="text-gray-500 max-w-sm mt-2">This is a dummy page generated for layout demonstration purposes.</p>
        </div>
    </div>
);

const DefaultRedirect = () => {
    const { user, loading } = useAuth();
    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-gray-50"></div>;
    return user ? <Navigate to="/admin" replace /> : <Navigate to="/login" replace />;
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <BrandProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />

                        {/* Admin Area */}
                        <Route path="/admin" element={
                            <ProtectedRoute>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }>
                            <Route index element={<CardsGrid />} />
                            <Route path="dna/:brandName" element={<DNADetailView />} />
                            <Route path="agents" element={<CampaignIdeas />} />
                            <Route path="market-intelligence" element={<MarketIntelligence />} />
                            <Route path="market-intelligence-reports" element={<MarketIntelligenceReports />} />
                            <Route path="audio-transcription" element={<AudioTranscription />} />
                            <Route path="chat" element={<GenerateCreatives />} />
                            <Route path="flow" element={<CardsGrid />} />
                            <Route path="competitor-analysis" element={<CompetitorAnalysis />} />
                            <Route path="mom-summary" element={<MomSummary />} />

                            <Route path="activity-logs" element={<ActivityLogs />} />
                            <Route path="mcp" element={<DummyPage title="MCP Controls" />} />
                            <Route path="knowledge" element={<DummyPage title="Knowledge Base" />} />
                            <Route path="tools" element={<DummyPage title="System Tools" />} />
                            <Route path="marketplace" element={<DummyPage title="Marketplace" />} />
                            <Route path="users" element={<UserManagement />} />
                        </Route>

                        {/* Fallback - Smart Redirect based on Auth */}
                        <Route path="*" element={<DefaultRedirect />} />
                    </Routes>
                </BrandProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
