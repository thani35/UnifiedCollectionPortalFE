'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { activateAgencyAccount, deactivateAgencyAccountAPI, getAgenciesWithDiscom, getLevels } from '@/app/api-calls/department/api';
import AuthUserReusableCode from '@/components/AuthUserReusableCode';
import { CalendarArrowUp, Pencil, UserCheck, UserX } from 'lucide-react';
import { testDiscom } from '@/lib/utils';
import ReactTable from '@/components/ReactTable';
import AlertPopup from '@/components/Agency/ViewAgency/AlertPopup';
import { useRouter } from 'next/navigation';
import CustomizedSelectInputWithLabel from '@/components/CustomizedSelectInputWithLabel';
import { Button } from '@/components/ui/button';

const ViewAgency = () => {
    const [search, setSearch] = useState('');
    const [agencyList, setAgencyList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [workingLevelFilter, setWorkingLevelFilter] = useState('all');
    const [workingLevelList, setWorkingLevelList] = useState([])
    const [selectedRow, setSelectedRow] = useState<any | null>(null);

    useEffect(() => {
        getAgencyList();
    }, []);

    const getAgencyList = async () => {
        setIsLoading(true);
        try {
            const response = await getAgenciesWithDiscom(testDiscom);
            const discomList = await getLevels(testDiscom);
            const listOfLevel = discomList.data.reduce((acc, item) => {
                acc[item.id] = item.levelName;
                return acc;
            }, {});
            const levelOptions = discomList.data.map((item) => ({
                label: item.levelName,
                value: item.levelName,
            }));
            let data = [{ label: 'All', value: 'all' }, ...levelOptions];
            setWorkingLevelList(data)
            setAgencyList(
                response?.data?.map((item) => {
                    let data = [];
                    if (item.collection_type_energy) {
                        data.push('Enengy')
                    }
                    if (item.collection_type_non_energy) {
                        data.push('Non-Enengy')
                    }

                    item.non_energy_types.map((mode) => data.push(mode.type_name))

                    return ({
                        id: item.id,
                        agencyName: item.agency_name,
                        agencyAddress: item.agency_address,
                        contactPerson: item.contact_person,
                        phone: item.phone,
                        maxLimit: item.maximum_limit,
                        woNumber: item.wo_number,
                        validity: item.validity_end_date,
                        workingOffice: listOfLevel[item.working_level] || 'N/A',
                        workingLevelOffice: item.working_level_offices.map((mode) => mode.office_description).join(', ') || 'N/A',
                        permissions: item.collection_payment_modes.map((mode) => mode.mode_name).join(", ") || 'N/A',
                        collectionModes: data.join(', ') || 'N/A',
                        isActive: item.is_active,
                    })
                })
            );
        } catch (error) {
            console.error('Failed to get agency:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const activateAgencyUser = async (id: number) => {
        setIsLoading(true);
        try {
            await activateAgencyAccount(id);
            toast.success('Agency activated successfully');
            getAgencyList();
            setSelectedRow(null)
        } catch (error) {
            console.error('Failed to activate agency:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const deactivateAgencyUser = async (id: number) => {
        setIsLoading(true);
        try {
            await deactivateAgencyAccountAPI(id);
            toast.success('Agency deactivated successfully');
            getAgencyList();
            setSelectedRow(null)
        } catch (error) {
            console.error('Failed to deactivate agency:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const columns = useMemo(
        () => [
            { label: 'Action', key: 'action', sortable: false, ignored: true },
            { label: 'Agency ID', key: 'id', sortable: true },
            { label: 'Agency Name', key: 'agencyName', sortable: true },
            { label: 'Address', key: 'agencyAddress', sortable: true },
            { label: 'Contact Person', key: 'contactPerson', sortable: true },
            { label: 'Phone', key: 'phone', sortable: true },
            { label: 'Max Limit', key: 'maxLimit', sortable: true },
            { label: 'WO Number', key: 'woNumber', sortable: true },
            { label: 'Validity', key: 'validity', sortable: true },
            { label: 'Working Office', key: 'workingOffice', sortable: true },
            { label: 'Working Level Office', key: 'workingLevelOffice', sortable: true },
            { label: 'Permissions', key: 'permissions', sortable: true },
            { label: 'Collection Modes', key: 'collectionModes', sortable: true },
        ],
        []
    );

    const router = useRouter();

    const handleEditAgency = (id: number) => {
        router.push(`/department/edit-agency?id=${id}`);
        setIsLoading(true)
    }

    const handleExtendValidity = (id: number) => {
        router.push(`/department/extend-validity?id=${id}`);
        setIsLoading(true)
    }

    const filteredAgencies = agencyList.filter((item) => {
        const isStatusMatch =
            statusFilter === 'all' || (statusFilter === 'active' ? item.isActive : !item.isActive);
        const isWorkingLevelMatch = workingLevelFilter === 'all' || item.workingOffice === workingLevelFilter;

        return isStatusMatch && isWorkingLevelMatch;
    });

    const tableData = filteredAgencies.map((item, index) => ({
        ...item,
        action: item.isActive ? (
            <div className='flex gap-2'>
                <AlertPopup triggerCode={<UserX
                    className="cursor-pointer text-red-500"
                />} handleContinue={() => deactivateAgencyUser(item.id)}
                    title='Confirm Deactivating' description='Are you sure you want to save the deactivate Agency? Please review the details carefully before confirming.' continueButtonText='Confirm'
                />
                <Pencil className='cursor-pointer h-5 w-5' onClick={() => handleEditAgency(item.id)} />
                <CalendarArrowUp className='cursor-pointer h-5 w-5' onClick={() => handleExtendValidity(item.id)} />
            </div>
        ) : (
            <div className='flex gap-2'>
                <AlertPopup triggerCode={<UserCheck
                    className="cursor-pointer text-green-500"
                />} handleContinue={() => activateAgencyUser(item.id)}
                    title='Confirm Activating' description='Are you sure you want to save the activate Agency? Please review the details carefully before confirming.' continueButtonText='Confirm'
                />
                <Pencil className='cursor-pointer h-5 w-5' onClick={() => handleEditAgency(item.id)} />
                <CalendarArrowUp className='cursor-pointer h-5 w-5' onClick={() => handleExtendValidity(item.id)} />
            </div>
        ),
    }));

    const listOfAgencyStatus = [{
        label: 'All',
        value: 'all',
    }, {
        label: 'Active',
        value: 'active',
    }, {
        label: 'Inactive',
        value: 'inactive',
    }]

    const handleRowSelection = (row: any) => {
        console.log(row)
        setSelectedRow(row)
    }

    const getSelectedRowButton = () => {
        return <div className="space-x-2">
            {selectedRow?.isActive ? <AlertPopup triggerCode={<Button variant='destructive' className="cursor-pointer">
                <UserX />
                Deactivate
            </Button>} handleContinue={() => deactivateAgencyUser(selectedRow.id)}
                title='Confirm Deactivating' description='Are you sure you want to save the deactivate Agency? Please review the details carefully before confirming.' continueButtonText='Confirm'
            /> :
                <AlertPopup triggerCode={<Button variant='success' className="cursor-pointer">
                    <UserX />
                    Activate
                </Button>} handleContinue={() => activateAgencyUser(selectedRow.id)}
                    title='Confirm Activating' description='Are you sure you want to save the activate Agency? Please review the details carefully before confirming.' continueButtonText='Confirm'
                />}
            <Button variant='success' onClick={() => handleEditAgency(selectedRow.id)}><Pencil className='cursor-pointer h-5 w-5' />Extend Validity</Button>
            <Button variant='default' onClick={() => handleExtendValidity(selectedRow.id)} ><CalendarArrowUp className='cursor-pointer h-5 w-5' />Edit Agency</Button>
        </div>
    }

    return (
        <AuthUserReusableCode pageTitle="View Agency" isLoading={isLoading}>
            <div className="grid grid-cols-2 gap-4">
                <CustomizedSelectInputWithLabel
                    label="Agency status"
                    list={listOfAgencyStatus}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    removeDefaultOption
                />
                <CustomizedSelectInputWithLabel label="Working Level" value={workingLevelFilter}
                    list={workingLevelList} onChange={(e) => setWorkingLevelFilter(e.target.value)} removeDefaultOption />
            </div>
            <ReactTable
                data={tableData.filter((item) =>
                    item.agencyName.toLowerCase().includes(search.toLowerCase())
                )}
                isSelectable={true}
                onRowSelect={handleRowSelection}
                onRowSelectButtons={
                    getSelectedRowButton()
                }
                selectedRow={selectedRow}
                columns={columns}
            />

        </AuthUserReusableCode >
    );
};

export default ViewAgency;
