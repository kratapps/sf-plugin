import { Context } from './generator.js';
import { ApexClassMember } from '../../types/tooling.js';
import { newApexClass } from '../factory/sObjectFactory.js';
import { getAccessModifier, hasTestMethodModifier } from '../../utils/generatorUtils.js';
import { symbtablesnap__Apex_Class__c } from '../../types/symbtalesnap.js';
import { hashCode } from '../../utils/hashUtils.js';

export class ApexClassGenerator {
    context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    async generate(members: ApexClassMember[]) {
        const context = this.context;
        for (let member of members) {
            const symbolTable = member.SymbolTable;
            const hasSymbolTable = Boolean(symbolTable);
            const modifiers = symbolTable?.tableDeclaration?.modifiers || [];
            const apexClass = newApexClass({
                Name: hasSymbolTable ? (symbolTable.namespace ? symbolTable.namespace + '.' : '') + symbolTable.name : member.FullName,
                symbtablesnap__Class_ID__c: member.ContentEntityId,
                symbtablesnap__Class_Name__c: symbolTable?.name || '',
                symbtablesnap__Extends_Full_Name__c: symbolTable?.parentClass || '',
                symbtablesnap__Implements__c: symbolTable?.interfaces == null ? '' : symbolTable.interfaces.join(';'),
                symbtablesnap__Symbol_Table_Available__c: hasSymbolTable,
                symbtablesnap__Is_Test__c: hasTestMethodModifier(modifiers),
                symbtablesnap__Modifiers__c: modifiers ? modifiers.join(';') : '',
                symbtablesnap__Access_Modifier__c: getAccessModifier(modifiers) || '',
                symbtablesnap__Namespace_Prefix__c: symbolTable.namespace,
                symbtablesnap__Top_Level_Full_Name__c: '',
                symbtablesnap__Is_Top_Level_Class__c: true,
                symbtablesnap__Number_of_Methods__c: symbolTable.methods?.length || 0,
                symbtablesnap__Is_Apex_Job_Enqueued__c: context.enqueuedApexClassIds.has(member.ContentEntityId),
                symbtablesnap__Is_Referenced_Score__c: 0
            });
            apexClass.symbtablesnap__Full_Name__c = apexClass.Name!;
            apexClass.Name = apexClass.Name!.substring(0, 80);
            apexClass.symbtablesnap__Snapshot_Key__c = context.snapshot.Id + ':ApexClass:' + getHashCode(apexClass);
            context.registerRelationship(apexClass, 'symbtablesnap__Snapshot__c', context.snapshot);
            context.registerUpsert(apexClass);
            if (!symbolTable) {
                return;
            }
            await context.innerClassGenerator.generate(apexClass, symbolTable);
            await context.interfaceImplGenerator.generate(apexClass);
            await context.methodGenerator.generate(apexClass, symbolTable);
            await context.propertyGenerator.generate(apexClass, symbolTable);
            await context.methodReferenceGenerator.generate(apexClass, symbolTable);
        }
        await context.commit();
    }
}

function getHashCode(apexClass: symbtablesnap__Apex_Class__c): number {
    let hash = 7;
    hash = 31 * hash + hashCode(apexClass.symbtablesnap__Class_ID__c);
    return hash;
}
