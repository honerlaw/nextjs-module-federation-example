import React, { Suspense, lazy } from "react"
import { TestStateComp } from "@/components/TestStateComp"

const NoStateComp = lazy(() => {
    return import("test-lib/NoStateComp").then((res) => {
        return {
            default: res.NoStateComp
        }
    })
})

export default async function Page() {

    return <div>
        <TestStateComp />
        <Suspense>
            <NoStateComp />
        </Suspense>
    </div>

}