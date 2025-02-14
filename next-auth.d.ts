// src/types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            mobileNumber: string;
            name: string;
            userId: string;
            uniqueUserId: number;
            accessToken: string;
            refreshToken: string;
            discomId: number;
            roleId: number;
            userRole?: string;
            userScopes?: string[];
        };
    }

    interface User {
        id: string;
        mobileNumber: string;
        name: string;
        userId: string;
        uniqueUserId: number;
        accessToken: string;
        refreshToken: string;
        discomId: number;
        roleId: number;
        userRole?: string;
        userScopes?: string[];
    }

    interface JWT {
        id: string;
        mobileNumber: string;
        name: string;
        userId: string;
        uniqueUserId: number;
        accessToken: string;
        refreshToken: string;
        discomId: number;
        roleId: number;
        userRole?: string;
        userScopes?: string[];
    }
}
