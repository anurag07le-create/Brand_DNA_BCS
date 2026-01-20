import React, { useState, useEffect } from 'react';
import { supabase, logAction } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Plus, User, Lock, Mail, Save, AlertCircle, RefreshCcw } from 'lucide-react';
import userAvatar from '../../assets/ToyFaces_Tansparent_BG_30.png';
import { getRandomMascot, getMascotUrl } from '../../utils/mascots';

const UserManagement = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        gender: 'male',
        email: '',
        password: '',
        spreadsheet_id: '',
        input_url_worksheet_id: '',
        campaign_ideas_id: '',
        creatives_id: '',
        animated_creatives_id: '',
        custom_creatives_id: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            if (err.status === 404 || (err.message && err.message.includes("relation"))) {
                setError('Table "users" not found. Please run the SQL setup script in Supabase.');
            } else {
                setError('Failed to load users: ' + (err.message || "Unknown error"));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Validation
            if (!formData.username || !formData.password || !formData.name || !formData.email) {
                alert('Please fill in all required fields');
                return;
            }

            // Generate Mascot
            const assignedMascot = getRandomMascot(formData.gender);

            // Create User
            const { data, error } = await supabase
                .from('users')
                .insert([{
                    name: formData.name,
                    username: formData.username,
                    gender: formData.gender,
                    avatar_path: assignedMascot, // Save Mascot Filename
                    email: formData.email,
                    password: formData.password, // Ideally hashed
                    spreadsheet_id: formData.spreadsheet_id,
                    input_url_worksheet_id: formData.input_url_worksheet_id,
                    campaign_ideas_id: formData.campaign_ideas_id,
                    creatives_id: formData.creatives_id,
                    animated_creatives_id: formData.animated_creatives_id,
                    custom_creatives_id: formData.custom_creatives_id,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;

            // Trigger Webhook
            try {
                const webhookUrl = 'https://studio.pucho.ai/api/v1/webhooks/Y8RjQA9hYzqyVzHfc7QiJ';
                const createdUser = data[0];

                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: 'USER_CREATED',
                        user_id: createdUser.id,
                        ...formData,
                        created_at: createdUser.created_at
                    })
                });
                console.log('Webhook triggered successfully');
            } catch (webhookError) {
                console.error('Webhook failed:', webhookError);
                // Don't block the UI success flow if webhook fails, but log it
            }

            // Log Action
            await logAction('CREATE_USER', `Created user ${formData.username}`, user?.username || 'admin');

            // Reset & Reload
            setFormData({
                name: '', username: '', gender: 'male', email: '', password: '',
                spreadsheet_id: '', input_url_worksheet_id: '', campaign_ideas_id: '',
                creatives_id: '', animated_creatives_id: '', custom_creatives_id: ''
            });
            setIsCreating(false);
            fetchUsers();
            alert('User created successfully');

        } catch (err) {
            console.error('Error creating user:', err);
            alert('Failed to create user: ' + err.message);
        }
    };

    const handleDelete = async (id, username) => {
        if (!window.confirm(`Are you sure you want to delete user ${username}?`)) return;

        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await logAction('DELETE_USER', `Deleted user ${username}`, user?.username || 'admin');
            fetchUsers();
        } catch (err) {
            console.error('Error deleting user:', err);
            alert('Failed to delete user');
        }
    };

    const handleMigrateAvatars = async () => {
        if (!window.confirm("Assign random mascots to all users missing an avatar?")) return;
        setLoading(true);
        try {
            const { data: allUsers } = await supabase.from('users').select('*');
            let updatedCount = 0;

            for (const u of allUsers) {
                if (!u.avatar_path) {
                    const newAvatar = getRandomMascot(u.gender || 'male');
                    await supabase.from('users').update({ avatar_path: newAvatar }).eq('id', u.id);
                    updatedCount++;
                }
            }
            await logAction('MIGRATE_AVATARS', `Assigned avatars to ${updatedCount} users`, user?.username || 'admin');
            alert(`Successfully assigned avatars to ${updatedCount} users.`);
            fetchUsers();
        } catch (error) {
            console.error(error);
            alert("Migration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500">Manage system users and access</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleMigrateAvatars}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCcw size={18} /> Migrate Avatars
                    </button>
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        {isCreating ? 'Cancel' : <><Plus size={18} /> Add User</>}
                    </button>
                </div>
            </div>

            {/* Create User Form */}
            {isCreating && (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8 animate-fade-in">
                    <h3 className="text-lg font-semibold mb-4">Create New User</h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Gender</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none appearance-none bg-white"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Username</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                        placeholder="johndoe"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </div>



                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-6 py-2 bg-pucho-purple text-white rounded-lg hover:bg-purple-700 transition-colors bg-purple-600"
                            >
                                <Save size={18} /> Create User
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Users List */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading users...</div>
            ) : error ? (
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col items-center text-center">
                    <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                    <h3 className="text-lg font-medium text-red-900">Error</h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={fetchUsers}
                        className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No users found</h3>
                    <p className="text-gray-500">Create the first user to get started.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={u.avatar_path ? getMascotUrl(u.avatar_path) : userAvatar}
                                                alt={u.username}
                                                className="w-10 h-10 rounded-full bg-gray-100 object-cover"
                                            />
                                            <span className="font-medium text-gray-900">{u.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{u.username}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{u.email || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(u.id, u.username)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete User"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
