// From https://github.com/webrtcHacks/WebRTC-Camera-Resolution/blob/master/js/resolutionScan.js
const resolutions = [{
    label: '4K (UHD)',
    width: 3840,
    height: 2160,
    ratio: 16/9
}, {
    label: '1080p (FHD)',
    width: 1920,
    height: 1080,
    ratio: 16/9
}, {
    label: 'UXGA',
    width: 1600,
    height: 1200,
    ratio: 4/3
}, {
    label: '720p (HD)',
    width: 1280,
    height: 720,
    ratio: 16/9
}, {
    label: 'SVGA',
    width: 800,
    height: 600,
    ratio: 4/3
}, {
    label: 'VGA',
    width: 640,
    height: 480,
    ratio: 4/3
}, {
    label: '360p (nHD)',
    width: 640,
    height: 360,
    ratio: 16/9
}, {
    label: 'CIF',
    width: 352,
    height: 288,
    ratio: 4/3
}, {
    label: 'QVGA',
    width: 320,
    height: 240,
    ratio: 4/3
}, {
    label: 'QCIF',
    width: 176,
    height: 144,
    ratio: 4/3
}, {
    label: 'QQVGA',
    width: 160,
    height: 120,
    ratio: 4/3
}
];

const len = resolutions.length;
for (let i = 0; i < len; ++i) {
const res = resolutions[i];
resolutions.push({
    label: `${res.label} (portrait)`,
    width: res.height,
    height: res.width,
    ratio: 1/res.ratio
});
}

export async function supported_video_configs(constraints: {ratio?: number, width?: number, height?: number, codec: string}, all_if_no_webcodecs?: any) {
if (!('VideoEncoder' in window)) {
    return all_if_no_webcodecs ? resolutions : [];
}
const r = [];
for (let res of resolutions) {
    const support = await VideoEncoder.isConfigSupported({ ...constraints, ...res });
    if (support.supported) {
        r.push({
            ...res,
            ...support.config
        });
    }
}
return r;
}

//目前的场景下面，应该all_if_no_webcodecs一直存在，因此，这里先去掉这个参数了，如果需要再加回来
//这个constraints本来应该是VideoEncoderConfig，但是这里加入了ratio这个参数，并不在.d.ts之中，所以这里先改写，如果以后需要加什么，可以考虑去.d.ts抄
export async function max_video_config(constraints: {ratio?: number, width: number, height: number, codec: string}) {
constraints = constraints || {};
for (let res of resolutions) {
    //如果constraints的ratio为false并且width，height均为false
    if ((!constraints.ratio || (res.ratio === constraints.ratio)) &&
        (!constraints.width || (res.width <= constraints.width)) &&
        (!constraints.height || (res.height <= constraints.height))) {
        // if ('VideoEncoder' in window) {
            const support = await VideoEncoder.isConfigSupported({ ...constraints, ...res });
            if (support.supported) {
                return {
                    ...res,
                    ...support.config
                };
            }
        // } else if (all_if_no_webcodecs) {
        //     return res;
        // }
    }
}
return null;
}
