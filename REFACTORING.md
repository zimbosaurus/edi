
# Definitions

## **Structure**
`Structure` and `Format` has been used interchangeable which causes
me a lot of confusion. From now on anything related to an
EDIFACT specification/format/structure such as BAPLIE or COPRAR will
be referred to as a `Structure`.
## **Format**
Don't use the term `format`.
## **Transform**
A transform is a pure function which receives a stream of data and converts
it into another stream or shape. Most common is the `EdiTransform` which receives
a stream of segments.
## **Shape**
The raw data of an EDI component (message, segment etc.) can be represented
and formatted in multiple ways, and the resulting data is referred to
as the `shape`.
## **Segment**
aaaaaa
<br><br>

# Core Functionality

## **EdiParser**
Parses EDI into segments. Will remain mostly as it was previously.
<br><br>

## **EdiTransform**
Transforms a stream of segment into another stream or shape.
### Changed Name
EdiFormat does not sound that great honestly.
### More Generic
Generalize `databuilder` function into a more generic EdiTransform.
The current `EdiFormat` is too inflexible and opinionated. This class
can be refactored into `EdiStructureTransform`.
<br><br>

## **(Edi) StructureTransform** (name WIP)
Replaces `EdiFormat`. Implements/extends `EdiTransform` and converts the
individual segments into a structure of their logical relations according to
an EDIFACT specification. Can also make use of a `ShapeBuilder` to change
the shape of the segments while building the structure.
<br><br>

## **(Edi) ShapeBuilder** (name WIP)
Makes a `shape` from a segment.
<br><br>