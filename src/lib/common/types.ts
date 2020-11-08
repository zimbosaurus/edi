import Segment from '../parser';

/**
 * A stream of segments.
 */
export type EdiSegmentStream = ReadableStream<Segment>;

/**
 * Collects a stream into one object.
 */
export type StreamCollector<T, R> = (stream: ReadableStream<T>) => R;