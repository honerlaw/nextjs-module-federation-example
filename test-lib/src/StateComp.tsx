import React from "react"
import { useState } from "react"

export const StateComp: React.FC = () => {
    const [value, setValue] = useState(0)

    const onClick = () => {
        setValue(value + 1)
    }

    return <div>
        hello {value}
        <button onClick={onClick}>increment</button>
    </div>
}

