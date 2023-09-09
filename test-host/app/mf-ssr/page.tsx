import { TestStateComp } from "@/components/TestStateComp"
import React from "react"

import { NoStateComp } from "test-lib"

export default async function Page() {

    return <div>
        <NoStateComp />
        <TestStateComp />
    </div>

}