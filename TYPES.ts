import { resolve } from 'path';
import { streamFile } from './src/lib/io';
import EdiParser, { IEdiParser, Segment } from './src/lib/parser';
import 'web-streams-polyfill';
import { EdiFormatEventMap } from './src/lib/structure/events';
import { StructureGroup, StructureItem, StructureSegment } from './src/lib/structure/types';
import BAPLIE, {  } from './src/lib/structure/specs/BAPLIE';

const fileStream: ReadableStream<string> = streamFile(resolve(__dirname, 'data/baplie.EDI'));

const parser: IEdiParser = new EdiParser();
const segments: EdiSegmentStream = fileStream.pipeThrough(new TransformStream(parser.transform()));

const structure: EdiStructureStream = segments.pipeThrough(new TransformStream(new EdiStructureTransform()));
const result = new JSONBuilder<number>(undefined).collector()(structure);