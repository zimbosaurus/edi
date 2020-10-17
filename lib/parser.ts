import { EdiComponent, EdiParserEventMap, EdiParserFactory, IEdiParser, PARSER_EVENT_END_DATA, Segment } from "./types/parser";
import { Observable } from "observable";
import { Stream } from "stream";
import * as fs from 'fs';

const SEGMENT_DELIMITER = "'";
const COMPONENT_DELIMITER = ":";
const ELEMENT_DELIMITER = "+";

/**
 * 
 */
class EdiParser extends Observable<EdiParserEventMap> implements IEdiParser {
    private _segments: Segment[];
    private _path: string;

    public segmentDelimiter = SEGMENT_DELIMITER;
    public componentDelimiter = COMPONENT_DELIMITER;
    public elementDelimiter = ELEMENT_DELIMITER; 

    constructor(path?: string) {
        super();
        this._path = path;
    }

    segments: () => Iterable<Segment> = () => this._segments;
    
    file = (path: string) => {
        this._path = path;
        return this;
    };

    parse(data?: string) {
        const rs = data ? Stream.Readable.from(data.split('')) : fs.createReadStream(this._path);
        let chars: string[] = [];
        this._segments = [];

        rs.on('readable', () => {
            let c: number;

            while ((c = rs.read(1)) != undefined) {
                const char = c.toString();

                if (char == this.segmentDelimiter) {
                    this.pushSegment(chars);
                    chars = [];
                }
                else {
                    chars.push(char);
                }
            }
        });

        rs.once(PARSER_EVENT_END_DATA, () => {
            this.pushSegment(chars);
            this.emit(PARSER_EVENT_END_DATA);
        });

        return this;
    }

    private pushSegment(chars: string[]) {
        const segment = makeSegment(chars.join(''));
        this._segments.push(segment); // TODO optimize?
        this.emit('segment', segment);
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
        getComponents: () => segmentComponents(data)
    }
}

function segmentComponents(segment: string, delimiter = COMPONENT_DELIMITER): EdiComponent[] {
    return segment.split(delimiter).map<EdiComponent>(c => ({ getData: () => c }));
}

/**
 * 
 * @param segment 
 */
function segmentId(segment: string): string {
    return segment.slice(0, 3);
}

/**
 * 
 * @param path 
 */
const edi: EdiParserFactory = (path?: string) => new EdiParser(path);
export default edi;