export interface ApexClassMember {
    FullName: string;
    ContentEntity: ApexClass;
    ContentEntityId: string;
    SymbolTable: SymbolTable;
    attributes: Attributes;
}

export interface ApexTriggerMember {
    FullName: string;
    ContentEntity: ApexClass;
    ContentEntityId: string;
    SymbolTable: SymbolTable;
    attributes: Attributes;
}

export interface Attributes {
    type: string;
    url: string;
}

export interface ApexClass {
    Id: string;
    Name: string;
    NamespacePrefix: string;
    Status: string;
}

export interface SymbolTable {
    annotations: Annotation;
    constructors: Constructor;
    externalReferences: ExternalReference;
    id: string;
    innerClasses: SymbolTable[];
    interfaces: string[];
    methods: Method[];
    name: string;
    namespace: string;
    parentClass: string;
    tableDeclaration: Symbol;
    properties: VisibilitySymbol[];
    variables: Symbol[];
}

export interface Constructor {
    location: Position;
    name: string;
    annotations: Annotation[];
    modifiers: string[];
    references: Position[];
    parameters: Parameter[];
}

export interface ExternalReference {
    name: string;
    namespace: string;
    methods: ExternalMethod[];
    references: Position[];
    variables: ExternalSymbol[];
}

interface Method {
    location: Position;
    name: string;
    type: string;
    returnType: string;
    visibility: string;
    annotations: Annotation[];
    modifiers: string[];
    references: Position[];
    parameters: Parameter[];
}

export interface Annotation {
    name: string;
}

export interface ExternalMethod {
    isStatic: Boolean;
    name: string;
    returnType: string;
    argTypes: string[];
    parameters: Parameter[];
    references: Position[];
}

export interface Parameter {
    name: string;
    type: string;
}

interface Symbol {
    annotations: Annotation[];
    location: Position;
    modifiers: string[];
    name: string;
    references: Position[];
    type: string;
    visibility: string;
}

export interface ExternalSymbol {
    name: string;
    references: Position[];
}

export interface VisibilitySymbol extends Symbol {
    // done
}

export interface Position {
    column: number;
    line: number;
}
