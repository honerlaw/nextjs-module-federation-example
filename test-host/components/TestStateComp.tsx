"use client"

import React from "react"
import { NoStateComp } from "test-lib"

// console.log(StateComp)

export const TestStateComp: React.FC = () => {

    console.log(NoStateComp, "hello")

    return <NoStateComp />
}