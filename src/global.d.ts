import { AudioContext as Context } from './AudioContext.ts'

declare let global: never

declare global {
    // eslint-disable-next-line no-var
    var AudioContext: {
        new (): Context
    }
}
