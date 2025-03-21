'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import CustomizedSelectInputWithLabel from '@/components/CustomizedSelectInputWithLabel';
import CustomizedInputWithLabel from '@/components/CustomizedInputWithLabel';
import AuthUserReusableCode from '@/components/AuthUserReusableCode';
import { editAgentAreaFormData, editAgentAreaSchema } from '@/lib/zod';
import { getAgencyById, getAgentByPhoneNumber, getLevels, getLevelsDiscomId, updateAgentAreaRole } from '@/app/api-calls/department/api';
import { collectorRolePicklist, getErrorMessage } from '@/lib/utils';
import CustomizedMultipleSelectInputWithLabelNumber from '@/components/CustomizedMultipleSelectInputWithLabelNumber';
import { toast } from 'sonner';
import AlertPopupWithState from '@/components/Agency/ViewAgency/AlertPopupWithState';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

const EditAgentAreaRoleForm = () => {
    const { data: session } = useSession()

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
        setError,
        reset,
        clearErrors
    } = useForm<editAgentAreaFormData>({
        resolver: zodResolver(editAgentAreaSchema)
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [levelIdMapWithLevelName, setLevelIdMapWithLevelName] = useState({
        CIRCLE: null,
        DIVISION: null,
        SUB_DIVISION: null,
        SECTION: null
    })

    const [workingLevel, setWorkingLevel] = useState([]);

    const [circles, setCircles] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [subDivisions, setSubDivisions] = useState([]);
    const [sections, setSections] = useState([]);

    const [showRestFields, setShowRestFields] = useState(false);

    const getCircles = async (id) => {
        setIsLoading(true)
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
        setIsLoading(true)
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
        setIsLoading(true)
        await getLevelsDiscomId(id).then((data) => {
            setSubDivisions(
                data?.data?.officeStructure?.map((ite) => {
                    return {
                        value: ite.id,
                        label: ite.office_description,
                    };
                })
            );
        }).finally(() => { setIsLoading(false); })
    };

    const getSections = async (id) => {
        setIsLoading(true)
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

    const formData = watch();

    const onSubmit = async (data: editAgentAreaFormData) => {
        if (!showRestFields) {
            return
        }
        try {
            setIsSubmitting(true);
            let payload = {
                "agent_id": data.agentId,
                "collector_role": data.agentRole,
                "working_office_structure": data.workingLevel === levelIdMapWithLevelName.CIRCLE
                    ? data?.circle?.map(Number)[0]
                    : data?.workingLevel === levelIdMapWithLevelName.DIVISION
                        ? data?.division?.map(Number)[0]
                        : data?.workingLevel === levelIdMapWithLevelName.SUB_DIVISION
                            ? data?.subDivision?.map(Number)[0]
                            : data?.workingLevel === levelIdMapWithLevelName.SECTION ? data?.section?.map(Number)[0] : null,
                "working_level": Number(data?.workingLevel)
            }

            const response = await updateAgentAreaRole(payload);
            reset()
            toast.success("Agent updated successfully");
        } catch (error) {
            console.log(error);
            let errorMessage = getErrorMessage(error);
            toast.error('Error: ' + errorMessage)
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGetAgentData = async () => {
        const mobileNumber = Number(watch('agentMobileNumber'));
        if (!isNaN(mobileNumber) && mobileNumber.toString().length === 10) {
            try {
                setIsLoading(true);
                const response = await getAgentByPhoneNumber(mobileNumber);
                setValue('agentName', response.data.agent_name)
                setValue('agentId', response.data.id)
                setValue('agentRole', response.data.collector_role)
                setValue('workingLevel', (response.data.working_level))
                getAgencyData(response?.data?.agency?.id)
                handleSetAllLevelData(response.data)
                setShowRestFields(true)
            } catch (error) {
                console.log(error);
                let errorMessage = getErrorMessage(error);
                toast.error('Error: ' + errorMessage)
                setShowRestFields(false)
            } finally {
                setIsLoading(false);
            }
        } else {
            setError("agentMobileNumber", {
                type: "manual",
                message: "Please enter a valid 10-digit mobile number.",
            });
            return;
        }
    }

    const handleSetAllLevelData = async (data) => {
        try {
            handleWorkingLevelChange('')
            setIsLoading(true)
            let workingLevelId = data?.working_level;
            let workingLevelOffices = data?.working_level_offices?.map(item => item.id) || []
            let parentOfficeList = data?.parent_office_structure_hierarchy

            console.log(parentOfficeList, workingLevelOffices)

            let circleId = parentOfficeList.filter(item => item?.office_structure_level_id === levelIdMapWithLevelName.CIRCLE)
            if (circleId.length > 0) {
                setValue('circle', [circleId[0]?.id]);
                setIsLoading(true)
                let divisionId = parentOfficeList.filter(item => item?.office_structure_level_id === levelIdMapWithLevelName.DIVISION)
                console.log('division', divisionId)
                await getDivisions(circleId[0]?.id)
                if (divisionId.length > 0) {
                    setValue('division', [divisionId[0].id]);
                    setIsLoading(true)
                    let subDivisionId = parentOfficeList.filter(item => item?.office_structure_level_id === levelIdMapWithLevelName.SUB_DIVISION)
                    await getSubDivisions(divisionId[0].id)
                    if (subDivisionId.length > 0) {
                        setValue('subDivision', [subDivisionId[0].id])
                        setIsLoading(true)
                        await getSections(subDivisionId[0].id)
                        setValue('section', workingLevelOffices)
                    } else {
                        setValue('subDivision', workingLevelOffices)
                    }
                } else {
                    setValue('division', workingLevelOffices)
                }
            } else {
                setValue('circle', workingLevelOffices)
            }
        } catch (error) {
            console.log(error)
        } finally {
            setIsLoading(false)
        }
    }

    const getWorkingLevel = () => {
        getLevels(session?.user?.discomId).then((data) => {
            let levelIdMap = data?.data
                ?.filter((item) => item.levelType === "MAIN")
                .reduce((acc, item) => {
                    acc[item.levelName] = item.id;
                    return acc;
                }, {});

            setLevelIdMapWithLevelName(levelIdMap)
            console.log(levelIdMap)
            setWorkingLevel(
                data?.data
                    ?.filter((ite) => ite.levelType == "MAIN")
                    ?.map((ite) => {
                        return {
                            value: ite.id,
                            label: ite.levelName,
                        };
                    })
            );
        })
    }

    const handleWorkingLevelChange = (e) => {
        setValue("circle", []);
        setValue("division", []);
        setValue("subDivision", []);
        setValue("section", []);
    }

    const [agencyData, setAgencyData] = useState({ working_level: null, working_level_offices: [] })

    const [agencyWorkingLevel, setAgencyWorkingLevel] = useState()
    const [workingLevelActualLists, setWorkingLevelActualLists] = useState([])

    const getAgencyData = async (id: number) => {
        try {
            const agencyResponse = await getAgencyById(String(id));
            const agencyData = agencyResponse.data;
            setAgencyData(agencyData);

            const levelsResponse = await getLevels(session?.user?.discomId);
            let levels = levelsResponse?.data
                ?.filter((ite) => ite.levelType === "MAIN")
                ?.map((ite) => ({
                    value: ite.id,
                    label: ite.levelName,
                }));

            let levelIdMap = levelsResponse?.data
                ?.filter((item) => item.levelType === "MAIN")
                .reduce((acc, item) => {
                    let levelName = item.levelName.replace(' ', "_");
                    acc[levelName] = item.id;
                    return acc;
                }, {});

            setWorkingLevelActualLists(levels);
            setAgencyWorkingLevel(agencyData?.working_level);

            const agencyWorkingLevel = agencyData?.working_level;

            console.log(levels)

            handleDisplayWorkingLevel(levels, agencyWorkingLevel)
            const agencyLevel = levels.find((lvl) => lvl.value === agencyWorkingLevel);

            let levelData = agencyData?.working_level_offices.map((ite) => {
                return {
                    value: ite.id,
                    label: ite.office_description,
                };
            })

            if (agencyLevel.value == levelIdMap.CIRCLE) {
                setCircles(levelData)
            } else if (agencyLevel.value == levelIdMap.DIVISION) {
                setDivisions(levelData)
            } else if (agencyLevel.value == levelIdMap.SUB_DIVISION) {
                setSubDivisions(levelData)
            } else if (agencyLevel.value == levelIdMap.SECTION) {
                setSections(levelData)
            }

        } catch (error) {
            console.error("Error fetching agency data:", error);
        }
    };

    const handleDisplayWorkingLevel = (levels, agencyWorkingLevel) => {
        const agencyLevel = levels.find((lvl) => lvl.value === agencyWorkingLevel);

        if (agencyLevel) {
            if (formData.agentRole === 'Door To Door') {
                levels = levels.filter((lvl) => lvl.value > agencyLevel.value);
            } else {
                levels = levels.filter((lvl) => lvl.value >= agencyLevel.value);
            }
        }

        setWorkingLevel(levels);
    }

    useEffect(() => {
        getWorkingLevel()
    }, [])

    useEffect(() => {
        if (formData.agentRole) {
            handleDisplayWorkingLevel(workingLevelActualLists, agencyWorkingLevel);
        }
    }, [formData.agentRole]);

    const [stateForConfirmationPopup, setStateForConfirmationPopup] = useState(false);

    return (
        <AuthUserReusableCode pageTitle="Edit Agent Area & Role" isLoading={isLoading}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className='space-y-2'>
                    <div className="col-span-2">
                        <CustomizedInputWithLabel
                            label="Agent Mobile Number"
                            type="text"
                            {...register('agentMobileNumber', { valueAsNumber: true })}
                            onChange={() => {
                                clearErrors("agentMobileNumber")
                                setValue('agentName', '')
                                setValue('workingLevel', null)
                                setValue('agentRole', '')
                                setShowRestFields(false)
                            }}
                            errors={errors.agentMobileNumber}
                        />
                    </div>
                    <div className='text-end'>
                        <Button type="button" onClick={handleGetAgentData} disabled={isLoading}>
                            {isLoading ? 'Loading...' : 'Search'}
                        </Button>
                    </div>
                </div>

                {
                    // showRestFields &&
                    <div className="grid grid-cols-2 gap-4">
                        <CustomizedInputWithLabel
                            label="Agent Name"
                            disabled
                            errors={errors.agentName}
                            {...register('agentName')}
                        />
                        <CustomizedSelectInputWithLabel
                            label='Agent Role'
                            required
                            disabled={!showRestFields}
                            list={collectorRolePicklist}
                            {...register('agentRole')}
                            errors={errors.agentRole}
                        />
                        <CustomizedSelectInputWithLabel
                            label="Working Level"
                            errors={errors.workingLevel}
                            disabled={!showRestFields}
                            required={true}
                            placeholder="Select Working level"
                            list={workingLevel}
                            {...register("workingLevel", { valueAsNumber: true, onChange: handleWorkingLevelChange })}
                        />
                        {formData.workingLevel != null && !Number.isNaN(formData.workingLevel) && (
                            (agencyData.working_level == levelIdMapWithLevelName?.CIRCLE)) &&
                            <CustomizedMultipleSelectInputWithLabelNumber
                                label="Circle"
                                errors={errors.circle}
                                required={true}
                                list={circles}
                                placeholder="Select Circle Type"
                                value={watch('circle') || []}
                                onChange={(selectedValues) => {
                                    setValue('circle', selectedValues)
                                    if (selectedValues.length > 0 && formData.workingLevel != (levelIdMapWithLevelName.CIRCLE)) {
                                        getDivisions(selectedValues[0]);
                                        setValue('division', [])
                                    }
                                }}
                            />
                        }
                        {formData.workingLevel != null && !Number.isNaN(formData.workingLevel) &&
                            ((agencyData.working_level === levelIdMapWithLevelName?.DIVISION) ||
                                (formData.workingLevel === levelIdMapWithLevelName?.SUB_DIVISION ||
                                    formData.workingLevel === levelIdMapWithLevelName?.DIVISION ||
                                    formData.workingLevel === levelIdMapWithLevelName?.SECTION)) &&
                            (agencyData.working_level !== levelIdMapWithLevelName?.SUB_DIVISION
                                && agencyData.working_level !== levelIdMapWithLevelName?.SECTION) && (
                                <CustomizedMultipleSelectInputWithLabelNumber
                                    label="Division"
                                    required={true}
                                    list={divisions}
                                    value={watch('division') || []}
                                    onChange={(selectedValues) => {
                                        setValue('division', selectedValues)
                                        if (selectedValues.length > 0 && formData.workingLevel != (levelIdMapWithLevelName.DIVISION)) {
                                            getSubDivisions(selectedValues[0]);
                                            setValue('subDivision', [])
                                        }
                                    }}
                                    errors={errors.division}
                                />
                            )}
                        {
                            formData.workingLevel != null
                            && ((agencyData.working_level == levelIdMapWithLevelName?.SUB_DIVISION) ||
                                (formData.workingLevel == levelIdMapWithLevelName?.SECTION
                                    || formData.workingLevel == levelIdMapWithLevelName?.SUB_DIVISION)) &&
                            (agencyData.working_level != levelIdMapWithLevelName?.SECTION) && (
                                <CustomizedMultipleSelectInputWithLabelNumber
                                    label="Sub Division"
                                    errors={errors.subDivision}
                                    placeholder="Select Sub Division"
                                    list={subDivisions}
                                    required={true}
                                    value={watch('subDivision') || []}
                                    onChange={(selectedValues) => {
                                        setValue('subDivision', selectedValues)
                                        if (selectedValues.length > 0 && formData.workingLevel == (levelIdMapWithLevelName.SECTION)) {
                                            getSections(selectedValues[0]);
                                            setValue('section', [])
                                        }
                                    }}
                                />
                            )
                        }
                        {
                            formData.workingLevel != null && formData.workingLevel == levelIdMapWithLevelName.SECTION && (
                                <CustomizedMultipleSelectInputWithLabelNumber
                                    label="Section"
                                    errors={errors.section}
                                    placeholder="Select Section"
                                    list={sections}
                                    required={true}
                                    value={watch('section') || []}
                                    onChange={(selectedValues) => setValue('section', selectedValues)}
                                />
                            )
                        }
                        <div className="flex justify-end col-span-2">
                            <AlertPopupWithState
                                triggerCode={
                                    <Button
                                        variant="default"
                                        disabled={isSubmitting || !showRestFields}
                                        onClick={handleSubmit((e) => { setStateForConfirmationPopup(true); })}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                                            </>
                                        ) : (
                                            "Submit"
                                        )}
                                    </Button>
                                }
                                handleContinue={handleSubmit(onSubmit)}
                                title="Update Agent"
                                description="Are you sure you want to update the Agent Working Area/Role?"
                                continueButtonText="Yes"
                                isOpen={stateForConfirmationPopup}
                                setIsOpen={setStateForConfirmationPopup}
                            />
                            {/* <Button type="submit" disabled={isSubmitting || !showRestFields}>
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </Button> */}
                        </div>
                    </div>
                }
            </form>
        </AuthUserReusableCode >
    );
};

export default EditAgentAreaRoleForm;
