import { DateString } from 'jsforce';
import { hasAnyJson, hasString, isString, Optional } from '@salesforce/ts-types';
import { BlobString } from 'jsforce/src/types/schema.js';

const snapshotSObjectTypeNames: string[] = [
    'symbtablesnap__Apex_Class__c',
    'symbtablesnap__Apex_Trigger__c',
    'symbtablesnap__Method__c',
    'symbtablesnap__Property__c',
    'symbtablesnap__Interface_Implementation__c',
    'symbtablesnap__Method_Reference__c',
    'symbtablesnap__Declaration__c',
    'symbtablesnap__Method_Declaration__c'
] as const;

export type SnapshotSObjectTypeName =
    | 'symbtablesnap__Symbol_Table_Snapshot__c'
    | 'symbtablesnap__Apex_Class__c'
    | 'symbtablesnap__Apex_Trigger__c'
    | 'symbtablesnap__Method__c'
    | 'symbtablesnap__Property__c'
    | 'symbtablesnap__Interface_Implementation__c'
    | 'symbtablesnap__Method_Reference__c'
    | 'symbtablesnap__Declaration__c'
    | 'symbtablesnap__Method_Declaration__c';

export type AllSObjectTypes =
    | symbtablesnap__Symbol_Table_Snapshot__c
    | symbtablesnap__Apex_Class__c
    | symbtablesnap__Apex_Trigger__c
    | symbtablesnap__Method__c
    | symbtablesnap__Property__c
    | symbtablesnap__Interface_Implementation__c
    | symbtablesnap__Method_Reference__c
    | symbtablesnap__Declaration__c
    | symbtablesnap__Method_Declaration__c;

export type SnapshotRecordFields =
    | keyof symbtablesnap__Symbol_Table_Snapshot__c
    | keyof symbtablesnap__Apex_Class__c
    | keyof symbtablesnap__Apex_Trigger__c
    | keyof symbtablesnap__Method__c
    | keyof symbtablesnap__Property__c
    | keyof symbtablesnap__Interface_Implementation__c
    | keyof symbtablesnap__Method_Reference__c
    | keyof symbtablesnap__Declaration__c
    | keyof symbtablesnap__Method_Declaration__c;

export type RecordsByType = {
    [Key in AllSObjectTypes['attributes']['type']]?: Extract<AllSObjectTypes, { attributes: { type: Key } }>[];
};

export type Attributes = {
    type: SnapshotSObjectTypeName;
    url?: string;
};

export type SnapshotSObjectFieldType = Attributes | AllSObjectTypes | number | boolean | DateString | BlobString | string | null;

export type SnapshotRecord = Partial<
    Record<string, SnapshotSObjectFieldType> & {
        [name: string]: SnapshotSObjectFieldType;
    }
> & {
    Name?: string;
    attributes: Attributes;
    symbtablesnap__Snapshot_Key__c: string;
    Id?: string;
};

export function isApexClass(value: unknown): value is symbtablesnap__Apex_Class__c {
    return isSnapshotRecord(value) && value?.attributes?.type === 'symbtablesnap__Apex_Class__c';
}

export function asApexClass(value: unknown): Optional<symbtablesnap__Apex_Class__c> {
    return isApexClass(value) ? value : undefined;
}

export function isApexTrigger(value: unknown): value is symbtablesnap__Apex_Trigger__c {
    return isSnapshotRecord(value) && value?.attributes?.type === 'symbtablesnap__Apex_Trigger__c';
}

export function asApexTrigger(value: unknown): Optional<symbtablesnap__Apex_Trigger__c> {
    return isApexTrigger(value) ? value : undefined;
}

export function isMethod(value: unknown): value is symbtablesnap__Method__c {
    return isSnapshotRecord(value) && value?.attributes?.type === 'symbtablesnap__Method__c';
}

export function asMethod(value: unknown): Optional<symbtablesnap__Method__c> {
    return isMethod(value) ? value : undefined;
}

export function isProperty(value: unknown): value is symbtablesnap__Property__c {
    return isSnapshotRecord(value) && value?.attributes?.type === 'symbtablesnap__Property__c';
}

export function asProperty(value: unknown): Optional<symbtablesnap__Property__c> {
    return isProperty(value) ? value : undefined;
}

export function isSnapshotRecord(value: unknown): value is SnapshotRecord {
    if (hasAnyJson(value, 'attributes')) {
        const attributes = value.attributes;
        if (hasString(attributes, 'type')) {
            return isString(attributes.type) && snapshotSObjectTypeNames.includes(attributes.type);
        }
    }
    return false;
}

export interface symbtablesnap__Apex_Class__c extends SnapshotRecord {
    attributes: {
        type: 'symbtablesnap__Apex_Class__c';
    };
    Name: string;
    symbtablesnap__Access_Modifier__c: string | null;
    symbtablesnap__Class_ID__c: string;
    symbtablesnap__Class_Name__c: string;
    symbtablesnap__Extends_Class__c?: string;
    symbtablesnap__Extends_Class__r?: symbtablesnap__Apex_Class__c;
    symbtablesnap__Extends_Full_Name__c: string;
    symbtablesnap__Full_Name__c: string;
    symbtablesnap__Implements__c: string | null;
    symbtablesnap__Is_Apex_Job_Enqueued__c: boolean;
    symbtablesnap__Is_Referenced_Score__c: number;
    symbtablesnap__Is_Test__c: boolean;
    symbtablesnap__Is_Top_Level_Class__c: boolean;
    symbtablesnap__Modifiers__c: string | null;
    symbtablesnap__Namespace_Prefix__c: string | null;
    symbtablesnap__Number_of_Methods__c: number;
    symbtablesnap__Snapshot__c?: string;
    symbtablesnap__Snapshot__r?: symbtablesnap__Symbol_Table_Snapshot__c;
    symbtablesnap__Symbol_Table_Available__c?: boolean;
    symbtablesnap__Top_Level_Class__c?: string;
    symbtablesnap__Top_Level_Class__r?: symbtablesnap__Apex_Class__c;
    symbtablesnap__Top_Level_Full_Name__c?: string;
}

