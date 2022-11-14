// UMD 格式导出

export = EBML;
export as namespace EBML;

declare namespace EBML{
    export const Reader: any;
    export const Writer: any;
    export const Decoder: any;
    export const Encoder: any;
    export const tools: any;
}