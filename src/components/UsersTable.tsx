import { EyeIcon, TrashIcon } from "lucide-react"
import { Button } from "./ui/button"
import { Table, TableHeader, TableCell, TableBody, TableRow, TableHead, TableCaption } from "./ui/table"
import { actions } from "astro:actions"
import { navigate } from "astro:transitions/client"
import { useCallback, useState } from "react"
import { Input } from "./ui/input"
import _ from "lodash"
import useSWR from "swr"
import { Skeleton } from "./ui/skeleton"
import { fetcher } from "@/lib/utils"

interface User {
    id: string
    email: string
    name: string
    role: string
    approved: boolean
    family: {
        id: number
    }
    rejected: boolean
}

const UsersTableNest = ({ users, isLoading, error }: { users: User[] | undefined, isLoading: boolean, error: any }) => {

    // const { data: users, error, isLoading, isValidating } = useSWR<User[]>(`/api/admin/users?page=${page}&searchUser=${searchParams}`, fetcher)



    async function approveUser(userId: string, approved: boolean) {
        try {
            const response = await actions.admin.approveUser({
                userId: userId,
                approved: approved
            });

            if (response.data) {
                alert('User ' + userId + ' approved: ' + approved);
                window.location.reload();
            } else {
                console.error(response.error);
            }
        } catch (error) {
            console.error(error);
        }
    }


    async function rejectUser(userId: string) {
        try {
            const response = await actions.admin.rejectUser({
                userId: userId,
                reject: true
            });

            if (response.data) {
                alert('User ' + userId + ' rejected');
                window.location.reload();
            } else {
                console.error(response.error);
            }
        } catch (error) {
            console.error(error);
        }
    }



    if (isLoading) {
        return (
            <div className="flex flex-col space-y-3">
                <Skeleton className="h-[125px] w-full rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-[125px] w-full rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-[125px] w-full rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>
            </div>
        )
    }


    if (error) {
        return <div>Error: {error.message}</div>
    }

    return users && (
        <div className="rounded-md border">
            <Table>
                <TableCaption>Users</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Family Reg Status</TableHead>
                        <TableHead>Approved</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.role}</TableCell>
                            <TableCell>{user.family?.id ? 'Registed' : 'Not Registered'}</TableCell>
                            <TableCell>{user.approved ? 'Yes' : 'No'}</TableCell>
                            <TableCell className="flex gap-2">
                                <a href={`/admin/users/${user.id}`}>
                                    <Button variant="outline" size="icon">
                                        <EyeIcon className="w-4 h-4" />
                                    </Button>
                                </a>
                                {!user.approved && !user.rejected && (
                                    <>
                                        <form onSubmit={() => approveUser(user.id, true)} method="post">
                                            <Button className="w-24" variant="default" size="icon">
                                                Approve
                                            </Button>
                                        </form>
                                        <form onSubmit={() => rejectUser(user.id)} method="post">
                                            <Button className="w-24" variant="destructive" size="icon">
                                                Reject
                                            </Button>
                                        </form>
                                    </>
                                )}
                                {user.approved && (
                                    <form onSubmit={() => approveUser(user.id, false)} method="post">
                                        <Button className="w-24" variant="destructive" size="icon">
                                            Disapprove
                                        </Button>
                                    </form>
                                )}
                                {user.rejected && (
                                    <form onSubmit={() => rejectUser(user.id)} method="post">
                                        <Button className="w-24" variant="default" size="icon">
                                            Unreject
                                        </Button>
                                    </form>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}


export const UsersTable = () => {

    const [search, setSearch] = useState<string>('');
    const [searchInput, setSearchInput] = useState<string>('');
    const [page, setPage] = useState(1);
    const { data: users, error, isLoading } = useSWR<User[]>(`/api/admin/users?page=${page}&searchUser=${search}`, fetcher)

    const debounceFunc = useCallback(_.debounce((e) => {
        setSearch(e)
    }, 1000), [search]);


    function handleSearch(e: string) {
        setSearchInput(e);
        debounceFunc(e);
    }


    return (
        <div className="space-y-4">
            {searchInput !== search && <p className="text-xs text-gray-500">Searching for {searchInput}</p>}
            <Input placeholder="Search users" value={searchInput} onChange={(e) => handleSearch(e.target.value)} />
            {search && <div className="text-sm text-gray-500 p-1">Results for {search} <button className="bg-blue-500 text-white px-2 py-1 rounded-md" onClick={() => {
                setSearch('')
                setSearchInput('')
            }}>Clear</button></div>}
            <UsersTableNest users={users} isLoading={isLoading} error={error} />
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div>
                    {page > 1 && (
                        <button
                            onClick={() => setPage(page - 1)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Previous
                        </button>
                    )}
                </div>
            </div>
            <div>
                {users?.length === 5 && (
                    <button
                        onClick={() => setPage(page + 1)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Next
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    )
}