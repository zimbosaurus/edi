import {
    EdiStructureEntry,
    EdiFormatFactory,
    EdiGroupEntry,
    EdiSegmentEntry,
    EdiStructure,
    IEdiFormat,
    IEdiParser,
    Segment
} from "./types";

/**
 * 
 */
export class EdiFormat implements IEdiFormat {
    private _structure: EdiStructure;
    private _shape: {};

    constructor(public parser: IEdiParser) {}
    
    file(path: string) {
        this.parser.path = path;
        return this;
    }

    outShape(s: {}) {
        this._shape = s;
        return this;
    }

    structure(s: EdiStructure) {
        this._structure = s;
        return this;
    }

    read() {
        const parser = this.parser;

        parser.on('segment', this.onSegment);
        parser.once('end', () => parser.removeListener('segment', this.onSegment));

        parser.parse();

        return undefined;
    }

    private handleItem(item: EdiStructureEntry): boolean {
        return false;
    }

    private onSegment(segment: Segment) {
    }
}

/**
 * 
 * @param id 
 * @param conditional 
 * @param repeat 
 */
export function makeStructureSegment(id: string, conditional = false, repeat = 1) {
    return {
        type: 'segment',
        id, conditional, repeat
    } as EdiSegmentEntry
}

export function makeStructureGroup(entries: EdiStructureEntry[], conditional = false, repeat = 1) {
    return {
        type: 'group',
        conditional, repeat, entries
    } as EdiGroupEntry
}

/**
 * 
 * @param parser 
 */
const ediFn: EdiFormatFactory = parser => new EdiFormat(parser);
export default ediFn;