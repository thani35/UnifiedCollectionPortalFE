"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { rechargeSchemaCollector, RechargeCollectorFormData } from "@/lib/zod";
import CustomizedInputWithLabel from "@/components/CustomizedInputWithLabel";
import CustomizedSelectInputWithLabel from "@/components/CustomizedSelectInputWithLabel";
import { Button } from "@/components/ui/button";
import AuthUserReusableCode from "@/components/AuthUserReusableCode";
import { Loader2 } from "lucide-react";
import { getAllAgentByAgencyId, getRechargeableBalance, rechargeAgentById } from "@/app/api-calls/agency/api";
import { getErrorMessage, numberToWords } from "@/lib/utils";
import { getAgencyById, getAgencyRechargeableBalance, getAgentByPhoneNumber } from "@/app/api-calls/department/api";
import { useSession } from "next-auth/react";

const RechargeEntry = () => {

    const { data: session } = useSession();
    const currentUserId = session?.user?.userId

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        setError,
        clearErrors,
        reset
    } = useForm<RechargeCollectorFormData>({
        resolver: zodResolver(rechargeSchemaCollector),
    });

    const [isLoading, setIsLoading] = useState(false);
    const [agencies, setAgencies] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [rechargeAbleBalance, setRechargeableBalance] = useState('');

    const getAgentList = async () => {
        setIsLoading(true);
        try {
            const response = await getAllAgentByAgencyId(currentUserId);
            console.log("API Response:", response);
            setAgencies(
                response?.data?.map((item) => ({
                    ...item,
                    label: item.agent_name,
                    value: item.id,
                }))
            );

        } catch (error) {
            console.error("Failed to get agent:", error?.data[Object.keys(error?.data)[0]]);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        getAgentList()
        getAgencyBalance()
    }, []);

    const getAgencyBalance = async () => {
        setIsLoading(true);
        try {
            const response = await getAgencyRechargeableBalance(currentUserId);
            console.log("API recharge:", response);
            setRechargeableBalance(
                response?.data?.rechargeableAgentWalletBalance
            );

        } catch (error) {
            console.error("Failed to get agent:", error?.data[Object.keys(error?.data)[0]]);
        } finally {
            setIsLoading(false);
        }
    }

    const onSubmit = async (data: RechargeCollectorFormData) => {
        let payload = {
            "agent_id": data.agencyId,
            "recharge_amount": data.amount,
            "remarks": data.remark
        }
        try {
            setIsSubmitting(true);
            const response = await rechargeAgentById(payload, currentUserId);
            toast.success("Agent recharged successfully");
            console.log("API Response:", response);
            getAgencyBalance()
            // location.reload()
            reset();
        } catch (error) {
            let errorMessage = getErrorMessage(error);
            console.log(errorMessage)
            toast.error('Error: ' + errorMessage)
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedAgency = watch('collectorMobile');
    const formData = watch();

    useEffect(() => {
        if (selectedAgency) {
            const agency = agencies.find((item) => item.id === Number(selectedAgency));
            if (agency) {
                setValue('agencyId', agency.id || null);
                setValue('agencyName', agency.agent_name || '');
                setValue('phoneNumber', agency.primary_phone || '');
                setValue('transactionType', 'Recharge')
                setValue('currentBalance', agency.current_balance);
                setValue('maximumRecharge', agency.maximum_limit)
            }
        }
    }, [selectedAgency, agencies, setValue]);

    const [showRestFields, setShowRestFields] = useState(false);

    const handleGetAgentData = async () => {
        const mobileNumber = Number(watch('collectorMobile'));
        if (!isNaN(mobileNumber) && mobileNumber.toString().length === 10) {
            try {
                setIsLoading(true);
                const response = await getAgentByPhoneNumber(mobileNumber);
                setValue('agencyName', response.data.agent_name)
                setValue('agencyId', response.data.id)
                setValue('phoneNumber', response.data.primary_phone || '');
                setValue('transactionType', 'Recharge')
                setValue('currentBalance', response.data.current_balance);
                setValue('maximumRecharge', response?.data?.maximum_limit)
                setShowRestFields(true)
            } catch (error) {
                let errorMessage = getErrorMessage(error);
                toast.error('Error: ' + errorMessage)
                setShowRestFields(false)
            } finally {
                setIsLoading(false);
            }
        } else {
            setError("collectorMobile", {
                type: "manual",
                message: "Please enter a valid 10-digit mobile number.",
            });
            return;
        }
    }

    return (
        <AuthUserReusableCode pageTitle="Recharge Agent" isLoading={isLoading}>
            <div className="mb-4 p-2 bg-lightThemeColor rounded-md">
                <span className="text-sm">
                    Available Agency Balance For Recharge : ₹ {rechargeAbleBalance}
                </span>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className='space-y-2'>
                    <div className="col-span-2">
                        <CustomizedInputWithLabel
                            label="Collector Mobile"
                            type="text"
                            {...register('collectorMobile', { valueAsNumber: true })}
                            onChange={() => {
                                clearErrors("collectorMobile")
                                setValue('agencyId', null)
                                setValue('agencyName', '')
                                setValue('phoneNumber', null)
                                setValue('transactionType', null)
                                setValue('currentBalance', null)
                                setShowRestFields(false)
                            }}
                            errors={errors.collectorMobile}
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
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <CustomizedInputWithLabel
                                label="Agency ID"
                                required={true}
                                errors={errors.agencyId}
                                disabled
                                {...register("agencyId", { valueAsNumber: true })}
                            />
                            <CustomizedInputWithLabel
                                label="Phone Number"
                                required={true}
                                errors={errors.phoneNumber}
                                disabled
                                {...register("phoneNumber")}
                            />
                            <CustomizedInputWithLabel
                                label="Agency Name"
                                required={true}
                                errors={errors.agencyName}
                                disabled
                                {...register("agencyName")}
                            />
                            <CustomizedInputWithLabel
                                label="Transaction Type"
                                required={true}
                                errors={errors.transactionType}
                                disabled
                                {...register("transactionType")}
                            />
                            <CustomizedInputWithLabel
                                label="Maximum Recharge Possible"
                                required={true}
                                errors={errors.maximumRecharge}
                                disabled
                                type="number"
                                {...register("maximumRecharge", { valueAsNumber: true })}
                            />
                            <CustomizedInputWithLabel
                                label="Amount"
                                required={true}
                                errors={errors.amount}
                                placeholder="Enter Amount"
                                disabled={!showRestFields}
                                type="number"
                                {...register("amount", { valueAsNumber: true })}
                            />

                            <CustomizedInputWithLabel
                                label="Current Balance"
                                required={true}
                                errors={errors.currentBalance}
                                placeholder="Current Balance"
                                type="number"
                                disabled
                                {...register("currentBalance")}
                            />
                            <CustomizedInputWithLabel
                                label="Remark"
                                containerClass="col-span-2"
                                errors={errors.remark}
                                disabled={!showRestFields}
                                placeholder="Any Remark"
                                {...register("remark")}
                            />
                        </div>

                        <div className="mt-4 p-4 border rounded-md flex bg-white">
                            <div className='flex-1 capitalize'>
                                <p>Recharge Amount: <span className='text-green-800'>{numberToWords(formData.amount)}</span></p>
                                <p>Current Balance: {numberToWords(formData.currentBalance)}</p>
                            </div>
                            <div className='self-center'>
                                <Button type="submit" variant="default" disabled={isSubmitting || !showRestFields}>
                                    {isSubmitting ? <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                                    </> : "Submit"}
                                </Button>
                            </div>
                        </div>
                    </>
                }
            </form>
        </AuthUserReusableCode>
    );
};

export default RechargeEntry;
