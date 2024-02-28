import {
    symbtablesnap__Apex_Class__c,
    symbtablesnap__Apex_Trigger__c,
    symbtablesnap__Interface_Implementation__c,
    symbtablesnap__Method__c,
    symbtablesnap__Method_Reference__c,
    symbtablesnap__Property__c
} from '../../types/symbtalesnap.js';
import { Connection } from '@salesforce/core/lib/org/connection.js';
import { queryAll } from '../../utils/salesforce.js';

export class Selector {
    conn: Connection;

    constructor(conn: Connection) {
        this.conn = conn;
    }

    async queryApexClasses(snapshotId: string): Promise<symbtablesnap__Apex_Class__c[]> {
        const query = `
            SELECT 
                Id,
                symbtablesnap__Snapshot_Key__c,
                symbtablesnap__Class_ID__c,
                symbtablesnap__Class_Name__c,
                symbtablesnap__Full_Name__c,
                symbtablesnap__Symbol_Table_Available__c,
                symbtablesnap__Extends_Full_Name__c,
                symbtablesnap__Top_Level_Full_Name__c,
                symbtablesnap__Is_Test__c,
                symbtablesnap__Modifiers__c,
                symbtablesnap__Access_Modifier__c,
                symbtablesnap__Is_Referenced_Score__c,
                symbtablesnap__Is_Top_Level_Class__c,
                symbtablesnap__Number_of_Methods__c
            FROM symbtablesnap__Apex_Class__c
            WHERE symbtablesnap__Snapshot__c = '${snapshotId}'`;
        const records: symbtablesnap__Apex_Class__c[] = [];
        await queryAll<symbtablesnap__Apex_Class__c>(this.conn, query, async (result) => {
            records.push(...result.records);
        });
        return records;
    }

    async queryApexTriggers(snapshotId: string): Promise<symbtablesnap__Apex_Trigger__c[]> {
        const query = `
            SELECT Id, Name, symbtablesnap__Snapshot_Key__c, symbtablesnap__Is_Active__c, symbtablesnap__Is_Referenced_Score__c
            FROM symbtablesnap__Apex_Trigger__c
            WHERE symbtablesnap__Snapshot__c = '${snapshotId}'`;
        const records: symbtablesnap__Apex_Trigger__c[] = [];
        await queryAll<symbtablesnap__Apex_Trigger__c>(this.conn, query, async (result) => {
            records.push(...result.records);
        });
        return records;
    }

    async queryInterfaceImplementations(snapshotId: string): Promise<symbtablesnap__Interface_Implementation__c[]> {
        const query = `
            SELECT
                Id,
                Name,
                symbtablesnap__Implements__c,
                symbtablesnap__Implements_Interface__c,
                symbtablesnap__Implements_Interface__r.Id,
                symbtablesnap__Implements_Interface__r.symbtablesnap__Snapshot_Key__c,
                symbtablesnap__Implements_Interface__r.symbtablesnap__Namespace_Prefix__c,
                symbtablesnap__Implements_Interface__r.symbtablesnap__Class_Name__c,
                symbtablesnap__Implementation_Class__c,
                symbtablesnap__Implementation_Class__r.Id,
                symbtablesnap__Implementation_Class__r.symbtablesnap__Snapshot_Key__c,
                symbtablesnap__Implementation_Class__r.symbtablesnap__Namespace_Prefix__c,
                symbtablesnap__Implementation_Class__r.symbtablesnap__Class_Name__c
            FROM symbtablesnap__Interface_Implementation__c
            WHERE symbtablesnap__Snapshot__c = '${snapshotId}'`;
        const records: symbtablesnap__Interface_Implementation__c[] = [];
        await queryAll<symbtablesnap__Interface_Implementation__c>(this.conn, query, async (result) => {
            records.push(...result.records);
        });
        return records;
    }

    async queryMethods(snapshotId: string): Promise<symbtablesnap__Method__c[]> {
        const query = `
            SELECT
                Id,
                symbtablesnap__Snapshot_Key__c,
                symbtablesnap__Method_Name__c,
                symbtablesnap__Is_Referenced_Score__c,
                symbtablesnap__Location_Line__c,
                symbtablesnap__Location_Column__c,
                symbtablesnap__Class__r.Id,
                symbtablesnap__Class__r.symbtablesnap__Snapshot_Key__c,
                symbtablesnap__Class__r.symbtablesnap__Namespace_Prefix__c,
                symbtablesnap__Class__r.symbtablesnap__Class_Name__c,
                symbtablesnap__Class__r.symbtablesnap__Class_ID__c,
                symbtablesnap__Class__r.symbtablesnap__Top_Level_Class__r.Id,
                symbtablesnap__Class__r.symbtablesnap__Top_Level_Class__r.symbtablesnap__Snapshot_Key__c,
                symbtablesnap__Class__r.symbtablesnap__Top_Level_Class__r.symbtablesnap__Namespace_Prefix__c,
                symbtablesnap__Class__r.symbtablesnap__Top_Level_Class__r.symbtablesnap__Class_Name__c
            FROM symbtablesnap__Method__c
            WHERE symbtablesnap__Snapshot__c = '${snapshotId}'`;
        const records: symbtablesnap__Method__c[] = [];
        await queryAll<symbtablesnap__Method__c>(this.conn, query, async (result) => {
            records.push(...result.records);
        });
        return records;
    }

