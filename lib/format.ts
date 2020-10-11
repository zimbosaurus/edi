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

        // Init parser
        parser.on('segment', this.onSegment);
        parser.once('end', () => parser.removeListener('segment', this.onSegment));

        // Init format
        this.itemStack = [...this._structure];

        // Execute
        parser.parse();

        // Return
        return undefined;
    }

    private itemStack: EdiStructure;

    /**
     * Evaluates a segment and returns true if this item should be pulled of the groups stack.
     * @param item the structure item
     * @returns if the item should be pulled
     */
    private handleItem(item: EdiStructureEntry, segment: Segment): boolean {
        return false;
    }

    /**
     * 
     * @param segment 
     */
    private onSegment(segment: Segment) {
        const shouldPull = this.handleItem(this.itemStack[0], segment);
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