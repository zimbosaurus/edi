import { EdiComposite, EdiElement, IEdiParser, Segment } from "./types/parser";
import 'web-streams-polyfill';

const SEGMENT_DELIMITER = "'";
const COMPOSITE_DELIMITER = "+";
const ELEMENT_DELIMITER = ":";

/**
 * Converts a stream of EDIFACT data and returns a stream of the segments.
 */
export default class EdiParser implements IEdiParser {

    /**
     * Symbol which separates each segment.
     */
    public segmentDelimiter = SEGMENT_DELIMITER;

    /**
     * Symbol which separates each composite, and the segment id.
     */
    public compositeDelimiter = COMPOSITE_DELIMITER;

    /**
     * Symbol which separates each element inside a composite.
     */
    public elementDelimiter = ELEMENT_DELIMITER; 

    /**
     * Parse a stream of EDI data.
     * @param stream the stream
     * @returns a stream of segment
     */
    parse(stream: ReadableStream<string>): ReadableStream<Segment> {
        const parser = this;
        const reader = stream.getReader();

        return new ReadableStream({
            start(controller: ReadableStreamDefaultController<Segment>) {
                let chunks: string[] = [];

                return pump();

                function pump() {
                    return reader.read().then(r => {
                        const segment = readChunk(parser, r);
                        if (segment) {
                            controller.enqueue(segment);
                        }

                        if (r.done) {
                            controller.close();
                            return;
                        }
                        
                        return pump();
                    })
                }
        
                function readChunk(parser: EdiParser, r: ReadableStreamReadResult<string>): Segment | void {
                    if (!r.done) {
                        if (r.value == parser.segmentDelimiter) {
                            return formSegment();
                        }
                        else if (r.value != undefined) {
                            chunks.push(r.value);
                        }
                    }
                    else {
                        return formSegment();
                    }
                }
        
                function formSegment() {
                    return makeSegment(chunks.splice(0, chunks.length).join(''));
                }
            }
        })
    }
}

/**
 * 
 * @param data 
 * @param compositeDelimiter 
 * @param elementDelimiter 
 */
function makeSegment(data: string, compositeDelimiter = COMPOSITE_DELIMITER, elementDelimiter = ELEMENT_DELIMITER): Segment {
    return {
        getData: () => data,
        getId: () => segmentId(data),
        getElements: () => elements(data, elementDelimiter),
        getComposites: () => composites(data, compositeDelimiter, elementDelimiter)
    }
}

/**
 * 
 * @param str 
 * @param compositeDelimiter 
 * @param elementDelimiter 
 */
export function composites(str: string, compositeDelimiter = COMPOSITE_DELIMITER, elementDelimiter = ELEMENT_DELIMITER) {
    return str.split(compositeDelimiter).slice(1).map<EdiComposite>(c => ({
        getData: () => c,
        getElements: () => elements(c, elementDelimiter)
    }));
}

/**
 * 
 * @param str 
 * @param elementDelimiter 
 */
export function elements(str: string, elementDelimiter = ELEMENT_DELIMITER): EdiElement[] {
    return str?.split(elementDelimiter).map<EdiElement>(el => ({getData: () => el}));
}

/**
 * 
 * @param segment 
 */
export function segmentId(segment: string): string {
    return segment.slice(0, 3);
}