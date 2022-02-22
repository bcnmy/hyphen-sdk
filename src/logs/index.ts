export type Log = {
    info: (message: string | object) => void,
    error: (message: string | object) => void,
    debug: (message: string | object) => void,
    warn: (message: string | object) => void
}

const log: Log = {
    info : (message: string | object) => {
        console.info(message);
    },
    error : (message: string | object) => {
        console.error(message);
    },
    debug : (message: string | object) => {
        console.debug(message);
    },
    warn : (message: string | object) => {
        console.warn(message);
    }
}

export {log};