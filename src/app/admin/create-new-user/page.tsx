'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ReactTable from '@/components/ReactTable';
import { Button } from '@/components/ui/button';
import AuthUserReusableCode from '@/components/AuthUserReusableCode';
import { getErrorMessage, urlsListWithTitle } from '@/lib/utils';
import { activateSupervisorUser, deactivateSupervisorUser, getListOfAllUsers } from '@/app/api-calls/admin/api';
import moment from 'moment';
import { FileCog, Power, PowerOff } from 'lucide-react';
import AlertPopup from '@/components/Agency/ViewAgency/AlertPopup';


const CreateUserConfiguration = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState([]);

    const columns = [
        { label: 'User ID', key: 'id', sortable: true },
        { label: 'User Role', key: 'user_role', sortable: true },
        { label: 'Name', key: 'user_name', sortable: true },
        { label: 'Mobile Number', key: 'mobile_number', sortable: true },
        { label: 'Created at', key: 'formattedDate', sortable: true },
        { label: 'Working Office Level', key: 'working_level_office', sortable: true },
        { label: 'Working Office Name', key: 'working_office_name', sortable: true },
    ];

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getListOfAllUsers();
            setUsers(data?.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const structureTableData = users.map((item, index) => ({
        ...item,
        formattedDate: moment(item.created_at).format('DD/MM/YYYY, HH:mm:ss A'),
        working_level_office: item?.working_level_office?.office_structure_level_name,
        working_office_name: item?.working_level_office?.office_description,
    }));

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <AuthUserReusableCode pageTitle='Create new User' isLoading={isLoading}>
            <div className='px-2'>
                <ReactTable
                    data={structureTableData}
                    columns={columns}
                    customActionButton={<Button variant="default" size="lg"
                        onClick={() => router.push(urlsListWithTitle.createNewUserForm.url)}
                    >
                        <FileCog />Create
                    </Button>}
                />
            </div>
        </AuthUserReusableCode >
    );
};

export default CreateUserConfiguration;
