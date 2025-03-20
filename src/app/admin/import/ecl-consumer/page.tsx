'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import AuthUserReusableCode from '@/components/AuthUserReusableCode';
import { Download, Trash2, Upload, X, CloudUpload, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SuccessErrorModal from '@/components/SuccessErrorModal';
import { downloadEclConsumer, deleteEclConsumer, uploadEclConsumer } from '@/app/api-calls/admin/api';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import moment from 'moment';
import AlertPopup from '@/components/Agency/ViewAgency/AlertPopup';

const EclConsumerMapping: React.FC = () => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState<boolean>(false);
    const [isUploading, setIsUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [isLoading, setIsLoading] = useState(false)

    const getTimestamp = () => {
        return moment(new Date()).format('_YYYY-MM-DD_HH-MM-SS')
    };

    const handleDownload = async () => {
        try {
            setIsLoading(false)
            const response = await downloadEclConsumer()

            const contentDisposition = response.headers["content-disposition"];
            let filename = `ECLConsumers_${getTimestamp()}`;

            if (contentDisposition) {
                const matches = contentDisposition.match(/filename="(.+)"/);
                if (matches && matches.length > 1) {
                    filename = matches[1];
                }
            }

            const contentType = response.headers["content-disposition"];
            console.log(contentType)
            let extension = "csv";

            const blob = new Blob([response.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `${filename}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Error: ' + getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    };

    const handleDelete = async () => {
        try {
            setIsLoading(true)
            const response = await deleteEclConsumer()
            toast.success(response.message)
        } catch (error) {
            toast.error('Error: ' + getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    };

    const handleUploadClick = () => {
        setIsUploadModalOpen(true);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };


    const handleUpload = async () => {
        if (!selectedFile) {
            setIsUploadModalOpen(false);
            setIsErrorModalOpen(true);
            return;
        }
        try {
            setIsLoading(true);
            setIsUploading(true)
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await uploadEclConsumer(formData);
            toast.success(response.message)
            setIsUploadModalOpen(false);
            setIsSuccessModalOpen(true);
            setSelectedFile(null)
        } catch (error) {
            setIsUploadModalOpen(false);
            setIsErrorModalOpen(true);
            setSelectedFile(null)
            toast.error('Error: ' + getErrorMessage(error));
        } finally {
            setIsLoading(false);
            setIsUploading(false)
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    return (
        <AuthUserReusableCode pageTitle="Excel Import for ECL Consumer with Arrear" isLoading={isLoading}>
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col gap-4 items-center">
                    <AlertPopup triggerCode={<Button variant="default" className="w-full py-6 text-lg flex items-center gap-2" >
                        <Download className="h-5 w-5" /> Download Excel Format / Existing Data
                    </Button>} handleContinue={() => handleDownload()}
                        title='Download Data !'
                        description='Are you sure that you want to download the existing data !' continueButtonText='Confirm'
                    />

                    <AlertPopup triggerCode={<Button variant="destructive" className="w-full py-6 text-lg flex items-center gap-2">
                        <Trash2 className="h-5 w-5" /> Delete Existing Data
                    </Button>} handleContinue={() => handleDelete()}
                        title='Confirm Deleting !'
                        description='Are you sure that you want to delete the existing data !' continueButtonText='Confirm'
                    />

                    <Button variant="success" className="w-full py-6 text-lg flex items-center gap-2" onClick={handleUploadClick}>
                        <Upload className="h-5 w-5" /> Upload New Document
                    </Button>
                </div>
            </div>

            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excel Import</DialogTitle>
                    </DialogHeader>

                    <div className="border-2 border-dashed border-gray-300 p-6 text-center rounded-md" onDragOver={handleDragOver}
                        onDrop={handleDrop}>
                        <CloudUpload className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-500">Drag & drop files or <label htmlFor="fileUpload" className="text-blue-600 cursor-pointer underline">Browse</label></p>
                        <input type="file" id="fileUpload" className="hidden" onChange={handleFileSelect} accept=".xls,.xlsx,.csv" />
                        <p className="text-xs text-gray-500 mt-2">
                            Mandatory to Upload Data in proper format, please refer the 'Download Excel Format / Existing Data' button to know more
                        </p>
                    </div>

                    {selectedFile && (
                        <p className="mt-2 text-center text-sm text-green-600">
                            Selected File: {selectedFile.name}
                        </p>
                    )}

                    <DialogFooter className="flex justify-between">
                        <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
                        <Button variant="default" onClick={handleUpload} disabled={!selectedFile || isUploading}>
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                                </>
                            ) : (
                                'Upload'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <SuccessErrorModal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)}
                message="Data Upload Successfully!" type="success" />
            <SuccessErrorModal isOpen={isErrorModalOpen} onClose={() => setIsErrorModalOpen(false)}
                message="Error occurred while uploading data" type="error" />
        </AuthUserReusableCode>
    );
};

export default EclConsumerMapping;
