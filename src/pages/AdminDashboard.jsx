import React, { useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import Header from "../components/dashboard/Header";
import { Outlet, useOutletContext, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

const AdminDashboard = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const location = useLocation();

    return (
        <div className="flex h-screen bg-pucho-light overflow-hidden font-sans text-gray-900">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar: Responsive */}
            <Sidebar isMobileOpen={isSidebarOpen} setIsMobileOpen={setIsSidebarOpen} />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col ml-0 lg:ml-[240px] overflow-hidden relative transition-all duration-300">
                {/* Header: Sticky Top */}
                <Header onMenuClick={() => setIsSidebarOpen(true)} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative z-10">
                    <div className="w-full h-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="w-full h-full"
                            >
                                <Outlet context={{ searchQuery }} />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
