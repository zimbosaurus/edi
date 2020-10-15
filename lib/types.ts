import { IObservable } from "observable";

// TODO split types.ts into multiple files

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
}

export type EdiFormatEventMap = EdiParserEventMap & {
    'group_enter': StructureGroup,
    'group_exit': StructureGroup,
    'repeat': StructureItem,
    'segment_done': StructureSegment,  // TODO rename to "segment_exit"? more consequent naming of events
    'item_done': StructureSegment
}

/**
 * 
 */
export interface IEdiFormat extends IObservable<EdiFormatEventMap> {

    /**
     * 
     */
    file: (path: string) => IEdiFormat;

    /**
     * 
     */
    shape: (shape: {}) => IEdiFormat; 

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

/**
 * Data applied and used while parsing the format.
 */
export type StructureItemData = {
    repetitions: number;
    entryPointer: number;
}

export type StructureLabel = {
    name?: string;
    description?: string;
    info?: any;
}

export type StructureSegment = {
    type: 'segment';
    conditional: boolean;
    repeat: number;
    data?: StructureItemData;
    label?: StructureLabel;
    id: string;
}

export type StructureGroup = {
    type: 'group' | 'root';
    conditional: boolean;
    repeat: number;
    data?: StructureItemData;
    label?: StructureLabel;
    entries: EdiStructure;
}

export type StructureItem = StructureSegment | StructureGroup;
export type EdiStructure = StructureItem[];