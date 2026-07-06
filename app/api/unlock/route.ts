import { NextResponse } from "next/server";
import {
  createSessionCookieValue,
  isPasswordConfigured,
  isValidPassword,
  PASSWORD_COOKIE,
  PASSWORD_COOKIE_MAX_AGE,
} from "../../password-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const redirectUrl = new URL("/", request.url);

  if (!isPasswordConfigured()) {
    redirectUrl.searchParams.set("error", "missing");
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!(await isValidPassword(password))) {
    redirectUrl.searchParams.set("error", "1");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const response = NextResponse.redirect(redirectUrl, 303);
  response.cookies.set(PASSWORD_COOKIE, await createSessionCookieValue(), {
    httpOnly: true,
    maxAge: PASSWORD_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
  });

  return response;
}
