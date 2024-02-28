import { Context } from './generator.js';
import { symbtablesnap__Apex_Class__c } from '../../types/symbtalesnap.js';
import { SymbolTable } from '../../types/tooling.js';
import { hashCode } from '../../utils/hashUtils.js';
import { newApexClass } from '../factory/sObjectFactory.js';
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
            const apexClass = newApexClass({
                Name: parent.symbtablesnap__Full_Name__c + '.' + symbolTable.name,
                symbtablesnap__Class_ID__c: parent.symbtablesnap__Class_ID__c,
                symbtablesnap__Class_Name__c: symbolTable.name,
                symbtablesnap__Extends_Full_Name__c: symbolTable.parentClass,
                symbtablesnap__Symbol_Table_Available__c: true,
                symbtablesnap__Is_Test__c: hasTestMethodModifier(modifiers),
                symbtablesnap__Modifiers__c: modifiers == null ? null : modifiers.join(';'),
                symbtablesnap__Access_Modifier__c: getAccessModifier(modifiers),
                symbtablesnap__Namespace_Prefix__c: symbolTable.namespace,
                symbtablesnap__Top_Level_Full_Name__c: parent.symbtablesnap__Full_Name__c,
                symbtablesnap__Is_Top_Level_Class__c: false,
                symbtablesnap__Number_of_Methods__c: symbolTable.methods?.length || 0,
                symbtablesnap__Is_Referenced_Score__c: 0
            });
            apexClass.Name = apexClass.Name!.substring(0, 80);
            apexClass.symbtablesnap__Full_Name__c = apexClass.Name;
            apexClass.symbtablesnap__Snapshot_Key__c = context.snapshot.Id + ':InnerClass:' + getHashCode(apexClass);
            context.registerRelationship(apexClass, 'symbtablesnap__Snapshot__c', context.snapshot);
            context.registerUpsert(apexClass);
            await context.interfaceImplGenerator.generate(apexClass);
            await context.methodGenerator.generate(apexClass, symbolTable);
            await context.propertyGenerator.generate(apexClass, symbolTable);
            await context.methodReferenceGenerator.generate(apexClass, symbolTable);
        }
    }
}

function getHashCode(apexClass: symbtablesnap__Apex_Class__c): number {
    let hash = 7;
    hash = 31 * hash + hashCode(apexClass.symbtablesnap__Class_ID__c);
    hash = 31 * hash + hashCode(apexClass.symbtablesnap__Class_Name__c);
    return hash;
}
