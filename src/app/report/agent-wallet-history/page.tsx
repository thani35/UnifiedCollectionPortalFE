'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import AuthUserReusableCode from '@/components/AuthUserReusableCode';
import CustomizedInputWithLabel from '@/components/CustomizedInputWithLabel';
import ReactTable from '@/components/ReactTable';
import { Button } from '@/components/ui/button';
import { getErrorMessage, tableDataPerPage } from '@/lib/utils';
import { downloadBillingReport, getAgentWalletHistory, getBillingReport } from '@/app/api-calls/report/api';
import { useSession } from 'next-auth/react';

const AgentWalletHistory = () => {

    const { data: session } = useSession()
    const currentUserId = session?.user?.userId
    const [isLoading, setIsLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const [dataList, setDataList] = useState([])

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [agencyName, setAgencyName] = useState('');
    const [agentName, setAgentName] = useState('');
    const [agentMobile, setAgentMobile] = useState('');
    const [transactionType, setTransactionType] = useState('');
    const [transactionId, setTransactionId] = useState('');

    useEffect(() => {
        getReportData();
    }, []);

    const getReportData = async (applyFilter = {}, page = 1) => {
        let payload = {
            page: currentPage,
            page_size: tableDataPerPage,
            filter: {
                transaction_date_range: {
                    from_date: fromDate,
                    to_date: toDate,
                },
                agent_name: agentName,
                agent_mobile: agentMobile,
                transaction_id: transactionId,
                transaction_type: transactionType,
                agency_name: agencyName,
            }
        };

        payload = {
            ...payload,
            page
        }

        try {
            setIsLoading(true);
            const response = await getAgentWalletHistory(payload, session?.user?.userId);
            setDataList(response.data.data);
            setCurrentPage(page);
            setTotalPages(response.data.totalPages)
        } catch (error) {
            console.log(getErrorMessage(error))
        } finally {
            setIsLoading(false);
        }
    }

    const columns = useMemo(() => [
        { label: 'User ID', key: 'userId', sortable: true },
        { label: 'Mobile Number', key: 'mobileNumber', sortable: true },
        { label: 'Franchise Name', key: 'franchiseName', sortable: true },
        { label: 'Collector Name', key: 'collectorName', sortable: true },
        { label: 'Current Balance', key: 'currentBalance', sortable: true },
        { label: 'Total Recharge', key: 'totalRecharge', sortable: true },
        { label: 'Total Collection', key: 'totalCollection', sortable: true },
        { label: 'Total', key: 'total', sortable: true },
    ], []);

    const handleExportFile = async (type = 'pdf') => {
        try {
            const response = await downloadBillingReport(type)

            const contentDisposition = response.headers["content-disposition"];
            let filename = "AgentWalletHistory";

            if (contentDisposition) {
                const matches = contentDisposition.match(/filename="(.+)"/);
                if (matches && matches.length > 1) {
                    filename = matches[1];
                }
            }

            const contentType = response.headers["content-disposition"];
            let extension = type;

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
            console.error("Error downloading the report:", error);
        }
    }

    const handlePageChange = (page: number) => {
        getReportData({}, page)
    };

    return (
        <AuthUserReusableCode pageTitle="Agent Wallet History" isLoading={isLoading}>
            <div className="grid grid-cols-10 gap-4">
                <CustomizedInputWithLabel
                    label="From Date"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                />

                <CustomizedInputWithLabel
                    label="To Date"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                />

                <CustomizedInputWithLabel
                    label="Agency Name"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                />

                <CustomizedInputWithLabel
                    label="Agent Name"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                />
                <CustomizedInputWithLabel
                    label="Agent Mobile no"
                    value={agentMobile}
                    onChange={(e) => setAgentMobile(e.target.value)}
                />

                <CustomizedInputWithLabel
                    label="Transaction Type"
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                />

                <CustomizedInputWithLabel
                    label="Transaction ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                />
                <CustomizedInputWithLabel
                    label="Page Size"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                />
                <div className="flex justify-end mt-4">
                    <Button onClick={() => getReportData()} disabled={isLoading}>Search</Button>
                </div>
                <CustomizedInputWithLabel
                    label="Page Size"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto">
                <ReactTable
                    data={dataList}
                    columns={columns}
                    dynamicPagination
                    itemsPerPage={tableDataPerPage}
                    pageNumber={currentPage}
                    totalPageNumber={totalPages}
                    onPageChange={handlePageChange}
                    customExport={true}
                    handleExportFile={handleExportFile}
                />
            </div>
        </AuthUserReusableCode >
    );
};

export default AgentWalletHistory;
