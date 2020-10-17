import { IObservable } from "observable";
import { EdiParserEventMap, IEdiParser, Segment } from "./parser";

/**
 * 
 */
export const FORMAT_EVENT_DONE = 'format_done';

/**
 * 
 */
export type EdiFormatEventMap = EdiParserEventMap & {
    'group_enter': StructureGroup,
    'group_exit': StructureGroup,
    'repeat': StructureItem,
    'segment_done': {item: StructureSegment, segment: Segment},  // TODO rename to "segment_exit"? more consequent naming of events
    'item_done': StructureSegment,
    [FORMAT_EVENT_DONE]: void
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