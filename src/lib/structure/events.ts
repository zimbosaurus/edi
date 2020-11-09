import { StructureItem } from "./types";

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
export const FORMAT_EVENT_GROUP_REPEAT = 'group_repeat';

/**
 * 
 */
export type EdiFormatEventMap = {
    [FORMAT_EVENT_GROUP_ENTER]: StructureItem,
    [FORMAT_EVENT_GROUP_EXIT]: StructureItem,
    [FORMAT_EVENT_SEGMENT_DONE]: StructureItem,  // TODO rename to "segment_exit"? more consequent naming of events
    [FORMAT_EVENT_ITEM_DONE]: StructureItem,
    [FORMAT_EVENT_GROUP_REPEAT]: StructureItem,
    [FORMAT_EVENT_DONE]: StructureItem
}