import { cn } from "@/lib/utils"
import { ModalAuth } from "./ModalAuth"
import { Signout } from "./Signout"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "./ui/navigation-menu"
import React, { useState } from "react"
import useSWR from "swr"
import { Menu } from "lucide-react"
import { Drawer, DrawerTrigger, DrawerContent } from "./ui/drawer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion"


export const MainHeader = ({ role, pathname, approved, hasSession, rejected, isAdmin }: { role: string | null, pathname: string, approved: boolean, hasSession: boolean, rejected: boolean, isAdmin: boolean }) => {
    return (
        <section className="w-full px-8 text-white  bg-green-500 fixed top-0 z-50">
            <div className="container flex flex-row items-center justify-between text-center py-5 mx-auto w-full">
                {/* Logo */}
                <a href="/" className="flex items-center font-medium text-gray-900">
                    <img src="/brgy-logo.png" alt="Barangay Logo" className="h-20" />
                    <div className="ml-4">
                        <div className="text-2xl font-extrabold text-white leading-tight md:block hidden">Barangay Sto. Niño</div>
                        <div className="text-lg font-semibold text-white md:block hidden">Lipa City, Batangas</div>
                        <div className="text-xl font-extrabold text-white leading-tight md:hidden">Brgy. Sto. Niño</div>
                        <div className="text-base font-semibold text-white md:hidden">Lipa City, Batangas</div>
                    </div>
                </a>

                {/* Hamburger for mobile */}
                <div className="md:hidden">
                    <Drawer>
                        <DrawerTrigger asChild>
                            <button aria-label="Open menu">
                                <Menu className="w-8 h-8 text-white" />
                            </button>
                        </DrawerTrigger>
                        <DrawerContent>
                            <nav className="flex flex-col gap-2 p-6 text-black max-h-[80vh] overflow-y-auto">
                                <a className="hover:underline px-4 py-2 text-center" href="/">Home</a>
                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="about">
                                        <AccordionTrigger className="text-lg font-bold">About</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="flex flex-col">
                                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/about/mission-vision">Mission, Vision, and Goal</a>
                                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/about/history">History</a>
                                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/about/officials">Officials</a>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="services">
                                        <AccordionTrigger className="text-lg font-bold">Services</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="flex flex-col">
                                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/tickets">Request Document</a>
                                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/concern">Feedbacks</a>
                                                {/* <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/services#docs">Brgy. Documents</a> */}
                                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/services#progs">Community Programs</a>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="feed">
                                        <AccordionTrigger className="text-lg font-bold">Feed</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="flex flex-col">
                                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/news">News</a>
                                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/announcements">Announcements</a>
                                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/events">Events</a>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="promotions">
                                        <AccordionTrigger className="text-lg font-bold">Explore</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="flex flex-col">
                                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href={`/promotions`}>All</a>
                                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href={`/promotions/Properties`}>Properties</a>
                                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href={`/promotions/Resorts`}>Resorts</a>
                                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href={`/promotions/Churches`}>Churches</a>
                                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href={`/promotions/Farms`}>Farms</a>
                                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href={`/promotions/Nature`}>Nature</a>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="contact">
                                        <AccordionTrigger className="text-lg font-bold">Contact Us</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="flex flex-col">
                                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/contact-us">Contact Us</a>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                                {role === 'admin' && (
                                    <a className="hover:underline px-4 py-2" href="/admin">Admin</a>
                                )}
                                <div className="mt-4">
                                    {hasSession && (
                                        <div className="relative group mb-2">
                                            <div className={cn(
                                                "text-xs px-3 py-1 rounded-full font-medium text-white cursor-help inline-block",
                                                approved ? "bg-green-500" : rejected ? "bg-red-500" : "bg-orange-500"
                                            )}>
                                                {(approved) ? "Approved" : rejected ? "Denied" : "Pending"}
                                            </div>
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 max-w-48 break-words">
                                                {approved ? "Your account has been approved. You now have full access to the portal." :
                                                    rejected ? "Your account request has been denied. You will not be able to access the portal." :
                                                        "Please wait for approval - you have limited access to the portal"}
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                                            </div>
                                        </div>
                                    )}
                                    {role !== null ? <Signout /> : <ModalAuth />}
                                </div>
                            </nav>
                        </DrawerContent>
                    </Drawer>
                </div>

                {/* Main Navigation (desktop) */}
                <nav className="hidden md:flex items-center text-center">
                    <ul className="flex gap-8 text-lg font-bold">
                        <a className="hover:underline px-4 py-2 text-center" href="/">Home</a>
                        <li>
                            <Dropdown label="About">
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/about/mission-vision">Mission, Vision, and Goal</a>
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/about/history">History</a>
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/about/officials">Officials</a>
                            </Dropdown>
                        </li>
                        <li>
                            <Dropdown label="Services">
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/tickets">Request Document</a>
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/concern">Feedback</a>
                                {/* <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/services#docs">Brgy. Documents</a> */}
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/services#progs">Community Programs</a>
                            </Dropdown>
                        </li>
                        <li>
                            <Dropdown label="Feed">
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/news">News</a>
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/announcements">Announcements</a>
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/events">Events</a>
                            </Dropdown>
                        </li>
                        <li>
                            <Dropdown label="Explore">
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href={`/promotions`}>All</a>
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href={`/promotions/Properties`}>Properties</a>
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href={`/promotions/Resorts`}>Resorts</a>
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href={`/promotions/Churches`}>Churches</a>
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href={`/promotions/Farms`}>Farms</a>
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href={`/promotions/Nature`}>Nature</a>
                            </Dropdown>
                        </li>
                        <li>
                            <Dropdown label="Contact Us">
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/contact-us">Contact Us</a>
                            </Dropdown>
                        </li>
                        {role === 'admin' && (
                            <Dropdown label="Admin">
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/admin">Admin</a>
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/admin/users-admin">Users</a>
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/admin/posts-admin">Posts</a>
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/admin/highlights-admin">Highlights</a>
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/admin/content-admin">Content</a>
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/admin/officers-admin">Officers</a>
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/admin/programs-admin">Programs</a>
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/admin/events-admin">Events</a>
                                <a className="block px-6 py-3 hover:bg-accent hover:text-accent-foreground text-base font-bold" href="/admin/promotions">Promotions</a>
                            </Dropdown>
                        )}
                    </ul>
                </nav>

                {/* Auth Section (desktop) */}
                <div className="hidden md:flex items-center space-x-6">
                    {hasSession && (isAdmin && role !== 'admin') && (
                        <div className="relative group">
                            <div className={cn(
                                "text-xs px-3 py-1 rounded-full font-medium text-white cursor-help",
                                approved ? "bg-green-500" : rejected ? "bg-red-500" : "bg-orange-500"
                            )}>
                                {approved ? "Approved" : rejected ? "Denied" : "Pending"}
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 max-w-48 break-words">
                                {approved ? "Your account has been approved. You now have full access to the portal." :
                                    rejected ? "Your account request has been denied. You will not be able to access the portal." :
                                        "Please wait for approval - you have limited access to the portal"}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                            </div>
                        </div>
                    )}
                    {role !== null ? <Signout /> : <ModalAuth />}
                </div>
            </div>

            {/* Breadcrumb Section */}
            {pathname !== '/' && (
                <div className="container mx-auto max-w-7xl pb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <a href="/" className="hover:text-gray-900">Home</a>
                        {pathname.split('/').filter(Boolean).map((segment, index, array) => {
                            const path = '/' + array.slice(0, index + 1).join('/')
                            return (
                                <div key={path} className="flex items-center gap-2">
                                    <span>/</span>
                                    <a href={path} style={{
                                        viewTransitionName: segment + index
                                    }} className="hover:text-gray-900 capitalize">
                                        {segment}
                                    </a>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </section>
    )
}

const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <a
                    ref={ref}
                    className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        className
                    )}
                    {...props}
                >
                    <div className="text-sm font-medium leading-none">{title}</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {children}
                    </p>
                </a>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"

const Dropdown = ({ label, children }: { label: string, children: React.ReactNode }) => {
    const [open, setOpen] = useState(false);
    return (
        <li className="relative">
            <button
                className="px-4 py-2 focus:outline-none text-lg font-bold flex items-center gap-2"
                onClick={() => setOpen((o) => !o)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                type="button"
            >
                {label}
                <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {open && (
                <div className="absolute left-0 mt-2 min-w-[220px] bg-white text-black rounded-lg shadow-lg z-20 border border-gray-200">
                    {children}
                </div>
            )}
        </li>
    );
};

