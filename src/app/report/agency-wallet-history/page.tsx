'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import AuthUserReusableCode from '@/components/AuthUserReusableCode';
import CustomizedInputWithLabel from '@/components/CustomizedInputWithLabel';
import ReactTable from '@/components/ReactTable';
import { Button } from '@/components/ui/button';
import { exportPicklist, getErrorMessage, tableDataPerPage } from '@/lib/utils';
import { downloadAgencyWalletReport, downloadAgentWalletReport, downloadBillingReport, getAgencyWalletHistory, getAgentWalletHistory, getBillingReport } from '@/app/api-calls/report/api';
import { useSession } from 'next-auth/react';
import CustomizedSelectInputWithLabel from '@/components/CustomizedSelectInputWithLabel';

const AgencyWalletHistory = () => {

    const { data: session } = useSession()
    const currentUserId = session?.user?.userId
    const [isLoading, setIsLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const [dataList, setDataList] = useState([])

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [agencyName, setAgencyName] = useState('');
    const [agencyMobile, setAgencyMobile] = useState('');
    const [transactionType, setTransactionType] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [pageSize, setPageSize] = useState(tableDataPerPage);
    const [showTable, setShowTable] = useState(false);

    useEffect(() => {
        // const today = new Date();
        // const last30Days = new Date();
        // last30Days.setDate(today.getDate() - 30);

        // const formattedToday = today.toISOString().split('T')[0];
        // const formattedLast30Days = last30Days.toISOString().split('T')[0];

        // setFromDate(formattedLast30Days);
        // setToDate(formattedToday);

        // getReportData({
        //     transaction_date_range: {
        //         from_date: formattedLast30Days,
        //         to_date: formattedToday,
        //     },
        // });
    }, []);

    const getReportData = async (applyFilter = {}, page = 1) => {
        let payload = {
            page: currentPage,
            page_size: pageSize,
            filter: {
                transaction_date_range: {
                    from_date: fromDate,
                    to_date: toDate,
                },
                ...agencyName && { agent_name: agencyName },
                ...agencyMobile && { agent_mobile: agencyMobile },
                ...transactionId && { transaction_id: transactionId },
                ...transactionType && { transaction_type: transactionType },
            }
        };

        payload = {
            ...payload,
            page,
            filter: {
                ...payload.filter,
                ...applyFilter
            }
        }

        try {
            setIsLoading(true);
            const response = await getAgencyWalletHistory(payload, session?.user?.userId);
            setShowTable(true)
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
        { label: 'Agency Name', key: 'agency_name', sortable: true },
        { label: 'Agency Mobile', key: 'agency_mobile', sortable: true },
        { label: 'TXN type', key: 'transaction_type', sortable: true },
        { label: 'Top Up / Reverse', key: 'transaction_amount', sortable: true },
        { label: 'Current Balance', key: 'balance_after_txn', sortable: true },
        { label: 'Previous Balance', key: 'balance_before_txn', sortable: true },
        { label: 'TXN Date', key: 'transaction_date', sortable: true },
    ], []);

    const handleExportFile = async (type = 'pdf') => {
        try {
            setIsLoading(true);
            let payload = {
                "transaction_date_range": {
                    "from_date": fromDate,
                    "to_date": toDate
                }
            }
            const response = await downloadAgencyWalletReport(payload, type, session?.user?.userId)

            const contentDisposition = response.headers["content-disposition"];
            let filename = "AgencyWalletHistory";

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
        } finally {
            setIsLoading(false);
        }
    }

    const handlePageChange = (page: number) => {
        getReportData({}, page)
    };

    return (
        <AuthUserReusableCode pageTitle="Agency Wallet History" isLoading={isLoading}>
            <div className="grid grid-cols-6 gap-4">
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
                    label="Agency Mobile No."
                    value={agencyMobile}
                    onChange={(e) => setAgencyMobile(e.target.value)}
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
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value)}
                />
                <div className="flex self-end mb-1">
                    <Button onClick={() => getReportData()} disabled={isLoading}>Search</Button>
                </div>
                <CustomizedSelectInputWithLabel
                    label="Export"
                    placeholder='Export To'
                    list={exportPicklist}
                    // value={transactionId}
                    onChange={(e) => handleExportFile(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto mt-4">
                {showTable &&
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
                        hideSearchAndOtherButtons
                    />
                }
            </div>
        </AuthUserReusableCode >
    );
};

export default AgencyWalletHistory;
