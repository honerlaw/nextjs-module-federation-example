

let isCached = false

export async function waitToComplete() {
    if (isCached) {
        return
    }
    return new Promise<void>((resolve) => {
        const timer = () => {
            setTimeout(() => {
                if (!isCached) {
                    return timer()
                }
                resolve()
            }, 50)
        }

        timer()
    })
}

export async function init() {
    // basically just fetch various package and write them to disk in the appropriate location
    // so that we can then require them via externals
    console.log("called")

    return new Promise<void>((resolve) => {
        setTimeout(() => {
            isCached = true
            resolve()
        }, 500)
    })
}