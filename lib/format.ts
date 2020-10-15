import {
    StructureItem,
    EdiFormatFactory,
    StructureGroup,
    StructureSegment,
    EdiStructure,
    IEdiFormat,
    IEdiParser,
    Segment,
    EdiFormatEventMap,
    StructureLabel
} from "./types";
import { Observable } from "observable";

const ERROR_INVALID_STRUCTURE_TYPE = 'Structure type is invalid.';
const ERROR_UNEXPECTED_SEGMENT = 'Segment received does not fit the format structure.'

type Instructions = { pullStack: boolean, nextSegment: boolean }

/**
 * 
 */
export class EdiFormat extends Observable<EdiFormatEventMap> implements IEdiFormat {
    private _structure: EdiStructure;
    private _shape: {};

    private isReading = false;
    private resolve: (value: any) => void;
    private reject: (value: any) => void;

    constructor(public parser: IEdiParser) {
        super();
    }
    
    file(path: string) {
        this.parser.file(path);
        return this;
    }

    shape<T extends {}>(shape: T) {
        this._shape = shape;
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

        const segmentListener = parser.any(({event, args}) => {
            switch (event) {
                case 'segment':
                    this.onSegment(args as Segment);
                default:
                    this.emit(event, args);
                    break;
            }

        });
        parser.once('end', () => {
            parser.removeListener('segment', segmentListener);
            this.reject(this.root.data.entryPointer); // TODO do something else here
        });

        // Init format
        // TODO make function?
        this.root = {type: 'root', entries: [...this._structure], conditional: false, repeat: 1, label: {name: 'root'}};

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
        let ins: Instructions;

        if (!item?.data) {
            this.appendItemData(item);
        }
        
        // Handle depending on item type
        if (item.type == 'segment') {
            ins = this.handleSegment(item, segment);
            if (ins.nextSegment) { // TODO do this inside function instead?
                item.data.repetitions++;
            }
        }
        else if (item.type == 'group' || item.type == 'root') {
            ins = this.handleGroup(item, segment);
            if (ins.pullStack) { // TODO do this inside function instead?
                item.data.entryPointer = 0;
                item.data.repetitions++;
            }
        }
        else {
            // TODO handle when type is invalid
            throw new Error(ERROR_INVALID_STRUCTURE_TYPE); // TODO better error message
        }

        if (ins.pullStack) {
            this.emit('item_done', item);
        }

        return ins;
    }

    /**
     * 
     * @param item 
     * @param segment 
     */
    private handleSegment(item: StructureSegment, segment: Segment): Instructions {
        let ins: Instructions = undefined;

        if (item.id == segment.getId()) {
            // We keep the item on the stack if it could repeat
            // Because the segment did match, we always want the next one
            this.emit('segment_done', item);
            ins = {pullStack: !this.canRepeat(item), nextSegment: true};
        }
        else if (item.conditional || this.hasRepeated(item)) {
            // id doesn't match, but it ok because it don't need to!
            // If id does not match we definitely don't want it!
            ins = {pullStack: true, nextSegment: false}
        }
        else {
            ins = {pullStack: true, nextSegment: false} // TODO ???
        }

        return ins;
    }
    
    /**
     * 
     * @param group 
     * @param segment 
     */
    private handleGroup(group: StructureGroup, segment: Segment): Instructions {
        const itemStack = [...group.entries];

        if (group.data.entryPointer == 0) {
            this.emit('group_enter', group);
        }

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
                this.emit('group_exit', group);
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
            this.resolve('RESOLVED'); // TODO do return
        }
    }

    /**
     * 
     * @param group 
     */
    private resetGroup(group: StructureGroup) {
        group.data.entryPointer = 0;
        group.data.repetitions++;
    }

    /**
     * 
     * @param item 
     */
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

    /**
     * 
     * @param group 
     */
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

/**
 * 
 * @param entries 
 * @param conditional 
 * @param repeat 
 */
export function makeStructureGroup(entries: StructureItem[], options: {conditional?: boolean, repeat?: number, label?: StructureLabel} = defaultGroupOptions) {
    options = {...defaultGroupOptions, ...options}
    return {
        type: 'group',
        entries,
        ...options
    } as StructureGroup
}

const defaultGroupOptions = {conditional: false, repeat: 1}

/**
 * 
 * @param item 
 */
export function applyLabel(item: StructureItem, name?: string, desc?: string, info?: any): StructureItem {
    return {...item, label: {name, description: desc, info} }
}

/**
 * 
 * @param parser 
 */
const format: EdiFormatFactory = parser => new EdiFormat(parser);
export default format;