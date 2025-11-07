'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AuthUserReusableCode from '@/components/AuthUserReusableCode';
import CustomizedInputWithLabel from '@/components/CustomizedInputWithLabel';
import ReactTable from '@/components/ReactTable';
import { Button } from '@/components/ui/button';
import { getErrorMessage, tableDataPerPage, exportPicklist } from '@/lib/utils';
import CustomizedSelectInputWithLabel from '@/components/CustomizedSelectInputWithLabel';
import { getLevels, getLevelsDiscomId } from '@/app/api-calls/department/api';
import { getSummaryReport, downloadSummaryReport } from '@/app/api-calls/report/api';
import { getCollectorTypes } from '@/app/api-calls/agency/api';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SummaryReportData, summaryReportSchema } from '@/lib/zod';
import CustomizedMultipleSelectInputWithLabelNumber from '@/components/CustomizedMultipleSelectInputWithLabelNumber';
import { toast } from 'sonner';

const REPORT_TYPE_OPTIONS = [
    { label: 'Collector Wise', value: 'collector_wise' },
    { label: 'Summary', value: 'summary' }
];

const SummaryReport = () => {
    const { data: session } = useSession();

    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [dataList, setDataList] = useState([]);
    const [showTable, setShowTable] = useState(false);
    const [exportType, setExportType] = useState('');
    const [collectorTypeList, setCollectorTypeList] = useState([]);

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<SummaryReportData>({
        resolver: zodResolver(summaryReportSchema),
        defaultValues: {
            applicableLevel: null,
            circle: [],
            division: [],
            subDivision: [],
            section: [],
            pageSize: tableDataPerPage,
            collectorType: null,
            reportType: REPORT_TYPE_OPTIONS[0].value
        }
    });

    const formData = watch();
    const reportType = formData?.reportType || REPORT_TYPE_OPTIONS[0].value;
    const isSummaryReport = reportType === 'summary';

    useEffect(() => {
        setExportType('');
        setShowTable(false);
        setDataList([]);
        setCurrentPage(1);
        setTotalPages(1);
    }, [reportType]);

    useEffect(() => {
        getWorkingLevel();
        getCircles(session?.user?.discomId);
        getCollectorTypePicklist();
    }, []);

    const [levelNameMappedWithId, setLevelNameMappedWithId] = useState<Record<string, number>>({});
    const [workingLevelList, setWorkingLevelList] = useState([]);

    const getWorkingLevel = async () => {
        setIsLoading(true);
        await getLevels(session?.user?.discomId).then((data) => {
            let levelIdMap = data?.data
                ?.filter((item) => item.levelType === "MAIN")
                .reduce((acc, item) => {
                    let levelName = item.levelName.replace(' ', "_");
                    acc[levelName] = item.id;
                    return acc;
                }, {});

            setValue('levelWithIdMap', levelIdMap);

            setWorkingLevelList(data?.data
                ?.filter((item) => item.levelType === "MAIN")
                ?.map((item) => ({
                    label: item.levelName,
                    value: item.id,
                })));
            setLevelNameMappedWithId(levelIdMap);
        });
        setIsLoading(false);
    };

    const getCollectorTypePicklist = async () => {
        setIsLoading(true);
        await getCollectorTypes().then((data) => {
            setCollectorTypeList(data?.data?.map((item) => ({
                label: item?.name,
                value: Number(item?.id)
            })));
        }).finally(() => { setIsLoading(false); });
    };

    const getReportData = async (applyFilter = {}, page = 1) => {
        const payload = {
            page,
            page_size: formData?.pageSize || tableDataPerPage,
            filter: {
                ...applyFilter
            }
        };

        try {
            setIsLoading(true);
            const response = await getSummaryReport(reportType, payload);
            const rows = Array.isArray(response?.data?.data)
                ? response.data.data
                : Array.isArray(response?.data)
                    ? response.data
                    : [];
            const totalPagesFromResponse = response?.data?.totalPages
                ?? response?.data?.total_pages
                ?? 1;

            setShowTable(true);
            setDataList(rows ?? []);
            setCurrentPage(page);
            setTotalPages(totalPagesFromResponse);
        } catch (error) {
            toast.error('Error: ' + getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };



    const columns = useMemo(() => {
        if (isSummaryReport) {
            const divisionLabel = dataList?.[0]?.office_level_name || 'Division';
            return [
                { label: divisionLabel, key: 'office_name', sortable: true },
                { label: 'Total User', key: 'total_user', align: 'center', sortable: true },
                { label: 'Active IDs', key: 'active_ids', align: 'center', sortable: true },
                { label: '<10AM', key: 'before_10am_combined', align: 'center' },
                { label: '10-12PM', key: 'between_10am_12pm_combined', align: 'center' },
                { label: '12-03PM', key: 'between_12pm_3pm_combined', align: 'center' },
                { label: '03-06PM', key: 'between_3pm_6pm_combined', align: 'center' },
                { label: '>06PM', key: 'after_6pm_combined', align: 'center' },
                { label: 'Total MR', key: 'total_mr', align: 'center', sortable: true },
                { label: 'Total Denial', key: 'total_denial', align: 'center', sortable: true },
                { label: 'Total Amount', key: 'total_collection', align: 'center', sortable: true }
            ];
        }

        return [
            { label: 'Circle', key: 'level_1_name', sortable: true },
            { label: 'Division', key: 'level_2_name', sortable: true },
            { label: 'Sub Division', key: 'level_3_name', sortable: true },
            { label: 'Section', key: 'level_4_name', sortable: true },
            { label: 'Agency Name', key: 'agency_name', sortable: true },
            { label: 'Collector Type', key: 'agent_type', sortable: true },
            { label: 'User ID', key: 'agent_id', sortable: true },
            { label: 'Collector Name', key: 'agent_name', sortable: true },
            { label: '<10AM', key: 'before_10am_combined', align: 'center' },
            { label: '10-12PM', key: 'between_10am_12pm_combined', align: 'center' },
            { label: '12-03PM', key: 'between_12pm_3pm_combined', align: 'center' },
            { label: '03-06PM', key: 'between_3pm_6pm_combined', align: 'center' },
            { label: '>06PM', key: 'after_6pm_combined', align: 'center' },
            { label: 'Total MR', key: 'total_mr', align: 'center', sortable: true },
            { label: 'Total Denial', key: 'total_denial', align: 'center', sortable: true },
            { label: 'Total Collection', key: 'total_collection', align: 'center', sortable: true }
        ];
    }, [isSummaryReport, dataList]);

    // Prepare data for table to support cell formatting
    const processedDataList = useMemo(() => {
        const rows = dataList.map(row => ({
            ...row,
            before_10am_combined: `${row.before_10am_collections ?? 0} / ${row.before_10am_denials ?? 0}`,
            between_10am_12pm_combined: `${row.between_10am_12pm_collections ?? 0} / ${row.between_10am_12pm_denials ?? 0}`,
            between_12pm_3pm_combined: `${row.between_12pm_3pm_collections ?? 0} / ${row.between_12pm_3pm_denials ?? 0}`,
            between_3pm_6pm_combined: `${row.between_3pm_6pm_collections ?? 0} / ${row.between_3pm_6pm_denials ?? 0}`,
            after_6pm_combined: `${row.after_6pm_collections ?? 0} / ${row.after_6pm_denials ?? 0}`,
            total_mr: row.total_mr ?? 0,
            total_denial: row.total_denial ?? 0,
            total_collection: row.total_collection ?? 0,
            total_user: row.total_user ?? 0,
            active_ids: row.active_ids ?? 0
        }));

        if (isSummaryReport && rows.length > 0) {
            const sum = (field) => dataList.reduce((acc, item) => acc + Number(item?.[field] ?? 0), 0);
            const combine = (collectionField, denialField) => `${sum(collectionField)} / ${sum(denialField)}`;

            rows.push({
                office_level_name: dataList?.[0]?.office_level_name ?? 'Total',
                office_name: 'Total',
                total_user: sum('total_user'),
                active_ids: sum('active_ids'),
                before_10am_collections: sum('before_10am_collections'),
                before_10am_denials: sum('before_10am_denials'),
                before_10am_combined: combine('before_10am_collections', 'before_10am_denials'),
                between_10am_12pm_collections: sum('between_10am_12pm_collections'),
                between_10am_12pm_denials: sum('between_10am_12pm_denials'),
                between_10am_12pm_combined: combine('between_10am_12pm_collections', 'between_10am_12pm_denials'),
                between_12pm_3pm_collections: sum('between_12pm_3pm_collections'),
                between_12pm_3pm_denials: sum('between_12pm_3pm_denials'),
                between_12pm_3pm_combined: combine('between_12pm_3pm_collections', 'between_12pm_3pm_denials'),
                between_3pm_6pm_collections: sum('between_3pm_6pm_collections'),
                between_3pm_6pm_denials: sum('between_3pm_6pm_denials'),
                between_3pm_6pm_combined: combine('between_3pm_6pm_collections', 'between_3pm_6pm_denials'),
                after_6pm_collections: sum('after_6pm_collections'),
                after_6pm_denials: sum('after_6pm_denials'),
                after_6pm_combined: combine('after_6pm_collections', 'after_6pm_denials'),
                total_mr: sum('total_mr'),
                total_denial: sum('total_denial'),
                total_collection: sum('total_collection'),
                is_total_row: true
            });
        }

        return rows;
    }, [dataList, isSummaryReport]);

    const getPayload = (data) => {
        const filter: Record<string, any> = {
            transaction_date_range: {
                from_date: data.fromDate,
                to_date: data.toDate
            }
        };

        if (data.reportType === 'summary') {
            filter.report_type = data.reportType;
        }

        if (typeof data.collectorType === 'number' && !Number.isNaN(data.collectorType)) {
            filter.collector_type_id = data.collectorType;
        }

        if (data.applicableLevel) {
            const officeStructureId = data.applicableLevel === levelNameMappedWithId.CIRCLE
                ? data?.circle?.map(Number)?.[0]
                : data.applicableLevel === levelNameMappedWithId.DIVISION
                    ? data?.division?.map(Number)?.[0]
                    : data.applicableLevel === levelNameMappedWithId.SUB_DIVISION
                        ? data?.subDivision?.map(Number)?.[0]
                        : data.applicableLevel === levelNameMappedWithId.SECTION
                            ? data?.section?.map(Number)?.[0]
                            : null;

            if (officeStructureId != null) {
                filter.office_structure_id = officeStructureId;
            }
        }

        return filter;
    };

    const onSubmit = (data) => {
        const filter = getPayload(data);
        getReportData(filter, 1);
    };

    const [circles, setCircles] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [subDivisions, setSubDivisions] = useState([]);
    const [sections, setSections] = useState([]);

    const getCircles = async (id) => {
        setIsLoading(true);
        await getLevelsDiscomId(id).then((data) => {
            setCircles(
                data?.data?.officeStructure?.map((ite) => {
                    return {
                        value: ite.id,
                        label: ite.office_description,
                    };
                })
            );
        }).finally(() => { setIsLoading(false); });
    };

    const getDivisions = async (id) => {
        setIsLoading(true);
        await getLevelsDiscomId(id).then((data) => {
            setDivisions(
                data?.data?.officeStructure?.map((ite) => {
                    return {
                        value: ite.id,
                        label: ite.office_description,
                    };
                })
            );
        }).finally(() => { setIsLoading(false); });
    };

    const getSubDivisions = async (id) => {
        setIsLoading(true);
        await getLevelsDiscomId(id).then((data) => {
            setSubDivisions(
                data?.data?.officeStructure?.map((ite) => {
                    return {
                        value: ite.id,
                        label: ite.office_description,
                    };
                })
            );
        }).finally(() => { setIsLoading(false); });
    };

    const getSections = async (id) => {
        setIsLoading(true);
        await getLevelsDiscomId(id).then((data) => {
            setSections(
                data?.data?.officeStructure?.map((ite) => {
                    return {
                        value: ite.id,
                        label: ite.office_description,
                    };
                })
            );
        }).finally(() => { setIsLoading(false); });
    };

    const handleWorkingLevelChange = (selectedValue) => {
        if (!selectedValue.target.value) {
            setValue('applicableLevel', null);
            setValue('circle', []);
            setValue('division', []);
            setValue('subDivision', []);
            setValue('section', []);
            return;
        }
        setValue('applicableLevel', parseInt(selectedValue.target.value));
        setValue('circle', []);
        setValue('division', []);
        setValue('subDivision', []);
        setValue('section', []);

        getCircles(session?.user?.discomId);
    };

    const handleCircleChange = (selectedValue) => {
        setValue('circle', selectedValue);
        setValue('division', []);
        setValue('subDivision', []);
        setValue('section', []);
        if (selectedValue.length > 0) {
            getDivisions(selectedValue?.[0]);
        }
    };

    const handleDivisionChange = (selectedValue) => {
        setValue('division', selectedValue);
        setValue('subDivision', []);
        setValue('section', []);
        if (selectedValue.length > 0) {
            getSubDivisions(selectedValue?.[0]);
        }
    };

    const handleSubDivisionChange = (selectedValue) => {
        setValue('subDivision', selectedValue);
        setValue('section', []);
        if (selectedValue.length > 0) {
            getSections(selectedValue?.[0]);
        }
    };

    const handleSectionChange = (selectedValue) => {
        setValue('section', selectedValue);
    };

    const handleExportFile = async (data, type = 'csv') => {
        const selectedReportType = data?.reportType || reportType;

        setExportType(type);
        try {
            setIsLoading(true);
            const payload = getPayload(data);

            const response = await downloadSummaryReport(selectedReportType, payload, type);

            const contentDisposition = response.headers["content-disposition"];
            let filename = "SummaryReport";

            if (contentDisposition) {
                const matches = contentDisposition.match(/filename="(.+)"/);
                if (matches && matches.length > 1) {
                    filename = matches[1];
                }
            }

            const contentType = response.headers["content-type"] || "application/octet-stream";
            const blob = new Blob([response.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = filename.includes(`.${type}`) ? filename : `${filename}.${type}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Error: ' + getErrorMessage(error));
        } finally {
            setIsLoading(false);
            setExportType('');
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        let payload = getPayload(formData);
        getReportData(payload, page);
    };

    // find time slot keys in columns array
    const groupedHeaders = [
        {
            label: isSummaryReport ? 'Time Slot Mapping of Active Users (MR/Denied)' : 'Time Slot (MR/Denied)',
            from: 'before_10am_combined',
            to: 'after_6pm_combined',
        }
    ];

    return (
        <AuthUserReusableCode pageTitle="Summary Report" isLoading={isLoading}>
            <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-4">
                <div className="grid grid-cols-6 gap-4 flex-grow">
                    <CustomizedInputWithLabel
                        label="From Date"
                        type="date"
                        required
                        {...register('fromDate')}
                        errors={errors.fromDate}
                    />
                    <CustomizedInputWithLabel
                        label="To Date"
                        required
                        type="date"
                        {...register('toDate')}
                        errors={errors.toDate}
                    />
                    <CustomizedSelectInputWithLabel 
                        label='Applicable Level' 
                        list={workingLevelList}
                        {...register('applicableLevel', { valueAsNumber: true })}
                        onChange={(e) => handleWorkingLevelChange(e)} 
                        errors={errors?.applicableLevel} 
                    />
                    {formData.applicableLevel != null && !isNaN(formData?.applicableLevel) &&
                        <>
                            <CustomizedMultipleSelectInputWithLabelNumber
                                label="Circle"
                                errors={errors.circle}
                                required={true}
                                list={circles}
                                placeholder="Select Circle"
                                value={watch('circle') || []}
                                onChange={(selectedValues) => handleCircleChange(selectedValues)}
                            />
                            {formData.applicableLevel != null && formData.applicableLevel != levelNameMappedWithId.CIRCLE && (
                                <CustomizedMultipleSelectInputWithLabelNumber
                                    label="Division"
                                    required={true}
                                    list={divisions}
                                    disabled={formData?.circle?.length == 0}
                                    value={watch('division') || []}
                                    onChange={(selectedValues) => handleDivisionChange(selectedValues)}
                                    errors={errors.division}
                                />
                            )}
                            {
                                formData.applicableLevel != null && (formData.applicableLevel == levelNameMappedWithId.SECTION
                                    || formData.applicableLevel == levelNameMappedWithId.SUB_DIVISION) && (
                                    <CustomizedMultipleSelectInputWithLabelNumber
                                        label="Sub Division"
                                        errors={errors.subDivision}
                                        placeholder="Select Sub Division"
                                        list={subDivisions}
                                        required={true}
                                        disabled={formData?.division?.length == 0}
                                        value={watch('subDivision') || []}
                                        onChange={(selectedValues) => handleSubDivisionChange(selectedValues)}
                                    />
                                )
                            }
                            {
                                formData.applicableLevel != null && formData.applicableLevel == levelNameMappedWithId.SECTION && (
                                    <CustomizedMultipleSelectInputWithLabelNumber
                                        label="Section"
                                        errors={errors.section}
                                        placeholder="Select Section"
                                        list={sections}
                                        required={true}
                                        disabled={formData?.subDivision?.length == 0}
                                        value={watch('section') || []}
                                        onChange={(selectedValues) => handleSectionChange(selectedValues)}
                                    />
                                )
                            }
                        </>
                    }
                    <CustomizedSelectInputWithLabel 
                        label='Report Type' 
                        required
                        list={REPORT_TYPE_OPTIONS}
                        {...register('reportType', { onChange: () => setShowTable(false) })} 
                        errors={errors?.reportType} 
                    />
                    <CustomizedSelectInputWithLabel 
                        label='Collector Type' 
                        list={collectorTypeList}
                        {...register('collectorType', { valueAsNumber: true })} 
                        errors={errors?.collectorType} 
                    />
                    <CustomizedSelectInputWithLabel
                        label="Export"
                        placeholder='Export to'
                        list={exportPicklist}
                        value={exportType}
                        onChange={(e) => {
                            const selectedExportType = e.target.value;
                            if (selectedExportType) {
                                handleSubmit((data) => handleExportFile(data, selectedExportType))();
                            }
                        }}
                    />
                    <CustomizedInputWithLabel 
                        label='Page Size'
                        required
                        {...register('pageSize', { valueAsNumber: true })} 
                        errors={errors?.pageSize} 
                    />

                    <div className='self-end mb-1'>
                        <Button variant='default' type='submit'>Search</Button>
                    </div>
                </div>
            </form>

            <div className="overflow-x-auto mb-4 mt-4">
                {showTable && <ReactTable
                    data={processedDataList} // <--- use processed data
                    columns={columns}
                    groupedHeaders={groupedHeaders} // <-- add this line
                    hideSearchAndOtherButtons
                    dynamicPagination
                    itemsPerPage={tableDataPerPage+1}
                    pageNumber={currentPage}
                    onPageChange={handlePageChange}
                    totalPageNumber={totalPages}
                />}
            </div>
        </AuthUserReusableCode>
    );
};

export default SummaryReport;
