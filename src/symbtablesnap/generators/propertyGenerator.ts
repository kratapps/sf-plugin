import { Context } from './generator.js';
import {
    asApexClass,
    asApexTrigger,
    symbtablesnap__Apex_Class__c,
    symbtablesnap__Apex_Trigger__c,
    symbtablesnap__Property__c
} from '../../types/symbtalesnap.js';
import { hashCode } from '../../utils/hashUtils.js';
import { SymbolTable } from '../../types/tooling.js';
import { newProperty } from '../factory/sObjectFactory.js';

export class PropertyGenerator {
    context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    async generate(item: symbtablesnap__Apex_Class__c | symbtablesnap__Apex_Trigger__c, symbolTable: SymbolTable) {
        if (symbolTable == null) {
            return;
        }
        const context = this.context;
        const apexClass = asApexClass(item);
        const apexTrigger = asApexTrigger(item);
        const entityId = apexClass ? apexClass.symbtablesnap__Class_ID__c! : apexTrigger?.symbtablesnap__Trigger_ID__c!;
        const entityName = apexClass ? apexClass.symbtablesnap__Class_Name__c! : apexTrigger?.symbtablesnap__Trigger_Name__c!;
        if (symbolTable.properties != null) {
            for (let symbolProperty of symbolTable.properties) {
                const property: symbtablesnap__Property__c = newProperty({
                    Name: entityName + ' having ' + symbolProperty.name + ' (' + symbolProperty.type + ')',
                    symbtablesnap__Location_Line__c: symbolProperty.location.line,
                    symbtablesnap__Location_Column__c: symbolProperty.location.column
                });
                property.Name = property.Name!.substring(0, 80);
                property.symbtablesnap__Snapshot_Key__c =
                    context.snapshot.Id + ':Property:' + getHashCode(entityId!, entityName!, property);
                context.registerRelationship(property, 'symbtablesnap__Snapshot__c', context.snapshot);
                if (apexClass != null) {
                    context.registerRelationship(property, 'symbtablesnap__Class__c', apexClass);
                } else if (apexTrigger != null) {
                    context.registerRelationship(property, 'symbtablesnap__Trigger__c', apexTrigger);
                }
                context.registerUpsert(property);
            }
        }
    }
}

function getHashCode(entityId: string, entityName: string, property: symbtablesnap__Property__c): number {
    let hash = 7;
    hash = 31 * hash + hashCode(entityId);
    hash = 31 * hash + hashCode(entityName);
    hash = 31 * hash + hashCode(property.Name);
    hash = 31 * hash + hashCode(property.symbtablesnap__Location_Line__c);
    hash = 31 * hash + hashCode(property.symbtablesnap__Location_Column__c);
    return hash;
}
