import React, { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

interface User {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role?: string;
    approved?: boolean;
    rejected?: boolean;
}

interface Account {
    id: string;
    provider: string;
    accountId: string;
    scopes: string[];
}

export const ProfileManager: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        image: ''
    });

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        revokeOtherSessions: true
    });

    const [isChangingEmail, setIsChangingEmail] = useState(false);
    const [emailData, setEmailData] = useState({
        newEmail: ''
    });

    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [deleteData, setDeleteData] = useState({
        password: '',
        confirmText: ''
    });

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setLoading(true);
            const session = await authClient.getSession();
            if (session.data?.user) {
                setUser(session.data.user);
                setProfileData({
                    name: session.data.user.name || '',
                    email: session.data.user.email || '',
                    image: session.data.user.image || ''
                });
            }

            // Load user accounts
            const accountsData = await authClient.listAccounts();
            if (accountsData.data) {
                setAccounts(accountsData.data);
            }
        } catch (err) {
            toast.error('Failed to load profile data');
            console.error('Error loading user data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await authClient.updateUser({
                name: profileData.name,
                image: profileData.image
            });

            if (result.error) {
                toast.error(result.error.message);
            } else {
                toast.success('Profile updated successfully');
                setIsEditingProfile(false);
                await loadUserData();
            }
        } catch (err) {
            toast.error('Failed to update profile');
            console.error('Error updating profile:', err);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        try {
            const result = await authClient.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
                revokeOtherSessions: passwordData.revokeOtherSessions
            });

            if (result.error) {
                toast.error(result.error.message);
            } else {
                toast.success('Password changed successfully');
                setIsChangingPassword(false);
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                    revokeOtherSessions: true
                });
            }
        } catch (err) {
            toast.error('Failed to change password');
            console.error('Error changing password:', err);
        }
    };

    const handleChangeEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await authClient.changeEmail({
                newEmail: emailData.newEmail,
                callbackURL: '/profile'
            });

            if (result.error) {
                toast.error(result.error.message);
            } else {
                toast.success('Verification email sent to your current email address');
                setIsChangingEmail(false);
                setEmailData({ newEmail: '' });
            }
        } catch (err) {
            toast.error('Failed to initiate email change');
            console.error('Error changing email:', err);
        }
    };

    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (deleteData.confirmText !== 'DELETE') {
            toast.error('Please type DELETE to confirm account deletion');
            return;
        }

        try {
            const result = await authClient.deleteUser({
                password: deleteData.password,
                callbackURL: '/'
            });

            if (result.error) {
                toast.error(result.error.message);
            } else {
                toast.success('Account deletion initiated. Please check your email for verification.');
                setIsDeletingAccount(false);
            }
        } catch (err) {
            toast.error('Failed to delete account');
            console.error('Error deleting account:', err);
        }
    };

    const handleUnlinkAccount = async (provider: string) => {
        try {
            const result = await authClient.unlinkAccount({
                providerId: provider
            });

            if (result.error) {
                toast.error(result.error.message);
            } else {
                toast.success('Account unlinked successfully');
                await loadUserData();
            }
        } catch (err) {
            toast.error('Failed to unlink account');
            console.error('Error unlinking account:', err);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-full bg-slate-50 overflow-x-hidden">
                <div className="w-full max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] mx-auto py-8 space-y-8 animate-pulse">
                    <div className="w-full h-24 bg-gradient-to-r from-slate-100 via-white to-slate-100 rounded-xl"></div>
                    <div className="w-full min-h-[85vh] bg-gradient-to-br from-slate-100 via-white to-slate-200 rounded-2xl p-8"></div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="w-full h-full bg-slate-50 overflow-x-hidden">
                <div className="w-full max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] mx-auto py-8">
                    <div className="w-full min-h-[85vh] bg-gradient-to-br from-slate-100 via-white to-slate-200 rounded-2xl p-8 flex flex-col justify-center items-center">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">Please log in to view your profile</h2>
                            <p className="text-slate-600">You need to be logged in to access your profile settings.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-slate-50 overflow-x-hidden">
            <div className="w-full max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] mx-auto py-8 space-y-8">
                {/* Header */}
                <div className="w-full bg-gradient-to-r from-slate-100 via-white to-slate-100 rounded-xl p-6">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Profile Management</h1>
                    <p className="text-slate-600">Manage your account settings and preferences</p>
                </div>

                {/* Profile Information */}
                <div className="w-full bg-gradient-to-br from-slate-100 via-white to-slate-200 rounded-2xl p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-800">Profile Information</h2>
                        <button
                            onClick={() => setIsEditingProfile(!isEditingProfile)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                        </button>
                    </div>

                    {!isEditingProfile ? (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                {user.image && (
                                    <img
                                        src={user.image}
                                        alt="Profile"
                                        className="w-20 h-20 rounded-full object-cover"
                                    />
                                )}
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800">{user.name}</h3>
                                    <p className="text-slate-600">{user.email}</p>
                                    {user.role && (
                                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {user.role}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                    <p className="text-slate-900">{user.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <p className="text-slate-900">{user.email}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Account Status</label>
                                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${user.approved ? 'bg-green-100 text-green-800' :
                                        user.rejected ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {user.approved ? 'Approved' : user.rejected ? 'Rejected' : 'Pending'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Profile Image URL</label>
                                <input
                                    type="url"
                                    value={profileData.image}
                                    onChange={(e) => setProfileData({ ...profileData, image: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Save Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditingProfile(false)}
                                    className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Security Settings */}
                <div className="w-full bg-gradient-to-br from-slate-100 via-white to-slate-200 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Security Settings</h2>

                    <div className="space-y-6">
                        {/* Change Password */}
                        <div className="border border-slate-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-slate-800">Change Password</h3>
                                <button
                                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {isChangingPassword ? 'Cancel' : 'Change Password'}
                                </button>
                            </div>

                            {isChangingPassword && (
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="revokeOtherSessions"
                                            checked={passwordData.revokeOtherSessions}
                                            onChange={(e) => setPasswordData({ ...passwordData, revokeOtherSessions: e.target.checked })}
                                            className="mr-2"
                                        />
                                        <label htmlFor="revokeOtherSessions" className="text-sm text-slate-700">
                                            Revoke all other sessions
                                        </label>
                                    </div>
                                    <div className="flex space-x-4">
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Change Password
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsChangingPassword(false)}
                                            className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Change Email */}
                        <div className="border border-slate-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-slate-800">Change Email</h3>
                                <button
                                    onClick={() => setIsChangingEmail(!isChangingEmail)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {isChangingEmail ? 'Cancel' : 'Change Email'}
                                </button>
                            </div>

                            {isChangingEmail && (
                                <form onSubmit={handleChangeEmail} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">New Email Address</label>
                                        <input
                                            type="email"
                                            value={emailData.newEmail}
                                            onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        <p className="text-sm text-slate-600 mt-1">
                                            A verification email will be sent to your current email address to confirm this change.
                                        </p>
                                    </div>
                                    <div className="flex space-x-4">
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Send Verification Email
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsChangingEmail(false)}
                                            className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* Connected Accounts */}
                <div className="w-full bg-gradient-to-br from-slate-100 via-white to-slate-200 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Connected Accounts</h2>

                    {accounts.length > 0 ? (
                        <div className="space-y-4">
                            {accounts.map((account) => (
                                <div key={account.id} className="flex justify-between items-center p-4 border border-slate-200 rounded-lg">
                                    <div>
                                        <h3 className="font-semibold text-slate-800 capitalize">{account.provider}</h3>
                                        <p className="text-sm text-slate-600">Account ID: {account.accountId}</p>
                                    </div>
                                    <button
                                        onClick={() => handleUnlinkAccount(account.provider)}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Unlink
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-600">No connected accounts found.</p>
                    )}
                </div>

                {/* Danger Zone */}
                <div className="w-full bg-gradient-to-br from-red-50 via-white to-red-50 rounded-2xl p-8 border border-red-200">
                    <h2 className="text-2xl font-bold text-red-800 mb-6">Danger Zone</h2>

                    <div className="border border-red-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-red-800">Delete Account</h3>
                                <p className="text-sm text-red-600">This action cannot be undone. This will permanently delete your account and remove all data.</p>
                            </div>
                            <button
                                onClick={() => setIsDeletingAccount(!isDeletingAccount)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                {isDeletingAccount ? 'Cancel' : 'Delete Account'}
                            </button>
                        </div>

                        {isDeletingAccount && (
                            <form onSubmit={handleDeleteAccount} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-red-700 mb-1">Current Password</label>
                                    <input
                                        type="password"
                                        value={deleteData.password}
                                        onChange={(e) => setDeleteData({ ...deleteData, password: e.target.value })}
                                        className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-red-700 mb-1">
                                        Type <span className="font-bold">DELETE</span> to confirm
                                    </label>
                                    <input
                                        type="text"
                                        value={deleteData.confirmText}
                                        onChange={(e) => setDeleteData({ ...deleteData, confirmText: e.target.value })}
                                        className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="DELETE"
                                        required
                                    />
                                </div>
                                <div className="flex space-x-4">
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Delete Account
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsDeletingAccount(false)}
                                        className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};