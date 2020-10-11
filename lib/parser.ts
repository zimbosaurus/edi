import { EdiParserEvent, EdiParserEventArgs, EdiParserEventMap, EdiParserFactory, IEdiParser, Segment } from "./types";
import { EventListener, ListenerEntry } from "./observable";
import * as fs from 'fs';

/**
 * 
 */
class EdiParser implements IEdiParser {
    private _listeners: ListenerEntry<EdiParserEventMap>[] = [];
    private _segments: Segment[];

    public segmentDelimiter: string = "'";

    constructor(public path: string) {}

    // IObservable implementation
    on = (event: EdiParserEvent, listener: EventListener<EdiParserEventMap[typeof event]>) => {
        this._listeners.push({ event, listener });
    };
    once = (event: EdiParserEvent, listener: EventListener<EdiParserEventMap[typeof event]>) => {
        const self = this;
        function listenOnce(args?: EdiParserEventMap[typeof event]) {
            self.removeListener(event, listenOnce);
            listener?.(args);
        }
        this._listeners.push({ event, listener: listenOnce });
    };
    removeListener = (event: EdiParserEvent, listener: EventListener<EdiParserEventMap[typeof event]>) => {
        this._listeners.filter(le => le.event != event || le.listener != listener);
    };
    listeners = () => [...this._listeners];

    segments: () => Iterable<Segment> = () => this._segments;

    parse() {
        const rs = fs.createReadStream(this.path);
        let chars: string[] = [];
        this._segments = []

        rs.on('readable', () => {
            let c: number;

            while ((c = rs.read(1)) != undefined) {
                const char = c.toString();

                if (char == this.segmentDelimiter) {
                    const segment = makeSegment(chars.join(''));
                    this._segments.push(segment); // TODO optimize?
                    this.emit('segment', segment);
                    chars = [];
                }
                else {
                    chars.push(char);
                }
            }

        });

        rs.once('end', () => this.emit('end'));

        return this;
    }

    /**
     * 
     * @param event 
     * @param args 
     */
    private emit(event: EdiParserEvent, args?: EdiParserEventMap[typeof event]) {
        this._listeners.forEach(le => le.event == event && le?.listener?.(args));
    }
}

/**
 * 
 * @param data 
 */
function makeSegment(data: string): Segment {
    return {
        data,
        getData: () => data,
        getId: () => segmentId(data)
    }
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
const ediFn: EdiParserFactory = path => new EdiParser(path);
export default ediFn;