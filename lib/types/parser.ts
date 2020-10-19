import { IObservable } from "observable";

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

/**
 * Defines an edifact segment read by a parser.
 */
export type Segment = {
    /**
     * Extract the id of the segment.
     * @returns the id
     */
    getId: () => string;

    /**
     * Get the entire segment.
     * @returns the segment data
     */
    getData: () => string;

    /**
     * 
     */
    getComponents: () => EdiComponent[];
}

export type EdiComponent = {
    getData: () => string;
}

export type ReadableEvent = 'ready' | 'end' | 'data'; 

export interface IReadable {
    on: (event: ReadableEvent, args: any | string) => void;
}

/**
 * Parses EDI files.
 */
export interface IEdiParser extends IObservable<EdiParserEventMap> {

    /**
     * Set the path to a file for the parser to read data from.
     * @param path - the absolute path to the file
     * @returns this parser
     */
    file: (path: string) => IEdiParser;
    
    /**
     * Process the file.
     * @param data - optionally use a string as data instead of reading a file
     * @returns this parser
     */
    parse: (data?: string) => IEdiParser;

    /**
     * Get data as segments.
     * @returns the segments
     */
    segments: () => Iterable<Segment>;
}

/**
 * Creates a parser using the given file.
 * @param path - optionally set the path for the parser to use
 */
export type EdiParserFactory = (path?: string) => IEdiParser;