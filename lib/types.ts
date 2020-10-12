import { IObservable } from "./observable";

const PARSER_EVENT_SEGMENT = 'segment';
const PARSER_EVENT_END = 'end';

export type EdiParserEventMap = {
    [PARSER_EVENT_SEGMENT]: Segment,
    [PARSER_EVENT_END]: void
}

/**
 * 
 */
export type EdiParserEvent = keyof EdiParserEventMap;

/**
 * 
 */
export type EdiParserEventArgs = EdiParserEventMap[keyof EdiParserEventMap];

/**
 * Creates a parser using the given file.
 */
export type EdiParserFactory = (path?: string) => IEdiParser;

/**
 * Parses EDI files.
 */
export interface IEdiParser extends IObservable<EdiParserEventMap> {

    /**
     * 
     */
    file: (path: string) => IEdiParser;
    
    /**
     * Process the file.
     * @returns self
     */
    parse: (data?: string) => IEdiParser;

    /**
     * Get data as segments.
     * @returns the segments
     */
    segments: () => Iterable<Segment>;
}

/**
 * 
 */
export type Segment = {
    getId: () => string;
    getData: () => string;
    data: string;
    meta?: SegmentMetaData;
}

/**
 * 
 */
export type SegmentMetaData = {

}

/**
 * 
 */
export interface IEdiFormat {

    /**
     * 
     */
    file: (path: string) => IEdiFormat;

    /**
     * 
     */
    outShape: (shape: {}) => IEdiFormat; 

    /**
     * 
     */
    structure: (structure: EdiStructure) => IEdiFormat;

    /**
     * 
     */
    read: (data?: string) => any;
}

/**
 * 
 */
export type EdiFormatFactory = (parser: IEdiParser) => IEdiFormat;


export type StructureItemData = {
    repetitions: number;
    entryPointer: number;
}

export type StructureSegment = {
    type: 'segment';
    conditional: boolean;
    repeat: number;
    data?: StructureItemData;
    id: string;
}

export type StructureGroup = {
    type: 'group' | 'root';
    conditional: boolean;
    repeat: number;
    data?: StructureItemData;
    entries: EdiStructure;
}

export type StructureItem = StructureSegment | StructureGroup;
export type EdiStructure = StructureItem[];