## **EDI Parser Design**
*By Anton Ekström*

<br/>

# To-Do
- Foundation
  * ~~Basic parsing~~
  * ~~Types~~
- Format parsing
- Performance improvements
  * Not sure 🤔🤔

<br/>

# Goals
- Simple, intuitive API
  * Event-driven reader
  * Legit error handling
- Low-level basic parsing of the EDI fileformat
- Higher level wrapper around parser for different EDI formats
  * Modular support for different formats
  * Make format from JSON config file

<br/>

# Implementation
### Stacks
Use stacks for parsing the format. Make a copy of the format and pop segment of stack when done with it. This makes it easy to check the next item in the format, by peeking the head of the stack.
### Decomposition


<br/>

# Parsing algorithm

### **EDI Parsing**
```pseudocode
read characters of data
for each character:
    if character is segment delimiter:
        create segment

for each segment:
    extract segment identifier
```

### **Format parsing**
```pseudocode
process segments
when receiving segment:
    keep track of where we are in the format // EXPLAIN
    compare with next expected segment in format

    SPLIT LOGIC INTO WELL-NAMED FUNCTIONS
    is expected if:
        is possible in current group
        is beginning of next group
    
isLegal(segment, group):

```

### **API Usage Example**
```typescript
// Import parserfactory and a format to use
import edi, { BaplieReader } from 'edi-parser';

// Create parser, using different data types
const parser = edi('FILE_PATH');
const parser = edi(dataBuffer);
const parser = edi(stringArray);

// Listen to events
parser.on('segment', segment => {/* do something */});

// Call method to process data
parser.parse()

// OR use chaining
const parser = edi('FILE_PATH').parse();

// Wrap parser in formatreader
const baplieReader = new EdiFormat(parser);

// Somehow specify the shape of the resulting data structure
// TODO Better idea!!
baplieReader.shape({
    containers: (segment) => isContainer(segment)
})
```