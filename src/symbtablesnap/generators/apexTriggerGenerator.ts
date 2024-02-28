import { Context } from './generator.js';
import { ApexTriggerMember } from '../../types/tooling.js';
import { hashCode } from '../../utils/hashUtils.js';
import { symbtablesnap__Apex_Trigger__c } from '../../types/symbtalesnap.js';
import { newApexTrigger } from '../factory/sObjectFactory.js';

export class ApexTriggerGenerator {
    context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    async generate(members: ApexTriggerMember[]) {
        const context = this.context;
        for (let member of members) {
            const symbolTable = member.SymbolTable;
            const apexTrigger = newApexTrigger({
                Name: (symbolTable.namespace ? symbolTable.namespace + '.' : '') + symbolTable.name,
                symbtablesnap__Trigger_ID__c: member.ContentEntityId,
                symbtablesnap__Trigger_Name__c: member.ContentEntity.Name,
                symbtablesnap__Symbol_Table_Available__c: Boolean(symbolTable),
                symbtablesnap__Namespace_Prefix__c: member.ContentEntity.NamespacePrefix,
                symbtablesnap__Is_Active__c: member.ContentEntity.Status === 'Active',
                symbtablesnap__Is_Referenced_Score__c: 0
            });
            apexTrigger.Name = apexTrigger.Name!.substring(0, 80);
            apexTrigger.symbtablesnap__Snapshot_Key__c = context.snapshot.Id + ':ApexTrigger:' + getHashCode(apexTrigger);
            context.registerRelationship(apexTrigger, 'symbtablesnap__Snapshot__c', context.snapshot);
            context.registerUpsert(apexTrigger);
            if (!symbolTable) {
                return;
            }
            await context.propertyGenerator.generate(apexTrigger, symbolTable);
            await context.methodReferenceGenerator.generate(apexTrigger, symbolTable);
        }
        await context.commit();
    }
}

function getHashCode(apexTrigger: symbtablesnap__Apex_Trigger__c): number {
    let hash = 7;
    hash = 31 * hash + hashCode(apexTrigger.symbtablesnap__Trigger_ID__c);
    return hash;
}
