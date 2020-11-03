import { EdiFormat, EdiParser } from ".";
import { EdiStructure } from "./types/format";
import * as io from "./io";
import databuilder from "./databuilder";
import { BuildRules } from "./types/databuilder";
import "web-streams-polyfill";

/**
 * EDI configurations.
 */
type EdiOptions = {
    /**
     * The structure/format to use when parsing.
     */
    structure: EdiStructure;

    /**
     * Configure rules to specify the output shape when converting EDI to JSON.
     */
    buildRules: BuildRules;

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
    shape(rules: BuildRules): Edi {
        this.options = { ...this.options, buildRules: rules }
        return this;
    }

    /**
     * 
     * @param structure 
     */
    structure(structure: EdiStructure): Edi {
        this.options = { ...this.options, structure }
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
    build() {
        const parser = new EdiParser();
        const format = new EdiFormat(this.options.structure);

        return databuilder(format, this.options.buildRules, parser.parse(this.makeStream()));
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