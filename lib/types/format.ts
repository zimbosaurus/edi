import { IObservable } from "@zimbosaurus/observable";
import { SegmentShape } from "./databuilder";
import { IEdiParser, Segment } from "./parser";

/**
 * 
 */
export const FORMAT_EVENT_DONE = 'done';

/**
 * 
 */
export const FORMAT_EVENT_GROUP_ENTER = 'group_enter';

/**
 * 
 */
export const FORMAT_EVENT_GROUP_EXIT = 'group_exit';

/**
 * 
 */
export const FORMAT_EVENT_SEGMENT_DONE = 'segment_done';

/**
 * 
 */
export const FORMAT_EVENT_ITEM_DONE = 'item_done';

/**
 * 
 */
export const FORMAT_EVENT_REPEAT = 'repeat';

/**
 * 
 */
export type EdiFormatEventMap = {
    [FORMAT_EVENT_GROUP_ENTER]: StructureGroup,
    [FORMAT_EVENT_GROUP_EXIT]: StructureGroup,
    [FORMAT_EVENT_SEGMENT_DONE]: SegmentShape,  // TODO rename to "segment_exit"? more consequent naming of events
    [FORMAT_EVENT_ITEM_DONE]: StructureItem,
    [FORMAT_EVENT_REPEAT]: StructureGroup,
    [FORMAT_EVENT_DONE]: void
}

/**
 * 
 */
export interface IEdiFormat extends IObservable<EdiFormatEventMap> {
    /**
     * 
     */
    structure: (structure: EdiStructure) => IEdiFormat;

    /**
     * 
     */
    read: (stream?: ReadableStream<Segment>) => any;
}

/**
 * Data applied and used while parsing the format.
 */
export type StructureItemData = {
    repetitions: number;
    entryPointer: number;
}

/**
 * 
 */
export type StructureLabel = {
    name?: string;
    description?: string;
    info?: any;
}

/**
 * 
 */
export type StructureSegment = {
    type: 'segment';
    conditional: boolean;
    repeat: number;
    data?: StructureItemData;
    label?: StructureLabel;
    id: string;
}

/**
 * 
 */
export type StructureGroup = {
    type: 'group' | 'root';
    conditional: boolean;
    repeat: number;
    data?: StructureItemData;
    label?: StructureLabel;
    entries: EdiStructure;
}

/**
 * 
 */
export type StructureItem = StructureSegment | StructureGroup;

/**
 * 
 */
export type EdiStructure = StructureItem[];