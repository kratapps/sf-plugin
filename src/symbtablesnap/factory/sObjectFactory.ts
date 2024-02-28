import {
    SnapshotRecord,
    SnapshotSObjectType,
    symbtablesnap__Apex_Class__c,
    symbtablesnap__Apex_Trigger__c,
    symbtablesnap__Declaration__c,
    symbtablesnap__Interface_Implementation__c,
    symbtablesnap__Method__c,
    symbtablesnap__Method_Declaration__c,
    symbtablesnap__Method_Reference__c,
    symbtablesnap__Property__c,
    symbtablesnap__Symbol_Table_Snapshot__c
} from '../../types/symbtalesnap.js';

export function newSnapshot(record?: Partial<symbtablesnap__Symbol_Table_Snapshot__c>) {
    return newRecord<symbtablesnap__Symbol_Table_Snapshot__c>('symbtablesnap__Symbol_Table_Snapshot__c', record);
}

export function newApexClass(record?: Partial<symbtablesnap__Apex_Class__c>) {
    return newRecord<symbtablesnap__Apex_Class__c>('symbtablesnap__Apex_Class__c', record);
}

export function newApexTrigger(record?: Partial<symbtablesnap__Apex_Trigger__c>) {
    return newRecord<symbtablesnap__Apex_Trigger__c>('symbtablesnap__Apex_Trigger__c', record);
}

export function newInterfaceImpl(record?: Partial<symbtablesnap__Interface_Implementation__c>) {
    return newRecord<symbtablesnap__Interface_Implementation__c>('symbtablesnap__Interface_Implementation__c', record);
}

export function newMethod(record?: Partial<symbtablesnap__Method__c>) {
    return newRecord<symbtablesnap__Method__c>('symbtablesnap__Method__c', record);
}

export function newDeclaration(record?: Partial<symbtablesnap__Declaration__c>) {
    return newRecord<symbtablesnap__Declaration__c>('symbtablesnap__Declaration__c', record);
}

export function newMethodDeclaration(record?: Partial<symbtablesnap__Method_Declaration__c>) {
    return newRecord<symbtablesnap__Method_Declaration__c>('symbtablesnap__Method_Declaration__c', record);
}

export function newMethodReference(record?: Partial<symbtablesnap__Method_Reference__c>) {
    return newRecord<symbtablesnap__Method_Reference__c>('symbtablesnap__Method_Reference__c', record);
}

export function newProperty(record?: Partial<symbtablesnap__Property__c>) {
    return newRecord<symbtablesnap__Property__c>('symbtablesnap__Property__c', record);
}

export function newRecord<T extends SnapshotRecord>(sObjectType: SnapshotSObjectType, record?: Partial<T>): T {
    return {
        ...(record || {}),
        attributes: {
            type: sObjectType
        }
    } as T;
}
