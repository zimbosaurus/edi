import 'web-streams-polyfill';
import { IEdiParser } from './types';
import Segment, { COMPOSITE_DELIMITER, ELEMENT_DELIMITER, SEGMENT_DELIMITER } from './segment';

/**
 * Converts a stream of EDIFACT data and returns a stream of the segments.
 */
export default class EdiParser implements IEdiParser {

    /**
     * Symbol which separates each segment.
     */
    private segmentDelimiter: string | RegExp = SEGMENT_DELIMITER;

    /**
     * Symbol which separates each composite, and the segment id.
     */
    private compositeDelimiter: string | RegExp = COMPOSITE_DELIMITER;

    /**
     * Symbol which separates each element inside a composite.
     */
    private elementDelimiter: string | RegExp = ELEMENT_DELIMITER; 

    transform(): Transformer<string, Segment> {
        const parser = this;
        let chunks: string[];

        return {
            start() {
                chunks = [];
            },
            transform(chunk, controller) {
                const segment = parser.readChunk(chunk, chunks);
                segment && controller.enqueue(segment);
            },
            flush(controller) {
                // TODO
            }
        }
    }

    parse(stream: ReadableStream<string>): ReadableStream<Segment> {
        return stream.pipeThrough(new TransformStream(this.transform()));
    }

    /**
     * 
     * @param delimiter 
     */
    setSegmentDelimiter(delimiter: string | RegExp) {
        this.segmentDelimiter = delimiter;
    }

    /**
     * 
     * @param delimiter 
     */
    setCompositeDelimiter(delimiter: string | RegExp) {
        this.compositeDelimiter = delimiter;
    }

    /**
     * 
     * @param delimiter 
     */
    setElementDelimiter(delimiter: string | RegExp) {
        this.elementDelimiter = delimiter;
    }

    /**
     * 
     * @param str 
     * @param chunks 
     */
    private readChunk(str: string, chunks: string[]): Segment | void {
        if (str) {
            if (str == this.segmentDelimiter) {
                return this.formSegment(chunks);
            }
            else {
                chunks.push(str);
            }
        }
        else {
            return this.formSegment(chunks);
        }
    }

    /**
     * 
     * @param str 
     * @param chunks 
     */
    private formSegment(chunks: string[]) {
        return new Segment(chunks.splice(0, chunks.length).join(''), this.compositeDelimiter, this.elementDelimiter);
    }

}