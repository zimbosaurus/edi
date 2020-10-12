import {
    StructureItem,
    EdiFormatFactory,
    StructureGroup,
    StructureSegment,
    EdiStructure,
    IEdiFormat,
    IEdiParser,
    Segment
} from "./types";
import { EventListener } from "./observable";

const ERROR_INVALID_STRUCTURE_TYPE = 'Structure type is invalid.';
const ERROR_UNEXPECTED_SEGMENT = 'Segment received does not fit the format structure.'

type Instructions = { pullStack: boolean, nextSegment: boolean }

/**
 * 
 */
export class EdiFormat implements IEdiFormat {
    private _structure: EdiStructure;
    private _shape: {};

    private isReading = false;
    private resolve: (value: any) => void;
    private reject: (value: any) => void;

    constructor(public parser: IEdiParser) {}
    
    file(path: string) {
        this.parser.file(path);
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

    async read(data?: string) {
        this.isReading = true;
        console.log("Reading..");

        // Init parser
        const parser = this.parser;

        const segmentListener = parser.on('segment', segment => this.onSegment(segment as Segment));
        parser.once('end', () => {
            parser.removeListener('segment', segmentListener);
            this.reject(this.root.data.entryPointer);
        });

        // Init format
        this.root = {type: 'root', entries: [...this._structure], conditional: false, repeat: 1};

        // Execute
        parser.parse(data);

        // Return
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        })
    }

    private root: StructureGroup; 

    /**
     * Evaluates a segment and returns true if this item did not expect the given segment, and therefore should be pulled of the itemstack.
     * Should not have any side-effects!
     * @param item the structure item
     * @param segment
     * @returns if the item should be pulled
     */
    private handleItem(item: StructureItem, segment: Segment): Instructions {
        // The return value
        let instructions: Instructions;

        if (!item?.data) {
            this.appendItemData(item);
        }
        
        // Handle depending on item type
        if (item.type == 'segment') {
            instructions = this.handleSegment(item, segment);
            if (instructions.nextSegment) {
                item.data.repetitions++;
            }
        }
        else if (item.type == 'group' || item.type == 'root') {
            instructions = this.handleGroup(item, segment);
            if (instructions.pullStack) {
                item.data.entryPointer = 0;
                item.data.repetitions++;
            }
        }
        else {
            // TODO handle when type is invalid
            throw new Error(ERROR_INVALID_STRUCTURE_TYPE); // TODO better error message
        }

        return instructions;
    }

    private handleSegment(item: StructureSegment, segment: Segment): Instructions {
        console.log(item.id, segment.getId());
        if (item.id == segment.getId()) {
            // We keep the item on the stack if it could repeat
            // If the segment did match, we always want the next one
            return {pullStack: !this.canRepeat(item), nextSegment: true};
        }
        else if (item.conditional || this.hasRepeated(item)) {
            // id doesn't match, but it ok because it don't need to!
            // If id does not match we definitely don't want it!
            console.log("No match, but conditional!");
            return {pullStack: true, nextSegment: false};
        }
        else {
            return {pullStack: true, nextSegment: false}
            // IF:
            //     id does NOT match
            //     AND item is NOT conditional (mandatory)
            //     AND item has NOT repeated before
            //
            // = something has gone wrong!
            
            // TODO handle this error better?
            //throw new Error(ERROR_UNEXPECTED_SEGMENT);
        }
    }
    
    private handleGroup(group: StructureGroup, segment: Segment): Instructions {
        const itemStack = [...group.entries];

        // When returns true it say "Nähä du, det där segmentet vet jag inte vad det är för något!"
        // and this means that "då behåller vi segmentet och ger det till nästa item, för att se om den tycker om segmentet!"
        while (true) {
            if (this.isDone(group)) {
                return {pullStack: true, nextSegment: false};
            }

            let instructions = this.handleItem(itemStack[group.data.entryPointer], segment);
            if (instructions.pullStack) {
                if (!instructions.nextSegment) {
                }
                group.data.entryPointer++;
            }
            if (instructions.nextSegment) {
                break;
            }
        }

        // When returns false it say "Nä vänta lite nu, jag vill se nästa segment brorsan!"
        
        const groupIsEmpty = this.isDone(group);
        return {pullStack: groupIsEmpty && !this.canRepeat(group), nextSegment: true};
    }

    /**
     * 
     * @param segment 
     */
    private onSegment(segment: Segment) {
        if (this.handleItem(this.root, segment).pullStack) {
            this.resolve('RESOLVED');
        }
    }

    private appendItemData(item: StructureItem) {
        item.data = {
            repetitions: 0,
            entryPointer: 0
        }
    }

    /**
     * Check if an item could appear again.
     * @param item the item
     * @returns if it can repeat
     */
    private canRepeat(item: StructureItem) {
        // TODO handle when data may be null?
        return item.type != 'root' && (item?.data.repetitions) < (item as StructureGroup | StructureSegment).repeat - 1;
    }

    /**
     * 
     * @param item 
     */
    private hasRepeated(item: StructureItem) {
        return item.data.repetitions > 0;
    }

    private isDone(group: StructureGroup) {
        return group.data.entryPointer >= group.entries.length;
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
    } as StructureSegment
}

export function makeStructureGroup(entries: StructureItem[], conditional = false, repeat = 1) {
    return {
        type: 'group',
        conditional, repeat, entries
    } as StructureGroup
}

/**
 * 
 * @param parser 
 */
const ediFn: EdiFormatFactory = parser => new EdiFormat(parser);
export default ediFn;