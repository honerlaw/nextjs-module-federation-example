"use client"

import React, { Suspense, useEffect, useState } from "react"

const Component = React.lazy(() => {
    return import("test-lib/StateComp").then((res) => {
        return {
            default: res.StateComp
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