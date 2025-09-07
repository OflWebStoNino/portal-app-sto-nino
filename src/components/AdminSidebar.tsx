import React from "react"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Users,
    PlusCircle,
    Megaphone,
    User,
    Calendar,
    FileText,
    LogOut,
    Medal
} from "lucide-react"
import { authClient } from "@/lib/auth-client"

interface AdminSidebarProps {
    currentPath: string
    userName?: string
}

export const AdminSidebar = ({ currentPath, userName = "Admin" }: AdminSidebarProps) => {

    const handleSignout = async () => {
        const { data, error } = await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    window.location.href = "/";
                }
            }
        })
    }

    const navigationItems = [
        {
            label: "Dashboard",
            href: "/admin",
            icon: LayoutDashboard,
            active: currentPath === "/admin"
        },
        {
            label: "Users",
            href: "/admin/users-admin",
            icon: Users,
            active: currentPath.includes("/admin/users")
        },
        {
            label: "Post",
            href: "/admin/posts-admin",
            icon: PlusCircle,
            active: currentPath.includes("/admin/posts")
        },
        {
            label: "Announcements",
            href: "/admin/content-admin",
            icon: Megaphone,
            active: currentPath.includes("/admin/content")
        },
        {
            label: "Officials",
            href: "/admin/officers-admin",
            icon: User,
            active: currentPath.includes("/admin/officers")
        },
        {
            label: "Events",
            href: "/admin/events-admin",
            icon: Calendar,
            active: currentPath.includes("/admin/events")
        },
        {
            label: "Program",
            href: "/admin/programs-admin",
            icon: FileText,
            active: currentPath.includes("/admin/programs")
        },
        {
            label: "Promotions",
            href: "/admin/promotions",
            icon: Medal,
            active: currentPath.includes("/admin/promotions")
        }
    ]

    return (
        <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
            {/* Logo Section */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold text-center leading-tight">
                            BARANGAY<br />STO. NIÑO<br />SAGISAG
                        </span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Barangay Sto. Niño</h1>
                        <p className="text-sm text-gray-600">Administrator</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navigationItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <a
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-200",
                                item.active && "bg-green-500 text-white hover:bg-green-600"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </a>
                    )
                })}
            </nav>

            {/* Logout Section */}
            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={handleSignout}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Log Out</span>
                </button>
            </div>
        </div>
    )
} 