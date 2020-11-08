import Segment from "./Segment";

/**
 * Invoked when the parser has read a segment.
 */
export const PARSER_EVENT_SEGMENT = 'segment';

/**
 * Invoked when the parser has reached the end of the data.
 */
export const PARSER_EVENT_END_DATA = 'end_of_data';

/**
 * Maps parser events to their argument type.
 */
export type EdiParserEventMap = {
    [PARSER_EVENT_SEGMENT]: Segment,
    [PARSER_EVENT_END_DATA]: void
}

/**
 * Convenience type for a parser event.
 */
export type EdiParserEvent = keyof EdiParserEventMap;

/**
 * Convenience type for a parser event argument.
 */
export type EdiParserEventArgs = EdiParserEventMap[keyof EdiParserEventMap];