import { StructureGroup } from '../structure/types';
import { makeSelectorApi } from './api';
import { EdiGroupState, EdiShape, EdiShapeCollector, EdiStructureStream, RuleProps, RuleSelector, ShapeRule, ShapeRuleFactory, ShapeRuleSet } from './types';
import { StreamCollector } from '../common/types';
import { Segment } from '../parser';

export class EdiShapeStateHandler {

    private state: EdiGroupState[];

    constructor() {
        this.reset();
    }

    reset() {
        this.state = [];
    }

    get() {
        return this.state;
    }

    head() {
        return this.state[0];
    }

    bottom() {
        return this.state.slice(-1)[0];
    }

    make(g: StructureGroup): EdiGroupState {
        return {
            structure: g,
            state: {}
        }
    }

    /**
     * Append a group to the stack.
     * @param g a group
     */
    enter(g: StructureGroup) {
        this.state.unshift(this.make(g));
    }

    /**
     * Pop the head off the stack.
     * @returns the head, if the data is not empty
     */
    pop() {
        return this.state.shift();
    }

    private notEmpty(s: {}) {
        return s && Object.keys(s).length > 0;
    }
}


export default class JsonBuilder<T> implements EdiShapeCollector<T> {

    state: EdiShapeStateHandler;

    constructor(private ruleset: ShapeRuleSet) {
        this.state = new EdiShapeStateHandler();
    }

    collector(): StreamCollector<EdiShape, Promise<T>> {
        return stream => this.collect(stream);
    }

    async collect(stream: EdiStructureStream): Promise<T> {
        return this.pump(stream.getReader());
    }

    private async pump(reader: ReadableStreamReader<EdiShape>): Promise<T> {
        const chunk = await reader.read();

        if (chunk.value) {
            this.handle(chunk.value);
        }

        if (chunk.done) {
            return this.state.bottom().state as T; // TODO
        }
        else {
            return this.pump(reader);
        }
    }

    private handle(shape: EdiShape) {
        const { event, structure } = shape;
        const { state } = this;
        const self = this;

        switch (event) {
            case "group_enter":
                enter();
                break;

            case "group_exit":
                exit();
                break;

            case "group_repeat":
                repeat();
                break;

            case "segment_done":
                segment();
                break;
        }

        function enter() {
            state.enter(structure as StructureGroup);
        }

        /**
         * Pop head of the stack and process.
         */
        function exit() {
            if (shape.structure.type == 'root') {
                return;
            }

            const group = state.pop();

            if (group) {
                self.process(state.head(), group);
            }
        }

        function repeat() {
            const group = state.pop();
            if (group) {
                self.process(state.head(), group);
            }

            self.process(state.head(), group);

            state.enter(group.structure);
        }

        function segment() {
            self.process(state.head(), shape);
        }
    }

    private process(group: EdiGroupState, shape: EdiShape | EdiGroupState) {
        const props = this.makeProps(group, shape);

        for (let rule of this.ruleset) {
            if (!(rule as ShapeRule)?.label) { // if rule is a factory
                const factory = rule as ShapeRuleFactory;
                const api = makeSelectorApi();
                rule = factory(api);
            }

            this.useRule(rule as ShapeRule, props);
        }
    }

    private useRule(rule: ShapeRule, props: RuleProps) {
        const { conditions, label } = rule;
        const { group, shape } = props;

        const computedLabel = (label as RuleSelector<string>)?.(props) || (label as string);
        const fullfilled = conditions.reduce<boolean>((val, c) => val && c(props), true);

        
        if (fullfilled) {
            if (props.shape.structure?.type != 'segment') {
                this.assign(group.state, (shape as EdiGroupState).state, computedLabel);
            }
            else {
                this.assign(group.state, (shape as EdiShape).data, computedLabel);
            }
        }
    }

    private assign(parent: {}, obj: any, key: string) {
        if (parent[key]) {
            parent[key] = [...parent[key], obj];
        }
        else {
            parent[key] = [obj];
        }
    }

    private makeProps(g: EdiGroupState, s: EdiShape | EdiGroupState): RuleProps {
        return {
            stack: this.state.get(),
            group: g,
            shape: s
        }
    }
}