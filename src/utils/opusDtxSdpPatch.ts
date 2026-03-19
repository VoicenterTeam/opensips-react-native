/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Opus DTX SDP Patch for react-native-webrtc
 *
 * Per RFC 7587, usedtx=1 is a receive-only parameter: when SDP contains usedtx=1,
 * it tells the peer's encoder to enable DTX when sending to that SDP's owner.
 *
 * - Munge LOCAL SDP (offer/answer we send): Tells REMOTE to use DTX → reduces packets WE RECEIVE
 * - Munge REMOTE SDP (before setRemoteDescription): Tells OUR encoder to use DTX → reduces packets WE SEND
 *
 * On react-native-webrtc, SDP munging of local SDP alone often does NOT enable DTX
 * on the native encoder. We must also munge the remote SDP so our encoder sees usedtx=1.
 *
 * This patch overrides RTCPeerConnection to munge both directions when enabled.
 * Call setOpusDtxEnabled() to toggle; the library's setNoiseReductionMode should call it.
 * No project-specific deps - safe to move to opensips-js-react-native.
 */

const OPUS_RTPMAP_REGEX = /a=rtpmap:(\d+)\s+opus\/48000\/2/i

/** When true, SDP is munged to add usedtx=1. Default true; call setOpusDtxEnabled to sync with init. */
let opusDtxEnabled = true

/**
 * Enable or disable Opus DTX SDP munging. Call from setNoiseReductionMode and after init (with stored preference).
 * When false, SDP passes through unmodified (same as before the patch).
 */
export function setOpusDtxEnabled(enabled: boolean): void {
    opusDtxEnabled = enabled
    console.log('[OpusDTX] SDP munging', enabled ? 'enabled' : 'disabled')
}

function enableOpusDtxInSdp(sdp: string): string {
    const rtpmapMatch = sdp.match(OPUS_RTPMAP_REGEX)
    if (!rtpmapMatch) return sdp

    const pt = rtpmapMatch[1]
    const fmtpRegex = new RegExp(`a=fmtp:${pt}\\s+(.+)`, 'i')
    const fmtpMatch = sdp.match(fmtpRegex)

    if (fmtpMatch) {
        let params = fmtpMatch[1]
        params = /\busedtx=\d/i.test(params)
            ? params.replace(/\busedtx=\d/i, 'usedtx=1')
            : params + ';usedtx=1'
        params = /\buseinbandfec=\d/i.test(params)
            ? params.replace(/\buseinbandfec=\d/i, 'useinbandfec=1')
            : params + ';useinbandfec=1'
        return sdp.replace(fmtpRegex, `a=fmtp:${pt} ${params}`)
    }

    return sdp.replace(
        `a=rtpmap:${pt} opus/48000/2`,
        `a=rtpmap:${pt} opus/48000/2\r\na=fmtp:${pt} minptime=10;useinbandfec=1;usedtx=1`
    )
}

/**
 * Patches RTCPeerConnection to enable Opus DTX in both directions.
 * Call this early (e.g. in index.js before app loads).
 *
 * - createOffer/createAnswer: munges our SDP → tells remote to use DTX (reduces our incoming)
 * - setRemoteDescription: munges remote SDP → tells our encoder to use DTX (reduces our outgoing)
 */
export function patchRTCPeerConnectionForOpusDtx(): void {
    console.log('[patchRTCPeerConnectionForOpusDtx] Patching RTCPeerConnection for Opus DTX')
    const globals = globalThis as any
    const PCRoot = globals.RTCPeerConnection ?? globals.webkitRTCPeerConnection

    if (!PCRoot) {
        console.warn('[OpusDTX] RTCPeerConnection not available, skipping patch')
        return
    }

    const origCreateOffer = PCRoot.prototype.createOffer
    const origCreateAnswer = PCRoot.prototype.createAnswer
    const origSetRemoteDescription = PCRoot.prototype.setRemoteDescription

    PCRoot.prototype.createOffer = async function (...args: any[]) {
        const offer = await origCreateOffer.apply(this, args as [])
        if (offer?.sdp && opusDtxEnabled) {
            console.log('[patchRTCPeerConnectionForOpusDtx] Munging local SDP for Opus DTX')
            offer.sdp = enableOpusDtxInSdp(offer.sdp)
        }
        return offer
    }

    PCRoot.prototype.createAnswer = async function (...args: any[]) {
        const answer = await origCreateAnswer.apply(this, args as [])
        if (answer?.sdp && opusDtxEnabled) {
            console.log('[patchRTCPeerConnectionForOpusDtx] Munging answer SDP for Opus DTX')
            answer.sdp = enableOpusDtxInSdp(answer.sdp)
        }
        return answer
    }

    PCRoot.prototype.setRemoteDescription = async function (description: { type: string; sdp?: string }) {
        if (description?.sdp && opusDtxEnabled) {
            const modifiedSdp = enableOpusDtxInSdp(description.sdp)
            const RTCSessionDesc = globals.RTCSessionDescription
            const modified =
                RTCSessionDesc != null
                    ? new RTCSessionDesc({ type: description.type, sdp: modifiedSdp })
                    : { type: description.type, sdp: modifiedSdp }

            return origSetRemoteDescription.call(this, modified)
        }
        return origSetRemoteDescription.call(this, description)
    }

    console.log('[OpusDTX] RTCPeerConnection patched for conditional Opus DTX (enabled:', opusDtxEnabled, ')')
}
