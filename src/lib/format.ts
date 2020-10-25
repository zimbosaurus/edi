import {
    StructureItem,
    StructureGroup,
    StructureSegment,
    EdiStructure,
    IEdiFormat,
    EdiFormatEventMap,
    FORMAT_EVENT_DONE,
    FORMAT_EVENT_SEGMENT_DONE,
    FORMAT_EVENT_ITEM_DONE,
    FORMAT_EVENT_REPEAT,
    FORMAT_EVENT_GROUP_ENTER,
    FORMAT_EVENT_GROUP_EXIT
} from "./types/format";
import { Segment } from "./types/parser";
import { Observable } from "@zimbosaurus/observable";

const ERROR_INVALID_STRUCTURE_TYPE = 'Structure type is invalid.';
const ERROR_UNEXPECTED_SEGMENT = 'Segment received does not fit the format structure.'
const ERROR_MISSING_STRUCTURE = 'Format does not have a structure.' // TODO better

type Instructions = { pullStack: boolean, nextSegment: boolean }

/**
 * 
 */
export default class EdiFormat extends Observable<EdiFormatEventMap> implements IEdiFormat {
    private root: StructureGroup;
    private isReading = false;

    constructor(public formatStructure?: EdiStructure) {
        super();
    }
    
    structure(s: EdiStructure) {
        this.formatStructure = s;
        return this;
    }

    read(stream?: ReadableStream<Segment>) {

        // TODO error handling
        if (!this.formatStructure) {
            throw new Error(ERROR_MISSING_STRUCTURE);
        }

        const format = this;
        this.isReading = true;

        this.root = this.createRoot();
        readStream(stream.getReader());

        async function readStream(reader?: ReadableStreamReader<Segment>) {
            const { done, value: segment } = await reader.read();
            if (segment) {
                format.onSegment(segment);
            }

            if (!done) {
                format.isReading = false;
                return await readStream(reader); 
            }
        }
    }

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
        }
        else {
            // TODO handle when type is invalid
            throw new Error(ERROR_INVALID_STRUCTURE_TYPE); // TODO better error message
        }

        if (ins.pullStack) {
            this.emit(FORMAT_EVENT_ITEM_DONE, item);
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
            this.emit(FORMAT_EVENT_SEGMENT_DONE, {item, data: segment});
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
            this.emit(FORMAT_EVENT_GROUP_ENTER, group);
        }

        // Iterating over items in group until we request the next segment, OR pull the group off the stack
        while (true) {

            if (this.isDone(group)) { // TODO maybe not work?? TODO maybe yes work!
                this.resetGroup(group);
                this.emit(FORMAT_EVENT_REPEAT, group);
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
                // If it is a group then it could mean something else, MAYBE not

                // Generally, when we don't pull something off the stack it means
                // things are going well
                outIns = {...ins};
            }

            // Reset the group when pulling it off the stack
            // We always reset the group when exiting, this way we don't have to worry about it later on
            if (outIns.pullStack) {
                this.emit(FORMAT_EVENT_GROUP_EXIT, group);
                group.data.repetitions++; // TODO NEW should we really increase repetitions here?
                group.data.entryPointer = 0;
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
            this.emit(FORMAT_EVENT_DONE);
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

    private createRoot(): StructureGroup {
        return {type: 'root', entries: [...this.formatStructure], conditional: false, repeat: 1, label: {name: 'root'}}
    }
}