    async queryProperties(snapshotId: string): Promise<symbtablesnap__Property__c[]> {
        const query = `
            SELECT
                Id,
                symbtablesnap__Snapshot_Key__c,
                symbtablesnap__Location_Line__c,
                symbtablesnap__Location_Column__c,
                symbtablesnap__Class__r.Id,
                symbtablesnap__Class__r.symbtablesnap__Snapshot_Key__c,
                symbtablesnap__Class__r.symbtablesnap__Namespace_Prefix__c,
                symbtablesnap__Class__r.symbtablesnap__Class_Name__c,
                symbtablesnap__Class__r.symbtablesnap__Class_ID__c,
                symbtablesnap__Class__r.symbtablesnap__Top_Level_Class__r.Id,
                symbtablesnap__Class__r.symbtablesnap__Top_Level_Class__r.symbtablesnap__Snapshot_Key__c,
                symbtablesnap__Class__r.symbtablesnap__Top_Level_Class__r.symbtablesnap__Namespace_Prefix__c,
                symbtablesnap__Class__r.symbtablesnap__Top_Level_Class__r.symbtablesnap__Class_Name__c,
                symbtablesnap__Trigger__r.Id,
                symbtablesnap__Trigger__r.symbtablesnap__Snapshot_Key__c,
                symbtablesnap__Trigger__r.symbtablesnap__Namespace_Prefix__c,
                symbtablesnap__Trigger__r.symbtablesnap__Trigger_Name__c,
                symbtablesnap__Trigger__r.symbtablesnap__Trigger_ID__c
            FROM symbtablesnap__Property__c
            WHERE symbtablesnap__Snapshot__c = '${snapshotId}'`;
        const records: symbtablesnap__Property__c[] = [];
        await queryAll<symbtablesnap__Property__c>(this.conn, query, async (result) => {
            records.push(...result.records);
        });
        return records;
    }

    async queryMethodReferences(snapshotId: string): Promise<symbtablesnap__Method_Reference__c[]> {
        const query = `
            SELECT 
                Id,
                symbtablesnap__Referenced_Class_Name__c,
                symbtablesnap__Referenced_Namespace__c,
                symbtablesnap__Referenced_Method_Name__c,
                symbtablesnap__Referenced_Method__r.Id,
                symbtablesnap__Referenced_Method__r.symbtablesnap__Snapshot_Key__c,
                symbtablesnap__Referenced_Method__r.symbtablesnap__Class__r.Id,
                symbtablesnap__Referenced_Method__r.symbtablesnap__Class__r.symbtablesnap__Snapshot_Key__c,
                symbtablesnap__Referenced_Method__r.symbtablesnap__Class__r.symbtablesnap__Namespace_Prefix__c,
                symbtablesnap__Referenced_Method__r.symbtablesnap__Class__r.symbtablesnap__Class_Name__c,
                symbtablesnap__Referenced_Method__r.symbtablesnap__Class__r.symbtablesnap__Top_Level_Class__r.Id,
                symbtablesnap__Referenced_Method__r.symbtablesnap__Class__r.symbtablesnap__Top_Level_Class__r.symbtablesnap__Snapshot_Key__c,
                symbtablesnap__Referenced_Method__r.symbtablesnap__Class__r.symbtablesnap__Top_Level_Class__r.symbtablesnap__Namespace_Prefix__c,
                symbtablesnap__Referenced_Method__r.symbtablesnap__Class__r.symbtablesnap__Top_Level_Class__r.symbtablesnap__Class_Name__c,
                symbtablesnap__Used_By_Class__c,
                symbtablesnap__Used_By_Class__r.Id,
                symbtablesnap__Used_By_Class__r.symbtablesnap__Snapshot_Key__c,
                symbtablesnap__Used_By_Class__r.symbtablesnap__Namespace_Prefix__c,
                symbtablesnap__Used_By_Class__r.symbtablesnap__Class_Name__c,
                symbtablesnap__Used_By_Trigger__c,
                symbtablesnap__Used_By_Trigger__r.Id,
                symbtablesnap__Used_By_Trigger__r.symbtablesnap__Snapshot_Key__c,
                symbtablesnap__Used_By_Trigger__r.symbtablesnap__Namespace_Prefix__c,
                symbtablesnap__Used_By_Trigger__r.symbtablesnap__Trigger_Name__c
            FROM symbtablesnap__Method_Reference__c
            WHERE symbtablesnap__Snapshot__c = '${snapshotId}'`;
        const records: symbtablesnap__Property__c[] = [];
        await queryAll<symbtablesnap__Property__c>(this.conn, query, async (result) => {
            records.push(...result.records);
        });
        return records;
    }
}
