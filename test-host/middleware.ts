import { NextRequest, NextResponse } from "next/server";
import { init, waitToComplete } from "./utils/cacheWarmer";

// unfortunately this doesn't really work as expected, but it does only run it once
init();

export async function middleware(request: NextRequest) {
    await waitToComplete();


    return NextResponse.next();
}
   