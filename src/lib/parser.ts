import { EdiComposite, EdiElement, EdiParserEventMap, EdiParserFactory, IEdiParser, Segment } from "./types/parser";
import 'web-streams-polyfill';

const SEGMENT_DELIMITER = "'";
const COMPOSITE_DELIMITER = ":";
const ELEMENT_DELIMITER = "+";

/**
 * 
 */
export default class EdiParser implements IEdiParser {
    public segmentDelimiter = SEGMENT_DELIMITER;
    public componentDelimiter = COMPOSITE_DELIMITER;
    public elementDelimiter = ELEMENT_DELIMITER; 

    parse(stream: ReadableStream<string>) {
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
 */
function makeSegment(data: string): Segment {
    return {
        getData: () => data,
        getId: () => segmentId(data),
        getElements: () => segmentElements(data),
        getComposites: () => segmentComposites(data)
    }
}

/**
 * 
 * @param segment 
 * @param delimiter 
 */
function segmentComposites(segment: string, delimiter = COMPOSITE_DELIMITER): EdiComposite[] {
    return segment.split(delimiter).map<EdiComposite>(c => ({
        getData: () => c,
        getElements: () => segmentElements(c),
    }));
}

/**
 * 
 * @param segment 
 * @param delimiter 
 */
function segmentElements(segment: string, delimiter = ELEMENT_DELIMITER): EdiElement[] {
    return segment.split(delimiter).map<EdiElement>(c => ({ getData: () => c }));
}

/**
 * 
 * @param segment 
 */
function segmentId(segment: string): string {
    return segment.slice(0, 3);
}