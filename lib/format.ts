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
import { exception } from "console";
import { OutgoingMessage } from "http";
import { runInThisContext } from "vm";

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
        let ins: Instructions = undefined;

        if (item.id == segment.getId()) {
            // We keep the item on the stack if it could repeat
            // If the segment did match, we always want the next one
            ins = {pullStack: !this.canRepeat(item), nextSegment: true};
        }
        else if (item.conditional || this.hasRepeated(item)) {
            // id doesn't match, but it ok because it don't need to!
            // If id does not match we definitely don't want it!
            console.log("No match, but conditional or repeating!");
            ins = {pullStack: true, nextSegment: false}
        }
        else {
            ins = {pullStack: true, nextSegment: false} // TODO ???
        }

        return ins;
    }
    
    private handleGroup(group: StructureGroup, segment: Segment): Instructions {
        const itemStack = [...group.entries];

        // Iterating over items in group until we request the next segment, OR pull the group off the stack
        while (true) {

            if (this.isDone(group)) { // TODO maybe not work?? TODO maybe yes work!
                this.resetGroup(group);
            }

            const item = itemStack[group.data.entryPointer];
            let ins: Instructions = this.handleItem(item, segment);
            let outIns: Instructions = undefined;

            if (ins.pullStack) {
                // Current item inside this group is done and wants to be pulled off the stack
                // This is either because it can't repeat or it did not fit and was conditional

                group.data.entryPointer++; // MAYBE we always want to do this

                // Item is done, but does not request the next segment
                // This means the item did not match
                if (!ins.nextSegment) {
                    // If the item is mandatory AND it has not repeated before, then it is bad
                    const badExit = !item.conditional && !this.hasRepeated(item);
                    // If the group is neither conditional or has repeated, it is too bad exit
                    // ..or mandatory in other words
                    const groupMandatory = !group.conditional && !this.hasRepeated(group);
                    
                    // this could be bad if the item was mandatory, AND this group is mandatory
                    if (badExit && groupMandatory) {
                        throw new Error(ERROR_UNEXPECTED_SEGMENT); // TODO error handling
                    }
                    else if (badExit) {
                        // if the exit was bad/unexpected, we exit this group immediately
                        // because we know the group does not match specification
                        outIns = {
                            pullStack: true,
                            nextSegment: false
                        }
                    }
                    else {
                        // item is done (wants to be pulled) AND is conditional
                        // This is ok, we just compare the segment against the next item!
                        outIns = {
                            pullStack: false,
                            nextSegment: false
                        } 
                    }
                }
                else {
                    // Item wants to be pulled, and is requesting the next segment, all is well!
                    // We pull this group off the stack if it is done AND can not repeat
                    const pullStack = this.isDone(group) && !this.canRepeat(group);
                    outIns = {
                        pullStack,
                        nextSegment: true
                    }
                }

                // Reset segment reps when it's done
                // We have to do it here because logic above
                // makes use of this state: "badExit"
                // TODO ???
                if (item.type == 'segment') {
                    item.data.repetitions = 0;
                }
            }
            else {
                // Current item inside this group is not done yet
                // If the item is a segment this means it will repeat
                // If it is a group then it could mean something else

                // Generally, when we don't pull something off the stack it means
                // things are going well
                outIns = {...ins};
            }

            // Reset the group when pulling it off the stack
            // We always reset the group when exiting, this way we don't have to worry about it later on
            if (outIns.pullStack) {
                this.resetGroup(group);
            }

            // We need to return if we want to do either
            if (outIns.nextSegment || outIns.pullStack) { // TODO did not think this part through that well TODO seems to be fine!
                return outIns;
            }
        }
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

    private resetGroup(group: StructureGroup) {
        group.data.entryPointer = 0;
        group.data.repetitions++;
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