import { NextResponse } from "next/server";
import { auth } from "./app/auth";
import {
    SIGNIN,
    ROOT
} from "./lib/utils";
import { getLandingPageUrl } from "./helper";
import crypto from "crypto";

export async function middleware(request: any) {

    const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
    const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`
    // Replace newline characters and spaces
    const contentSecurityPolicyHeaderValue = cspHeader
        .replace(/\s{2,}/g, ' ')
        .trim()

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-nonce', nonce)

    requestHeaders.set(
        'Content-Security-Policy',
        contentSecurityPolicyHeaderValue
    )

    const { nextUrl } = request;
    const session = await auth();
    const isAuthenticated = !!session?.user;
    let landingPage = getLandingPageUrl(session?.user?.userScopes)

    console.log("Is Authenticated:", isAuthenticated, session);

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })
    response.headers.set(
        'Content-Security-Policy',
        contentSecurityPolicyHeaderValue
    )


    if (nextUrl.pathname === '/debug-env') {
        return response;
    }

    // if (nextUrl.pathname === '/') {
    //     return NextResponse.redirect(new URL(SIGNIN, nextUrl));
    // }

    if (!isAuthenticated) {
        if (nextUrl.pathname !== SIGNIN) {
            return NextResponse.redirect(new URL(SIGNIN, nextUrl));
        }
    } else {
        if (nextUrl.pathname === SIGNIN) {
            return NextResponse.redirect(new URL(landingPage, nextUrl));
        }
    }
    return response;
}

export const config = {
    matcher: [
        "/((?!api/|_next/static|_next/image|favicon.ico|icon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
    ],
};
