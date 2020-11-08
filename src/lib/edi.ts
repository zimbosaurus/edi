import * as io from './io';
import { EdiStructureSpec } from './structure/types';
import 'web-streams-polyfill';
import JsonBuilder, { EdiStructureStream, ShapeRuleSet } from './shape';
import EdiParser from './parser';
import EdiStructureTransform from './structure';

/**
 * EDI configurations.
 */
type EdiOptions = {
    /**
     * The structure/format to use when parsing.
     */
    spec: EdiStructureSpec;

    /**
     * Configure rules to specify the output shape when converting EDI to JSON.
     */
    shapeRules: ShapeRuleSet;

    /**
     * Use the contents of a file when parsing.
     */
    file?: string;

    /**
     * Supply the data to parse as a string.
     */
    text?: string;

    /**
     * Use a stringstream when parsing.
     */
    stream?: ReadableStream<string>;
}

/**
 * Conveniently encapsulates the API in a rather simple class.
 * An instance of this class can be used to interface with the parsing and formatting API,
 * and supplies methods to use data in multiple shapes and automatically converts these to
 * a stream that can be used by the underlying parser and formatter.
 */
class Edi {

    constructor(public options?: EdiOptions) {}

    /**
     * 
     * @param rules 
     */
    shape(rules: ShapeRuleSet): Edi {
        this.options = { ...this.options, shapeRules: rules }
        return this;
    }

    /**
     * 
     * @param structure 
     */
    structure(structure: EdiStructureSpec): Edi {
        this.options = { ...this.options, spec: structure }
        return this;
    }
    
    /**
     * 
     * @param path 
     */
    file(path: string): Edi {
        this.options = { ...this.options, file: path }
        this.options.text = undefined;
        return this;
    }
    
    /**
     * 
     * @param text 
     */
    text(text: string): Edi {
        this.options = {...this.options, text }
        this.options.file = undefined;
        return this;
    }
    
    /**
     * Turn the last data that was added into a stream and parse it into an object.
     * @returns data in the shape described by the buildRules
     */
    async build<T>(): Promise<T> {
        const parser = new EdiParser();
        const dataStream = this.makeStream();
        const structureTransform = new TransformStream(new EdiStructureTransform(this.options.spec));

        const structureStream: EdiStructureStream = parser.parse(dataStream).pipeThrough(structureTransform);
        const builder = new JsonBuilder<T>(this.options.shapeRules).collector();
        const result = await builder(structureStream);

        return result;
    }

    /**
     * 
     */
    private makeStream(): ReadableStream<string> {
        if (this.options.file) {
            return io.streamFile(this.options.file);
        }
        else if (this.options.text) {
            return io.streamString(this.options.text);

        }
        else if (this.options.stream) {
            return this.options.stream;
        }
    }
}

/**
 * Convenience function to construct a new EDI instance.
 * @param options optional options to configure the instance on creation
 * @returns an EDI instance
 */
function edi(options?: EdiOptions) {
    return new Edi(options);
}

export default edi;
export { EdiOptions, Edi }