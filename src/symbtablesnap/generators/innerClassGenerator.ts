import { Context } from './generator.js';
import { symbtablesnap__Apex_Class__c } from '../../types/symbtalesnap.js';
import { SymbolTable } from '../../types/tooling.js';
import { hashCode } from '../../utils/hashUtils.js';
import { getAccessModifier, hasTestMethodModifier } from '../../utils/generatorUtils.js';

export class InnerClassGenerator {
    context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    async generate(parent: symbtablesnap__Apex_Class__c, symbolTableParent: SymbolTable) {
        if (symbolTableParent.innerClasses == null) {
            return;
        }
        for (let symbolTable of symbolTableParent.innerClasses) {
            if (symbolTable == null) {
                continue;
            }
            const context = this.context;
            const modifiers = symbolTable?.tableDeclaration?.modifiers;
            const hash = hashCode([parent.symbtablesnap__Class_ID__c, symbolTable.name, parent.symbtablesnap__Full_Name__c]);
            const apexClass: symbtablesnap__Apex_Class__c = {
                attributes: {
                    type: 'symbtablesnap__Apex_Class__c'
                },
                Name: parent.symbtablesnap__Full_Name__c + '.' + symbolTable.name,
                symbtablesnap__Snapshot_Key__c: context.snapshot.Id + ':InnerClass:' + hash,
                symbtablesnap__Full_Name__c: parent.symbtablesnap__Full_Name__c + '.' + symbolTable.name,
                symbtablesnap__Class_ID__c: parent.symbtablesnap__Class_ID__c,
                symbtablesnap__Class_Name__c: symbolTable.name,
                symbtablesnap__Extends_Full_Name__c: symbolTable.parentClass,
                symbtablesnap__Implements__c: symbolTable?.interfaces == null ? null : symbolTable.interfaces.join(';'),
                symbtablesnap__Symbol_Table_Available__c: true,
                symbtablesnap__Is_Test__c: hasTestMethodModifier(modifiers),
                symbtablesnap__Modifiers__c: modifiers ? modifiers.join(';') : '',
                symbtablesnap__Access_Modifier__c: getAccessModifier(modifiers),
                symbtablesnap__Namespace_Prefix__c: symbolTable.namespace,
                symbtablesnap__Top_Level_Full_Name__c: parent.symbtablesnap__Full_Name__c,
                symbtablesnap__Is_Top_Level_Class__c: false,
                symbtablesnap__Number_of_Methods__c: symbolTable.methods?.length || 0,
                symbtablesnap__Is_Referenced_Score__c: 0,
                symbtablesnap__Is_Apex_Job_Enqueued__c: false
            };
            context.registerRelationship(apexClass, 'symbtablesnap__Top_Level_Class__c', parent);
            context.registerRelationship(apexClass, 'symbtablesnap__Snapshot__c', context.snapshot);
            context.registerUpsert(apexClass);
            await context.interfaceImplGenerator.generate(apexClass);
            await context.methodGenerator.generate(apexClass, symbolTable);
            await context.propertyGenerator.generate(apexClass, symbolTable);
            await context.methodReferenceGenerator.generate(apexClass, symbolTable);
        }
    }
}
