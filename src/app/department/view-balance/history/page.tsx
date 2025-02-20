'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getBalanceHistoryAgencyById } from '@/app/api-calls/department/api';
import AuthUserReusableCode from '@/components/AuthUserReusableCode';
import ReactTable from '@/components/ReactTable';
import AlertPopup from '@/components/Agency/ViewAgency/AlertPopup';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomizedSelectInputWithLabel from '@/components/CustomizedSelectInputWithLabel';
import { Button } from '@/components/ui/button';
import moment from 'moment';
import CustomizedInputWithLabel from '@/components/CustomizedInputWithLabel';
import { getErrorMessage, tableDataPerPage } from '@/lib/utils';

const ViewHistory = () => {
    const [balanceList, setBalanceList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        fromDate: '',
        toDate: ''
    });
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        let date = getDefaultDates()
        setDateRange(date);
        getBalanceHistory({ from_date: date.fromDate, to_date: date.toDate });
    }, []);

    const getDefaultDates = () => ({
        fromDate: moment().subtract(1, "months").startOf("month").format("YYYY-MM-DD"),
        toDate: moment().subtract(1, "months").endOf("month").format("YYYY-MM-DD"),
    });

    const getBalanceHistory = async (applyFilter = {}, page = 1) => {
        console.log(page)
        let payload = {
            page: currentPage,
            page_size: tableDataPerPage,
            filter: {
                entity_type: "Agency",
                from_date: dateRange.fromDate,
                to_date: dateRange.toDate,
                entity_id: idFromUrl
            }
        }

        payload = {
            ...payload,
            filter: {
                ...payload.filter,
                ...applyFilter
            },
            page
        }

        try {
            setIsLoading(true);
            const response = await getBalanceHistoryAgencyById(payload);
            setBalanceList(response.data.logs);
            setCurrentPage(page);
            setIsLoading(false);
        } catch (error) {
            console.log(getErrorMessage(error))
        }
    }

    const handlePageChange = (page: number) => {
        getBalanceHistory({}, page)
    }

    const columns = useMemo(
        () => [
            { label: "Txn Type", key: "transactionType", sortable: true },
            { label: "TID", key: "transactionId", sortable: true },
            { label: "Pay Mode", key: "payMode", sortable: true },
            { label: "Amount", key: "differenceAmount", sortable: true },
            { label: "Current Balance", key: "newBalance", sortable: true },
            { label: "Pay Date", key: "payDate", sortable: true },
            { label: "Remark", key: "remark", sortable: false },
            { label: "Entry Date", key: "entryDate", sortable: true },
        ],
        []
    );

    const tableData = balanceList.map((item, index) => ({
        ...item,
        differenceAmount:
            <p className={`font-bold ${item.newBalance - item.previousBalance > 0 ? "text-green-500" : "text-red-500"}`}>
                {item.newBalance - item.previousBalance > 0 ? `+${item.newBalance - item.previousBalance}` : item.newBalance - item.previousBalance}
            </p>,
        payDate: moment(item.createdOn).format('DD-MM-YYYY'),
        entryDate: moment(item.createdOn).format('DD-MM-YYYY, HH:mm A'),
    }));


    const router = useRouter();

    const searchParams = useSearchParams();
    const idFromUrl = searchParams.get('id');
    const nameFromUrl = searchParams.get('name');

    return (
        <AuthUserReusableCode pageTitle="View History" isLoading={isLoading}>
            <ReactTable
                additionalDataBetweenTableAndAction={<div className='px-4 py-2 mb-4 text-sm rounded-md bg-lightThemeColor' style={{
                    background: 'rgba(197, 211, 233, 0.2)'
                }}>
                    Viewing History of Agency ID {idFromUrl} - {nameFromUrl}
                </div>}
                additionalData={<div className="grid grid-cols-7 gap-4">
                    <CustomizedInputWithLabel
                        label="From Date"
                        containerClass='col-span-3'
                        value={dateRange.fromDate}
                        type='date'
                        onChange={(e) => setDateRange((prev) => ({ ...prev, fromDate: e.target.value }))}
                    />
                    <CustomizedInputWithLabel
                        label="To Date"
                        containerClass='col-span-3'
                        value={dateRange.toDate}
                        type='date'
                        onChange={(e) => setDateRange((prev) => ({ ...prev, toDate: e.target.value }))}
                    />
                    <Button className='self-end' onClick={() => getBalanceHistory({})}>
                        Apply Filter
                    </Button>
                </div>}
                data={tableData}
                columns={columns}
                fileName='ViewAgencyHistory'
                dynamicPagination
                itemsPerPage={tableDataPerPage}
                pageNumber={currentPage}
                onPageChange={handlePageChange}
            />
            {/* pagination to be added */}
        </AuthUserReusableCode >
    );
};

export default ViewHistory;
