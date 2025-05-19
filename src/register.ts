import OpenSIPSJS from '@voicenter-team/opensips-js'
import { ExtraContactParams, IPCConfig } from './types'

export const register = (
    domain: string,
    username: string,
    password: string,
    pnExtraHeaders: ExtraContactParams,
    pcConfig?: IPCConfig,
    expire?: number
) => {
    const configuration = {
        session_timers: false,
        uri: `sip:${username}@${domain}`,
        password: password,
        register_expires: expire ? expire : 600,
    }
    const openSIPSJS = new OpenSIPSJS({
        configuration: configuration,
        socketInterfaces: [ `wss://${domain}` ],
        sipDomain: `${domain}`,
        pnExtraHeaders: pnExtraHeaders,
        sipOptions: {
            session_timers: false,
            extraHeaders: [ 'X-Bar: bar' ],
            pcConfig: pcConfig ? pcConfig : {},
        },
        modules: [ 'audio' ],
    })
    openSIPSJS.register()
}