export interface symbtablesnap__Apex_Trigger__c extends SnapshotRecord {
    attributes: {
        type: 'symbtablesnap__Apex_Trigger__c';
    };
    Name: string;
    symbtablesnap__Snapshot__c?: string;
    symbtablesnap__Namespace_Prefix__c: string | null;
    symbtablesnap__Symbol_Table_Available__c: boolean;
    symbtablesnap__Trigger_ID__c: string;
    symbtablesnap__Trigger_Name__c: string;
    symbtablesnap__Is_Active__c: boolean;
    symbtablesnap__Is_Referenced_Score__c: number;
}

export interface symbtablesnap__Declaration__c extends SnapshotRecord {
    attributes: {
        type: 'symbtablesnap__Declaration__c';
    };
    Name: string;
    symbtablesnap__Type__c: string;
    symbtablesnap__Snapshot__c?: string;
}

export interface symbtablesnap__Interface_Implementation__c extends SnapshotRecord {
    attributes: {
        type: 'symbtablesnap__Interface_Implementation__c';
    };
    Name: string;
    symbtablesnap__Implementation_Class__c?: string;
    symbtablesnap__Implementation_Class__r?: symbtablesnap__Apex_Class__c;
    symbtablesnap__Implements_Interface__c?: string | null;
    symbtablesnap__Implements_Interface__r?: symbtablesnap__Apex_Class__c;
    symbtablesnap__Implements__c: string;
    symbtablesnap__Snapshot__c?: string;
}

export interface symbtablesnap__Method_Declaration__c extends SnapshotRecord {
    attributes: {
        type: 'symbtablesnap__Method_Declaration__c';
    };
    Name: string;
    symbtablesnap__Method__c?: string;
    symbtablesnap__Declaration__c?: string;
    symbtablesnap__Snapshot__c?: string;
    symbtablesnap__Type__c: string;
}

export interface symbtablesnap__Method_Reference__c extends SnapshotRecord {
    attributes: {
        type: 'symbtablesnap__Method_Reference__c';
    };
    Name: string;
    symbtablesnap__Is_External__c: boolean;
    symbtablesnap__Referenced_Class_Name__c: string;
    symbtablesnap__Referenced_Namespace__c: string | null;
    symbtablesnap__Referenced_Method__c?: string;
    symbtablesnap__Referenced_Method__r?: symbtablesnap__Method__c;
    symbtablesnap__Referenced_Method_Name__c: string;
    symbtablesnap__Snapshot__c?: string;
    symbtablesnap__Used_By_Class__c?: string;
    symbtablesnap__Used_By_Class__r?: symbtablesnap__Apex_Class__c;
    symbtablesnap__Used_By_Trigger__c?: string;
    symbtablesnap__Used_By_Trigger__r?: symbtablesnap__Apex_Trigger__c;
    symbtablesnap__Used_By_Method__c?: string;
    symbtablesnap__Used_By_Method__r?: symbtablesnap__Method__c;
    symbtablesnap__Reference_Line__c: number;
    symbtablesnap__Reference_Column__c: number;
}

export interface symbtablesnap__Method__c extends SnapshotRecord {
    attributes: {
        type: 'symbtablesnap__Method__c';
    };
    Name: string;
    symbtablesnap__Class__c?: string;
    symbtablesnap__Class__r?: symbtablesnap__Apex_Class__c;
    symbtablesnap__Is_Test__c: boolean;
    symbtablesnap__Method_Name__c: string;
    symbtablesnap__Return_Type__c: string;
    symbtablesnap__Snapshot__c?: string;
    symbtablesnap__Is_Overloaded__c: boolean;
    symbtablesnap__Number_of_Parameters__c: number;
    symbtablesnap__Signature__c: string;
    symbtablesnap__Modifiers__c: string | null;
    symbtablesnap__Is_Constructor__c: boolean;
    symbtablesnap__Access_Modifier__c: string | null;
    symbtablesnap__Return_Class__c?: string;
    symbtablesnap__Is_Referenced_Score__c: number;
    symbtablesnap__Location_Line__c: number;
    symbtablesnap__Location_Column__c: number;
}

export interface symbtablesnap__Property__c extends SnapshotRecord {
    attributes: {
        type: 'symbtablesnap__Property__c';
    };
    Name: string;
    symbtablesnap__Snapshot__c?: string;
    symbtablesnap__Class__c?: string;
    symbtablesnap__Class__r?: symbtablesnap__Apex_Class__c;
    symbtablesnap__Trigger__c?: string;
    symbtablesnap__Trigger__r?: symbtablesnap__Apex_Trigger__c;
    symbtablesnap__Location_Line__c: number;
    symbtablesnap__Location_Column__c: number;
}

export interface symbtablesnap__Symbol_Table_Snapshot__c extends SnapshotRecord {
    attributes: {
        type: 'symbtablesnap__Symbol_Table_Snapshot__c';
    };
    symbtablesnap__Is_Latest__c: boolean;
    symbtablesnap__Org_Namespace_Prefix__c: string | null;
    symbtablesnap__Org_ID__c: string;
}
