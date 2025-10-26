import React, { useState, useRef } from 'react';
import { saveAs } from 'file-saver';
import { createReport } from 'docx-templates'; // Update import
import mammoth from 'mammoth';
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from '../ui/label';
import { Card } from "../ui/card";
import type { FormLog } from '@/db/schema';
import { cn, fetcher } from '@/lib/utils';
import useSWR from 'swr';

interface FormData {
    fullName: string;
    age: number;
    birthDate: string;
    birthPlace: string;
    currentAddress: string;
    completeAddress: string;
    purpose: string;
    currentDate: string;
    yearsOfResidence?: string; // New field for residence certificate
    // Barangay Officials data (simplified)
    chairman: {
        name: string;
        position: string;
        description?: string;
    };
    councilors: Array<{
        name: string;
        position: string;
        description?: string;
    }>;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function DocxFiller({ requestLogsForm, requestId }: { requestLogsForm: FormLog[], requestId: string }) {
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        age: 0,
        birthDate: '',
        birthPlace: '',
        currentAddress: '',
        completeAddress: '',
        purpose: '',
        currentDate: new Date().toISOString().split('T')[0],
        yearsOfResidence: '',
        chairman: { name: '', position: '', description: '' },
        councilors: [],
    });

    const [docxFile, setDocxFile] = useState<File | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [showJsonPreview, setShowJsonPreview] = useState(false);
    const [selectedLogIndex, setSelectedLogIndex] = useState<number | null>(null);
    const [selectedInitialDetails, setSelectedInitialDetails] = useState<boolean>(false);

    // Fetch user details for the request
    const { data: userDetailsData, isLoading: isLoadingUserDetails, error: errorUserDetails } = useSWR(
        `/api/request/${requestId}/user-details`,
        fetcher
    );

    // Fetch officials data
    const { data: officialsData, isLoading: isLoadingOfficials, error: errorOfficials } = useSWR(
        '/api/feed/officers',
        fetcher
    );

    // Helper function to process officials data
    const processOfficialsData = () => {
        if (!officialsData?.officials) {
            return {
                chairman: { name: '', position: '', description: '' },
                councilors: [],
            };
        }

        const mainOfficials = officialsData.officials;

        // Process barangay officials
        const chairman = mainOfficials.find((o: any) => o.position === 'chairman') || { name: '', position: 'chairman', description: '' };
        const councilors = mainOfficials.filter((o: any) => o.position === 'councilor');

        return {
            chairman,
            councilors,
        };
    };

    const handleTemplateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const templatePath = e.target.value;
        setSelectedTemplate(templatePath);
    };

    // Replace the file input in the render section with this select component
    const validateFile = (file: File): boolean => {
        setError('');

        if (file.size > MAX_FILE_SIZE) {
            setError('File size exceeds 5MB limit');
            return false;
        }

        if (file.type !== ALLOWED_FILE_TYPE) {
            setError('Please upload a valid DOCX file');
            return false;
        }

        return true;
    };

    const generatePreview = async () => {
        if (!docxFile) return;

        try {
            const templateArrayBuffer = await docxFile.arrayBuffer();
            const templateUint8Array = new Uint8Array(templateArrayBuffer);
            const filledDocument = await createReport({
                template: templateUint8Array,
                data: formData,
                cmdDelimiter: ['+++INS', '+++'],
                noSandbox: true,
            });

        } catch (error) {
            console.error("Error generating preview:", error);
            setError("Failed to generate preview.");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        generatePreview();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && validateFile(file)) {
            setDocxFile(file);
            generatePreview();
        } else {
            event.target.value = '';
            setDocxFile(null);
        }
    };

    const handleDownload = async () => {
        if (!formData.fullName || !formData.age) {
            setError("Please fill in all required fields.");
            return;
        }

        setIsLoading(true);
        try {
            const fileDoc = await fetch(selectedTemplate).then((res) => res.blob());
            const templateArrayBuffer = await fileDoc.arrayBuffer();

            // Process officials data
            const officialsData = processOfficialsData();

            // Combine form data with officials data
            const documentData = {
                ...formData,
                ...officialsData,
                // Format current date for display
                currentDate: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            };

            const filledDocument = await createReport({
                template: new Uint8Array(templateArrayBuffer),
                data: documentData,
                cmdDelimiter: ['+++INS', '+++'],
                noSandbox: true,
            });

            const blob = new Blob([filledDocument.buffer as ArrayBuffer], {
                type: ALLOWED_FILE_TYPE,
            });
            saveAs(blob, `${formData.fullName}_Document_${Date.now()}.docx`);
        } catch (error) {
            console.error("Error downloading document:", error);
            setError("Failed to download document.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogSelection = (index: number) => {
        const selectedLog = requestLogsForm[index];
        setSelectedLogIndex(index);
        setSelectedInitialDetails(false); // Clear initial details selection

        const officialsData = processOfficialsData();

        setFormData({
            fullName: selectedLog.form?.fullName || '',
            age: selectedLog.form?.birthDate ? Math.floor((new Date().getTime() - new Date(selectedLog.form.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0,
            birthDate: selectedLog.form?.birthDate || '',
            birthPlace: selectedLog.form?.birthPlace || '',
            currentAddress: selectedLog.form?.currentAddress || '',
            completeAddress: selectedLog.form?.completeAddress || '',
            purpose: selectedLog.form?.purpose || '',
            currentDate: new Date().toISOString().split('T')[0],
            yearsOfResidence: selectedLog.form?.yearsOfResidence || '',
            ...officialsData,
        });
        setSelectedTemplate(selectedLog.docType === 'indigency' ? '/indigency.docx' : '/clearance.docx');
    };

    const handleInitialDetailsSelection = () => {
        if (!userDetailsData?.userProfile?.details || !userDetailsData?.request) return;

        const userDetails = userDetailsData.userProfile.details;
        const request = userDetailsData.request;
        const userProfile = userDetailsData.userProfile;

        setSelectedInitialDetails(true);
        setSelectedLogIndex(null); // Clear form log selection

        // Calculate age from birth date if available
        const age = userDetails?.birthDate ?
            Math.floor((new Date().getTime() - new Date(userDetails.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;

        // Determine template based on request type
        let templatePath = '/clearance.docx'; // default
        if (request.type === 'indigency') {
            templatePath = '/indigency.docx';
        }
        setSelectedTemplate(templatePath);

        const officialsData = processOfficialsData();

        setFormData({
            fullName: `${userDetails?.firstName || ''} ${userDetails?.lastName || ''}`.trim() || userProfile?.name || '',
            age: age,
            birthDate: userDetails?.birthDate || '',
            birthPlace: '', // Not available in user details
            currentAddress: userDetails?.address || '',
            completeAddress: userDetails?.address || '',
            purpose: request.details || '', // Use request details as purpose
            currentDate: new Date().toISOString().split('T')[0],
            yearsOfResidence: '', // Not available in user details
            ...officialsData,
        });
    };

    // Update the button in the return statement
    return (
        <div className="w-full h-[calc(100vh-300px)] bg-slate-50 rounded-xl">
            <div className="flex h-full">
                {/* Sidebar with form logs */}
                <div className=" w-1/3 border-r border-slate-200 p-4 overflow-y-auto">
                    {/* Initial Details Section */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Initial Details</h2>
                        {isLoadingUserDetails ? (
                            <div className="flex items-center justify-center p-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                            </div>
                        ) : errorUserDetails ? (
                            <Card className="p-3 bg-red-50 border-red-200">
                                <p className="text-sm text-red-700">Error loading user details</p>
                            </Card>
                        ) : userDetailsData?.userProfile?.details ? (
                            <Card className={cn('p-3 cursor-pointer hover:bg-slate-100', selectedInitialDetails && 'border-2 border-blue-500')}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium">Request Details</h3>
                                        <p className="text-sm text-gray-600">
                                            {userDetailsData.userProfile.details.firstName} {userDetailsData.userProfile.details.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Request Type: {userDetailsData.request?.type}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Status: {userDetailsData.request?.status}
                                        </p>
                                    </div>
                                    <button
                                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                                        onClick={handleInitialDetailsSelection}
                                    >
                                        Use this data
                                    </button>
                                </div>
                                <div className="mt-2 space-y-1">
                                    <div className="text-xs text-gray-500">
                                        <strong>Purpose:</strong> {userDetailsData.request?.details}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        <strong>Age:</strong> {userDetailsData.userProfile.details.birthDate ?
                                            Math.floor((new Date().getTime() - new Date(userDetailsData.userProfile.details.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                                            : 'Not provided'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        <strong>Birth Date:</strong> {userDetailsData.userProfile.details.birthDate || 'Not provided'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        <strong>Current Address:</strong> {userDetailsData.userProfile.details.address || 'Not provided'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        <strong>Complete Address:</strong> {userDetailsData.userProfile.details.address || 'Not provided'}
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <Card className="p-3 bg-yellow-50 border-yellow-200">
                                <p className="text-sm text-yellow-700">No user details available</p>
                            </Card>
                        )}
                    </div>

                    {/* Submitted Forms Section */}
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Submitted Forms</h2>
                    <div className='space-y-2'>
                        {requestLogsForm.map((log, index) => (
                            <Card
                                key={index}
                                className={cn('p-3 cursor-pointer hover:bg-slate-100', selectedLogIndex === index && 'border-2 border-blue-500', !log.form && 'bg-red-200 hover:bg-red-100 cursor-not-allowed ')}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium">{log.docType}</h3>
                                        <p className="text-sm text-gray-600">{log.userId}</p>
                                    </div>
                                    <button
                                        disabled={!log.form}
                                        className="text-xs disabled:opacity-70 bg-blue-100 text-blue-700 px-2 py-1 rounded"
                                        onClick={() => log.form ? handleLogSelection(index) : {}}
                                    >
                                        {log.form ? ("Use this data") : ("No data")}
                                    </button>
                                </div>
                                <pre className="mt-2 text-sm overflow-x-auto bg-gray-50 p-2 rounded">
                                    {JSON.stringify(log, null, 2)}
                                </pre>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Main content area */}
                <div className="flex-1 p-4 overflow-y-auto">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Document Generator</h2>
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-2 rounded">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Age</Label>
                                    <Input
                                        type="number"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleInputChange}
                                        placeholder="Enter your age"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Birth Date</Label>
                                    <Input
                                        type="date"
                                        name="birthDate"
                                        value={formData.birthDate}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Birth Place</Label>
                                    <Input
                                        name="birthPlace"
                                        value={formData.birthPlace}
                                        onChange={handleInputChange}
                                        placeholder="Enter your birth place"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Current Address</Label>
                                    <Input
                                        name="currentAddress"
                                        value={formData.currentAddress}
                                        onChange={handleInputChange}
                                        placeholder="Enter your current address"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Complete Address</Label>
                                    <Input
                                        name="completeAddress"
                                        value={formData.completeAddress}
                                        onChange={handleInputChange}
                                        placeholder="Enter your complete address"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Purpose</Label>
                                    <Input
                                        name="purpose"
                                        value={formData.purpose}
                                        onChange={handleInputChange}
                                        placeholder="Enter purpose"
                                    />
                                </div>

                                {selectedTemplate === '/residence.docx' && (
                                    <div className="space-y-2">
                                        <Label>Years of Residence</Label>
                                        <Input
                                            name="yearsOfResidence"
                                            value={formData.yearsOfResidence}
                                            onChange={handleInputChange}
                                            placeholder="Enter years of residence"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 space-y-3">
                            <Select
                                value={selectedTemplate}
                                onValueChange={setSelectedTemplate}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a template" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="/clearance.docx">Clearance</SelectItem>
                                    <SelectItem value="/indigency.docx">Indigency</SelectItem>
                                </SelectContent>
                            </Select>

                            <button
                                onClick={handleDownload}
                                disabled={isLoading || !selectedTemplate || !formData.fullName || !formData.age}
                                className="w-full mt-2 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Processing...
                                    </span>
                                ) : (
                                    'Generate Document'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DocxFiller;