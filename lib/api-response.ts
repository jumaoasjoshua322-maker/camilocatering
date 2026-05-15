import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, data },
    { status }
  );
}

export function errorResponse(error: string, status = 400) {
  return NextResponse.json<ApiResponse>(
    { success: false, error },
    { status }
  );
}

export function unauthorizedResponse() {
  return errorResponse("Unauthorized", 401);
}

export function forbiddenResponse() {
  return errorResponse("Forbidden", 403);
}

export function notFoundResponse(resource = "Resource") {
  return errorResponse(`${resource} not found`, 404);
}
