import Segment from "../parser/segment";
import { EdiShape } from '../shape/types';
import { EdiFormatEventMap as EdiStructureEventMap, FORMAT_EVENT_GROUP_ENTER, FORMAT_EVENT_GROUP_EXIT, FORMAT_EVENT_ITEM_DONE, FORMAT_EVENT_GROUP_REPEAT, FORMAT_EVENT_SEGMENT_DONE } from "./events";
import { EdiStructureSpec, StructureGroup, StructureSegment, StructureItem } from "./types";

/**
 * 
 */
type Instructions = { pullStack: boolean, nextSegment: boolean }

/**
 * 
 */
type Controller = TransformStreamDefaultController<EdiShape>;

const ERROR_INVALID_STRUCTURE_TYPE = 'Structure type is invalid.';
const ERROR_UNEXPECTED_SEGMENT = 'Segment received does not fit the format structure.'
const ERROR_MISSING_STRUCTURE = 'Format does not have a structure.' // TODO better

/**
 * Transforms a segmentstream into a structurestream.
 */
export default class EdiStructureTransform implements Transformer<Segment, EdiShape<Segment>> {

    private root: StructureGroup;

    constructor(private spec: EdiStructureSpec) {}

    start() {
        this.root = this.createRoot();
    }

    transform(segment: Segment, controller: Controller) {
        this.onSegment(segment, controller);
    }

    read(stream?: ReadableStream<Segment>): ReadableStream<EdiShape<Segment>> {
        return stream.pipeThrough<EdiShape<Segment>>(new TransformStream<Segment, EdiShape<Segment>>(this));
    }

    structure(spec: EdiStructureSpec) {
        this.spec = spec;
        return this;
    }

    makeOutputShape(event: keyof EdiStructureEventMap, structure: StructureItem, segment: Segment): EdiShape<Segment> {
        return {
            data: segment,
            structure,
            event
        }
    }

    /**
     * Evaluates a segment and returns true if this item did not expect the given segment, and therefore should be pulled of the itemstack.
     * Should not have any side-effects!
     * @param item the structure item
     * @param segment
     * @returns if the item should be pulled
     */
    private handleItem(item: StructureItem, segment: Segment, controller: Controller): Instructions {
        // The return value
        let ins: Instructions;

        if (!item?.meta) {
            this.appendItemData(item);
        }
        
        // Handle depending on item type
        if (item.type == 'segment') {
            ins = this.handleSegment(item, segment, controller);
            if (ins.nextSegment) { // TODO do this inside function instead?
                item.meta.repetitions++;
            }
        }
        else if (item.type == 'group' || item.type == 'root') {
            ins = this.handleGroup(item, segment, controller);
        }
        else {
            // TODO handle when type is invalid
            throw new Error(ERROR_INVALID_STRUCTURE_TYPE); // TODO better error message
        }

        if (ins.pullStack) {
            controller.enqueue(this.makeOutputShape(FORMAT_EVENT_ITEM_DONE, item, segment));
        }

        return ins;
    }

    /**
     * 
     * @param item 
     * @param segment 
     */
    private handleSegment(item: StructureSegment, segment: Segment, controller: Controller): Instructions {
        let ins: Instructions = undefined;

        if (item.id == segment.getId()) {
            // We keep the item on the stack if it could repeat
            // Because the segment did match, we always want the next one
            controller.enqueue(this.makeOutputShape(FORMAT_EVENT_SEGMENT_DONE, item, segment));
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
    private handleGroup(group: StructureGroup, segment: Segment, controller: Controller): Instructions {
        const itemStack = [...group.entries];

        if (group.meta.entryPointer == 0) {
            controller.enqueue(this.makeOutputShape(FORMAT_EVENT_GROUP_ENTER, group, segment));
        }

        // Iterating over items in group until we request the next segment, OR pull the group off the stack
        while (true) {

            if (this.isDone(group)) { // TODO maybe not work?? TODO maybe yes work!
                this.resetGroup(group);
                controller.enqueue(this.makeOutputShape(FORMAT_EVENT_GROUP_REPEAT, group, segment));
            }

            const item = itemStack[group.meta.entryPointer];
            let ins: Instructions = this.handleItem(item, segment, controller);
            let outIns: Instructions = undefined;

            if (ins.pullStack) {
                // Current item inside this group is done and wants to be pulled off the stack
                // This is either because it can't repeat or it did not fit and was conditional

                group.meta.entryPointer++; // MAYBE we always want to do this

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
                    item.meta.repetitions = 0;
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
                controller.enqueue(this.makeOutputShape(FORMAT_EVENT_GROUP_EXIT, group, segment));
                group.meta.repetitions++; // TODO NEW should we really increase repetitions here?
                group.meta.entryPointer = 0;
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
    private onSegment(segment: Segment, controller: Controller) {
        if (this.handleItem(this.root, segment, controller).pullStack) {
            controller.enqueue(this.makeOutputShape("done", undefined, segment))
        }
    }

    /**
     * 
     * @param group 
     */
    private resetGroup(group: StructureGroup) {
        group.meta.entryPointer = 0;
        group.meta.repetitions++;
    }

    /**
     * 
     * @param item 
     */
    private appendItemData(item: StructureItem) {
        item.meta = {
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
        return item.type != 'root' && (item?.meta.repetitions) < (item as StructureGroup | StructureSegment).repeat - 1;
    }

    /**
     * 
     * @param item 
     */
    private hasRepeated(item: StructureItem) {
        return item.meta.repetitions > 0;
    }

    /**
     * 
     * @param group 
     */
    private isDone(group: StructureGroup) {
        return group.meta.entryPointer >= group.entries.length;
    }

    /**
     * 
     */
    private createRoot(): StructureGroup {
        return {
            type: 'root',
            entries: [...this.spec],
            conditional: false,
            repeat: 1,
            label: {name: 'root'}
        }
    }
}