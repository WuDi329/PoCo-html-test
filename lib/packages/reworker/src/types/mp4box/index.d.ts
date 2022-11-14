declare module "mp4box" {

    interface MP4MediaTrack
    {
        id: number;
        created: Date;
        modified: Date;
        movie_duration: number;
        movie_timescale: number;
        layer: number;
        alternate_group: number;
        volume: number;
        track_width: number;
        track_height: number;
        timescale: number;
        duration: number;
        bitrate: number;
        codec: string;
        language: string;
        nb_samples: number;
    }

    interface MP4VideoData
    {
        width: number;
        height: number;
    }

    export interface MP4VideoTrack extends MP4MediaTrack
    {
        video: MP4VideoData;
    }

    interface MP4AudioData
    {
        sample_rate: number;
        channel_count: number;
        sample_size: number;
    }

    export interface MP4AudioTrack extends MP4MediaTrack
    {
        audio: MP4AudioData;
    }

    type MP4Track = MP4VideoTrack | MP4AudioTrack;

    export interface MP4Info
    {
        videoTracks: MP4VideoTrack[];
        duration: number;
        timescale: number;
        fragment_duration: number;
        isFragmented: boolean;
        isProgressive: boolean;
        hasIOD: boolean;
        brands: string[];
        created: Date;
        modified: Date;
        tracks: MP4Track[];
        audioTracks: MP4AudioTrack[];
    }

    //这里加了export
    export interface MP4Sample
    {
        alreadyRead: number;
        chunk_index: number;
        chunk_run_index: number;
        cts: number;
        data: Uint8Array;
        degradation_priority: number;
        depends_on: number;
        description: any;
        description_index: number;
        dts: number;
        duration: number;
        has_redundancy: number;
        is_depended_on: number;
        is_leading: number;
        is_sync: boolean;
        number: number;
        offset: number;
        size: number;
        timescale: number;
        track_id: number;
    }

    export type MP4ArrayBuffer = ArrayBuffer & { fileStart: number };

    export interface MP4File
    {
        //这里给了moovany
        moov: any;
        onMoovStart?: () => void;
        onReady?: (info: MP4Info) => void;
        onError?: (e: string) => void;
        onSamples?: (id: number, user: any, samples: MP4Sample[]) => any;

        appendBuffer(data: MP4ArrayBuffer): number;
        start(): void;
        stop(): void;
        flush(): void;
        releaseUsedSamples(trackId: number, sampleNumber: number): void;
        setExtractionOptions(trackId: number, user?: any, options?: { nbSamples?: number, rapAlignment?: number }): void;
    }

    export function createFile(): MP4File;

    export class DataStream {
        buffer: ArrayBufferLike;
        constructor(arrayBuffer: any, byteOffset: any, endianness: any);
    
        adjustUint32(position: any, value: any): void;
    
        getPosition(): any;
    
        isEof(): any;
    
        mapFloat32Array(length: any, e: any): any;
    
        mapFloat64Array(length: any, e: any): any;
    
        mapInt16Array(length: any, e: any): any;
    
        mapInt32Array(length: any, e: any): any;
    
        mapInt8Array(length: any): any;
    
        mapUint16Array(length: any, e: any): any;
    
        mapUint32Array(length: any, e: any): any;
    
        mapUint8Array(length: any): any;
    
        readCString(length: any): any;
    
        readFloat32(e: any): any;
    
        readFloat32Array(length: any, e: any): any;
    
        readFloat64(e: any): any;
    
        readFloat64Array(length: any, e: any): any;
    
        readInt16(e: any): any;
    
        readInt16Array(length: any, e: any): any;
    
        readInt32(e: any): any;
    
        readInt32Array(length: any, e: any): any;
    
        readInt64(): any;
    
        readInt8(): any;
    
        readInt8Array(length: any): any;
    
        readString(length: any, encoding: any): any;
    
        readUint16(e: any): any;
    
        readUint16Array(length: any, e: any): any;
    
        readUint24(): any;
    
        readUint32(e: any): any;
    
        readUint32Array(length: any, e: any): any;
    
        readUint64(): any;
    
        readUint8(): any;
    
        readUint8Array(length: any): any;
    
        save(filename: any): void;
    
        seek(pos: any): void;
    
        shift(offset: any): void;
    
        writeCString(s: any, length: any): void;
    
        writeFloat32(v: any, e: any): void;
    
        writeFloat32Array(arr: any, e: any): void;
    
        writeFloat64(v: any, e: any): void;
    
        writeFloat64Array(arr: any, e: any): void;
    
        writeInt16(v: any, e: any): void;
    
        writeInt16Array(arr: any, e: any): void;
    
        writeInt32(v: any, e: any): void;
    
        writeInt32Array(arr: any, e: any): void;
    
        writeInt8(v: any): void;
    
        writeInt8Array(arr: any): void;
    
        writeString(s: any, encoding: any, length: any): void;
    
        writeStruct(structDefinition: any, struct: any): void;
    
        writeType(t: any, v: any, struct: any): any;
    
        writeUCS2String(str: any, endianness: any, lengthOverride: any): void;
    
        writeUint16(v: any, e: any): void;
    
        writeUint16Array(arr: any, e: any): void;
    
        writeUint24(v: any): void;
    
        writeUint32(v: any, e: any): void;
    
        writeUint32Array(arr: any, e: any): void;
    
        writeUint64(v: any): void;
    
        writeUint8(v: any): void;
    
        writeUint8Array(arr: any): void;
    
        static BIG_ENDIAN: boolean;
    
        static LITTLE_ENDIAN: boolean;
    
        static arrayToNative(array: any, arrayIsLittleEndian: any): any;
    
        static endianness: boolean;
    
        static flipArrayEndianness(array: any): any;
    
        static memcpy(dst: any, dstOffset: any, src: any, srcOffset: any, byteLength: any): void;
    
        static nativeToEndian(array: any, littleEndian: any): any;
    
    }

    export { };
}

