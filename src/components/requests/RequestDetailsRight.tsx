import type { FormLog, TicketUpdate } from "@/db/schema"
import { cn, fetcher } from "@/lib/utils"
import useSWR from "swr"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { ChatRequest } from "./ChatRequest"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Check } from "lucide-react"
import { useTransition } from "react"
import { actions } from "astro:actions"
import { toast } from "sonner"
import { useState } from "react"
import { RequestLogForm } from "./RequestLogForm"
import { DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger, Drawer as DrawerRoot } from "../ui/drawer";
import DocxFiller from "./DocxFiller"
import _ from "lodash"

interface RequestLogWithForm extends TicketUpdate {
    form: FormLog
}

export const RequestDetailsRight = ({ requestId, userId, isAdmin }: { requestId: string, userId: string, isAdmin: boolean }) => {
    const [openAccordion, setOpenAccordion] = useState<string | undefined>(undefined)

    const { data: requestLogs, isLoading: isLoadingRequestLogs, error: errorRequestLogs, mutate } = useSWR(`/api/requestlogs/${requestId}`, fetcher)
    const { data: request, isLoading: isLoadingRequest, error: errorRequest } = useSWR(`/api/request/${requestId}`, fetcher)
    const [pending, startTransition] = useTransition()

    if (isLoadingRequestLogs || isLoadingRequest) {
        return (
            <div className="flex-1 border rounded-xl p-6">
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            </div>
        )
    }

    if (errorRequestLogs || errorRequest) {
        return <div>Error loading request</div>
    }

    function handleCloseChat(e: string) {

        if (!e) {
            toast.error('Please select a request log')
        }

        startTransition(async () => {
            try {
                const response = await actions.admin.closeChat({
                    requestLogId: e,
                })

                if (response.data) {
                    toast.success('Chat closed')
                } else {
                    toast.error('Error closing chat')
                }

            } catch (error) {
                toast.error('Error closing chat')
                console.error(error)
            } finally {
                mutate()
                return
            }
        })
    }

    function handleResetForm(e: string) {

        if (!e) {
            toast.error('Please select a request log')
        }

        startTransition(async () => {
            try {
                const response = await actions.admin.reopenForm({
                    requestFormId: e,
                })

                if (response.data) {
                    toast.success('Form reopened')
                } else {
                    toast.error('Error reopening form')
                }

            } catch (error) {
                toast.error('Error reopening form')
                console.error(error)
            } finally {
                mutate()
                return
            }
        })
    }

    const requestLogsForm = _.chain(requestLogs.requestLogs)
        .filter(item => item.form != null)
        .map(item => item.form)
        .value()

    return (
        <div className="flex-1 border rounded-xl p-6 relative overflow-hidden">
            {isAdmin && (<Drawer requestLogsForm={requestLogsForm} requestId={requestId} />)}
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Request Timelines
            </h2>
            {request.request.status === "approved" && (
                <div className="bg-green-500 text-white p-4 rounded-xl mb-8">
                    <p className="text-lg font-bold">
                        Request Approved
                    </p>
                    <p className="text-sm">
                        Please proceed to our barangay to complete the request.
                    </p>
                </div>
            )}
            <div className="relative bg-slate-50 rounded-xl p-4 overflow-y-auto border-2 border-dashed max-h-[calc(100vh-200px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {
                    requestLogs.requestLogs.map((log: RequestLogWithForm, index: number) => (
                        <div
                            key={log.id}
                            className="mb-8 flex gap-4 relative group transition-all duration-200 hover:translate-x-1"
                        >
                            {/* Timeline connector with improved styling */}
                            <div className="relative flex-shrink-0">
                                <div
                                    className={cn(
                                        "h-4 w-4 rounded-full mt-2.5 relative",
                                        "ring-4 ring-white shadow-sm transition-colors duration-200",
                                        "after:content-[''] after:absolute after:inset-0 after:rounded-full after:ring-4 after:ring-blue-50",
                                        request.request.status === "rejected" && "bg-red-500 after:ring-red-50",
                                        request.request.status === "approved" && "bg-green-500 after:ring-green-50",
                                        !request.request.status && "bg-primary after:ring-blue-50"
                                    )}
                                >
                                    {(index === 0 && (request.request.status !== "approved" && request.request.status !== "rejected")) && (
                                        <div className="absolute h-3 w-3 inset-0 m-auto rounded-full bg-blue-400 animate-ping" />
                                    )}
                                </div>
                                {index !== requestLogs.requestLogs.length - 1 && (
                                    <div className="absolute top-8 left-1/2 -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-gray-200 to-gray-50" />
                                )}
                            </div>

                            {/* Content wrapper with improved styling */}
                            <div className="flex-1 transition-all duration-200">
                                <div
                                    className={cn(
                                        "bg-white rounded-xl border border-gray-100",
                                        "p-5 min-w-0 transition-all duration-200",
                                        "shadow-sm hover:shadow-md",
                                        "group-hover:border-gray-200",
                                        index === 0 && request.request.status === "approved" && "ring-1 ring-green-500 shadow-green-100",
                                        request.request.status === "rejected" && "ring-1 ring-red-500 shadow-red-100"
                                    )}
                                >
                                    <div className={cn(" items-center gap-3 mb-3 max-w-2xl", log.form && "bg-slate-100 p-4 rounded-lg")}>

                                        <div className="flex items-center gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-medium text-gray-900">
                                                        Request Update
                                                    </h3>
                                                    {log.type === "urgent" && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                                            Urgent
                                                        </span>
                                                    )}
                                                </div>
                                                <time className="text-xs text-gray-500 mt-0.5">
                                                    {new Date(log.createdAt).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </time>
                                            </div>
                                            {log.form && (
                                                <>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {log.form.docType} form
                                                    </p>
                                                    <p className={cn("px-2 py-1 rounded-full text-xs", log.form.form !== null ? 'bg-green-200' : 'bg-red-200')}>
                                                        {log.form.form !== null ? 'Submitted' : 'Not Submitted'}
                                                    </p>
                                                    {
                                                        log.form.form !== null && isAdmin && (
                                                            <Button variant={'ghost'} className="hover:bg-slate-200" onClick={() => handleResetForm(log.form.id)}>Reset Form</Button>
                                                        )
                                                    }
                                                </>
                                            )}
                                        </div>
                                        {log.form && !isAdmin && (
                                            <RequestLogForm isAdmin={isAdmin} formLogId={log.form.id} requestId={request.request.id} requestLogId={log.id} docType={log.form.docType} logFormData={log.form} />
                                        )}
                                        {(log.type === 'form' && log.form.form && isAdmin) && (
                                            <div className="mt-4 space-y-4">
                                                {log.form.form && Object.entries(log.form.form).map(([key, value]) => (
                                                    <div key={key} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-sm font-medium text-gray-700 capitalize">
                                                                {key.replace(/_/g, ' ')}
                                                            </label>
                                                            <span className="text-sm text-gray-600">
                                                                {typeof value === 'boolean'
                                                                    ? (value ? 'Yes' : 'No')
                                                                    : Array.isArray(value)
                                                                        ? value.join(', ')
                                                                        : value?.toString() || 'N/A'
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                        {log.message}
                                    </p>
                                    {/* Put Form here */}
                                    {!log.form && (<Accordion
                                        type="single"
                                        collapsible
                                        value={openAccordion}
                                        onValueChange={setOpenAccordion}
                                        className="mt-4"
                                    >
                                        <AccordionItem value={log.id} className="border-none">
                                            <AccordionTrigger className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-all">
                                                <div className="flex items-center gap-2 flex-1">
                                                    {!log.updateClose ? (
                                                        <>
                                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                            <span className="text-sm font-medium text-blue-600">
                                                                Open conversation
                                                            </span>
                                                            <span className="text-xs text-gray-400 ml-2">
                                                                Click to respond
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                                                            <span className="text-sm font-medium text-gray-500">
                                                                Conversation closed
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-4">
                                                <ChatRequest requestUpdateId={log.id} isAdmin={isAdmin} userId={userId} />
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>)}
                                </div>
                            </div>

                            {/* Admin actions with improved positioning and styling */}
                            {isAdmin && !log.updateClose && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            className="absolute -right-2 top-2 shadow-lg opacity-0 group-hover:opacity-100 group-hover:right-2 transition-all duration-200"
                                            size="sm"
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Resolve
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>
                                                Are you sure you want to mark this as resolved?
                                            </DialogTitle>
                                            <DialogDescription>
                                                This will close the chat and mark the request log as resolved.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Button disabled={pending} variant="destructive" onClick={() => handleCloseChat(log.id)}>
                                                Yes, I Understand 👍
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    ))
                }
            </div>
        </div>
    )
}


const Drawer = ({ requestLogsForm, requestId }: { requestLogsForm: FormLog[], requestId: string }) => {

    const [open, setOpen] = useState(false)

    return (
        <DrawerRoot open={open} onOpenChange={setOpen}>
            <DrawerTrigger className={cn("absolute top-0 right-24 transition-all duration-300", open && "-translate-y-16")} asChild>
                <Button variant="outline" className="border-t-0 rounded-t-none border-dashed">Generate Document</Button>
            </DrawerTrigger>
            <DrawerContent className="h-[90vh] p-4">
                <DrawerHeader>
                    <DrawerTitle>Generate Document</DrawerTitle>
                    <DrawerDescription>Please fill up the form below to generate a document.</DrawerDescription>
                </DrawerHeader>
                <DocxFiller requestLogsForm={requestLogsForm} requestId={requestId} />
                <DrawerFooter>
                    <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </DrawerRoot>

    )
}