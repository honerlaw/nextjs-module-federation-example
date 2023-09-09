"use client"

import React, { Suspense } from "react"

const Component = React.lazy(() => {
    return import("test-lib/NoStateComp").then((res) => {
        return {
            default: res.NoStateComp
        }
    })
})

export default function page() {
    return <div>
        hello
        <Suspense>
            <Component />
        </Suspense>
    </div>
}