"use client"

import React, { Suspense } from "react"

const Component = React.lazy(() => {
    return import("test-lib/StateComp").then((res) => {
        return {
            default: res.StateComp
        }
    })
})

export const TestStateComp: React.FC = () => {
    return <Suspense>
        <Component />
    </Suspense>
}