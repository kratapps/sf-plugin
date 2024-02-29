import { Context } from './generator.js';
import { symbtablesnap__Apex_Class__c, symbtablesnap__Method__c, symbtablesnap__Method_Reference__c } from '../../types/symbtalesnap.js';
import { Position } from '../../types/tooling.js';
import { newMethodReference } from '../factory/sObjectFactory.js';
import { hashCode } from '../../utils/hashUtils.js';

export class MethodLocalReferenceGenerator {
    context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    async generate(method: symbtablesnap__Method__c, apexClass: symbtablesnap__Apex_Class__c, location: Position) {
        const context = this.context;
        const methodRef = newMethodReference({
            symbtablesnap__Snapshot__c: context.snapshot.Id,
            Name: method.Name + ' => [' + location.line + ',' + location.column + ']',
            symbtablesnap__Referenced_Class_Name__c: apexClass.symbtablesnap__Class_Name__c,
            symbtablesnap__Referenced_Namespace__c: apexClass.symbtablesnap__Namespace_Prefix__c,
            symbtablesnap__Referenced_Method_Name__c: method.symbtablesnap__Method_Name__c,
            symbtablesnap__Reference_Line__c: location.line,
            symbtablesnap__Reference_Column__c: location.column
        });
        methodRef.Name = methodRef.Name!.substring(0, 80);
        methodRef.symbtablesnap__Snapshot_Key__c =
            context.snapshot.Id +
            ':LocalMethodRef:' +
            getHashCode(apexClass.symbtablesnap__Class_ID__c!, apexClass.symbtablesnap__Class_Name__c!, methodRef);
        context.registerRelationship(methodRef, 'symbtablesnap__Used_By_Class__c', apexClass);
        context.registerUpsert(methodRef);
    }
}

function getHashCode(entityId: string, entityName: string, methodRef: symbtablesnap__Method_Reference__c): number {
    let hash = 7;
    hash = 31 * hash + hashCode(entityId);
    hash = 31 * hash + hashCode(entityName);
    hash = 31 * hash + hashCode(methodRef.symbtablesnap__Referenced_Class_Name__c);
    hash = 31 * hash + hashCode(methodRef.symbtablesnap__Referenced_Namespace__c);
    hash = 31 * hash + hashCode(methodRef.symbtablesnap__Reference_Line__c);
    hash = 31 * hash + hashCode(methodRef.symbtablesnap__Reference_Column__c);
    return hash;
}
