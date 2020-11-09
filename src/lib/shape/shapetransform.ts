import { EdiShape } from ".";
import { Segment } from "../parser";

export default class ShapeTransform<T> implements Transformer<EdiShape<Segment>, EdiShape<T>> {
    constructor(private transformFn: (shape: EdiShape<Segment>) => EdiShape<T>) {}

    transform(chunk: EdiShape<Segment>, controller: TransformStreamDefaultController<EdiShape<T>>) {
        controller.enqueue(this.transformFn(chunk));
    }
}