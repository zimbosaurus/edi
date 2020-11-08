import { Transformer } from "web-streams-polyfill";
import Segment from "./segment";

/**
 * 
 */
export type EdiElement = {
    getData: () => string;
}

/**
 * 
 */
export type EdiComposite = {
    getData: () => string;
    getElements: () => EdiElement[];
}

/**
 * Parses EDI files.
 */
export interface IEdiParser {

    /**
     * Parse a stream of EDI data.
     * @param stream the stream
     * @returns a stream of segment
     */
    parse: (stream: ReadableStream<string>) => ReadableStream<Segment>;

    /**
     * @returns a streamtransformer that does the parsing
     */
    transform(): Transformer<String, Segment>;
}

/**
 * Creates a parser using the given file.
 * @param path - optionally set the path for the parser to use
 */
export type EdiParserFactory = (path?: string) => IEdiParser;