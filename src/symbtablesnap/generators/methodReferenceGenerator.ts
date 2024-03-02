import { Context } from './generator.js';
import {
    isApexClass,
    isApexTrigger,
    symbtablesnap__Apex_Class__c,
    symbtablesnap__Apex_Trigger__c,
    symbtablesnap__Method_Reference__c
} from '../../types/symbtalesnap.js';
import { SymbolTable } from '../../types/tooling.js';
import { hashCode } from '../../utils/hashUtils.js';

export class MethodReferenceGenerator {
    context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    async generate(item: symbtablesnap__Apex_Class__c | symbtablesnap__Apex_Trigger__c, symbolTable: SymbolTable) {
        if (symbolTable == null) {
            return;
        }
        if (symbolTable.externalReferences == null) {
            return;
        }
        const context = this.context;
        const entityName = isApexClass(item) ? item.symbtablesnap__Class_Name__c! : item.symbtablesnap__Trigger_Name__c!;
        const entityId = isApexClass(item) ? item.symbtablesnap__Class_Name__c! : item.symbtablesnap__Trigger_Name__c!;
        for (let symbolRef of symbolTable.externalReferences) {
            for (let symbolMethod of symbolRef.methods) {
                for (let location of symbolMethod.references) {
                    const hash = hashCode([
                        entityId,
                        entityName,
                        symbolRef.name,
                        symbolRef.namespace,
                        symbolMethod.name,
                        `${location.line}-${location.column}`
                    ]);
                    const methodRef: symbtablesnap__Method_Reference__c = {
                        attributes: {
                            type: 'symbtablesnap__Method_Reference__c',
                            url: ''
                        },
                        symbtablesnap__Snapshot_Key__c: context.snapshot.Id + ':MethodRef:' + hash,
                        Name: entityName + ' => ' + symbolRef.name + '.' + symbolMethod.name,
                        symbtablesnap__Referenced_Class_Name__c: symbolRef.name,
                        symbtablesnap__Referenced_Namespace__c: symbolRef.namespace,
                        symbtablesnap__Referenced_Method_Name__c: symbolMethod.name,
                        symbtablesnap__Reference_Line__c: location.line,
                        symbtablesnap__Reference_Column__c: location.column,
                        symbtablesnap__Is_External__c: true
                    };
                    context.registerRelationship(methodRef, 'symbtablesnap__Snapshot__c', context.snapshot);
                    if (isApexClass(item)) {
                        context.registerRelationship(methodRef, 'symbtablesnap__Used_By_Class__c', item);
                    } else if (isApexTrigger(item)) {
                        context.registerRelationship(methodRef, 'symbtablesnap__Used_By_Trigger__c', item);
                    }
                    context.registerUpsert(methodRef);
                }
            }
            // for (let symbolVariable of symbolRef.variables) {
            //     todo
            // }
        }
    }
}
