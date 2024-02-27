import {
    SnapshotRecord,
    SnapshotSObjectType,
    symbtablesnap__Apex_Class__c,
    symbtablesnap__Symbol_Table_Snapshot__c
} from '../../types/symbtalesnap.js';

export function newSnapshot(record?: Partial<symbtablesnap__Symbol_Table_Snapshot__c>) {
    return newRecord<symbtablesnap__Symbol_Table_Snapshot__c>('symbtablesnap__Symbol_Table_Snapshot__c', record);
}

export function newApexClass(record?: Partial<symbtablesnap__Apex_Class__c>) {
    return newRecord<symbtablesnap__Apex_Class__c>('symbtablesnap__Apex_Class__c', record);
}

export function newRecord<T extends SnapshotRecord>(sObjectType: SnapshotSObjectType, record?: Partial<T>): T {
    return {
        ...(record || {}),
        attributes: {
            type: sObjectType
        }
    } as T;
}
