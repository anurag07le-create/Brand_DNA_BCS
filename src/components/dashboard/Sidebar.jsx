import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/pucho_logo_sidebar_new.png';
import userAvatar from '../../assets/ToyFaces_Tansparent_BG_30.png';
import { getMascotUrl } from '../../utils/mascots';

import { Dna, Megaphone, Palette, FolderOpen, Activity, Plug, BookOpen, Wrench, Store, LogOut, Users, LineChart, FileText, Mic } from 'lucide-react';
import { useBrands } from '../../context/BrandContext';

const Sidebar = ({ isMobileOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();
    const { brands } = useBrands();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Menu items configuration
    const allMenuItems = [
        { name: 'Generate Brand DNA', icon: Dna, path: '/admin' },
        { name: 'Get Campaign Ideas', icon: Megaphone, path: '/admin/agents' },
        { name: 'Market Intelligence', icon: LineChart, path: '/admin/market-intelligence' },
        { name: 'Market Intelligence reports', icon: FileText, path: '/admin/market-intelligence-reports' },
        { name: 'Audio Transcription Summary', icon: Mic, path: '/admin/audio-transcription' },
        { name: 'Generate Creatives', icon: Palette, path: '/admin/chat' },
        { name: 'User Management', icon: Users, path: '/admin/users', adminOnly: true },
        { name: 'Activity Logs', icon: Activity, path: '/admin/activity-logs', adminOnly: true },
        {
            name: 'My DNAs',
            icon: FolderOpen,
            path: '/admin/flow',
            subItems: brands.map(brand => ({
                name: brand.name,
                path: `/admin/dna/${brand.slug}`,
                logo: brand.logo
            }))
        },
    ];

    // Filter menu based on role/username
    const menuItems = allMenuItems.filter(item => {
        if (item.adminOnly) {
            return user?.username === 'admin007';
        }
        return true;
    });

    return (
        <aside
            className={`
                w-[240px] h-screen bg-white border-r border-gray-100 flex flex-col fixed inset-y-0 left-0 z-30
                transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}
        >
            {/* Logo */}
            <div className="pl-8 pt-3 pb-2"> {/* Minor padding adjustment */}
                <div className="flex items-center gap-2">
                    <img src={logo} alt="Pucho" className="h-[34px] w-auto" />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => (
                    <React.Fragment key={item.name}>
                        <NavLink
                            to={item.path}
                            end={item.path === '/admin'}
                            className={({ isActive }) => `
                                flex items-center gap-[10px] px-[12px] h-[40px] rounded-[22px] text-[14px] font-medium transition-all duration-200 border
                                ${isActive
                                    ? 'bg-[rgba(160,210,150,0.1)] border-transparent text-black'
                                    : 'bg-transparent border-transparent text-black hover:border-[rgba(160,210,150,0.3)]'
                                }
                            `}
                        >
                            {/* Render Icon Component */}
                            <item.icon className="w-5 h-5" strokeWidth={1.5} />
                            <span className="truncate">{item.name}</span>
                        </NavLink>

                        {/* Sub Items - Only show if parent or sub-item is active */}
                        {item.subItems && (
                            location.pathname === item.path ||
                            item.subItems.some(sub => location.pathname === sub.path)
                        ) && (
                                <div className="pl-9 mt-1 space-y-1">
                                    {item.subItems.map((subItem) => (
                                        <NavLink
                                            key={subItem.name}
                                            to={subItem.path}
                                            className={({ isActive }) => `
                                            flex items-center gap-2 h-[32px] px-3 rounded-xl text-[13px] font-medium transition-all duration-200
                                            ${isActive
                                                    ? 'bg-gray-100 text-black font-semibold'
                                                    : 'text-gray-500 hover:text-black hover:bg-gray-50'
                                                }
                                        `}
                                        >
                                            {subItem.logo && (
                                                <img
                                                    src={subItem.logo}
                                                    alt=""
                                                    className="w-4 h-4 rounded-full object-contain bg-white border border-gray-100 flex-shrink-0"
                                                />
                                            )}
                                            <span className="truncate">{subItem.name}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            )}
                    </React.Fragment>
                ))}
            </nav>

            {/* User Profile (Bottom) */}
            <div className="p-4 border-t border-gray-100 space-y-2">

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-3xl text-[14px] font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                    <LogOut className="w-5 h-5" strokeWidth={1.5} />
                    <span className="truncate">Log out</span>
                </button>

                <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors">
                    <img
                        src={user?.avatar_path ? getMascotUrl(user.avatar_path) : userAvatar}
                        alt="User"
                        className="w-8 h-10 object-cover"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
