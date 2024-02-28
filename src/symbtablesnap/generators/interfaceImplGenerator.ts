import { Context } from './generator.js';
import { symbtablesnap__Apex_Class__c, symbtablesnap__Interface_Implementation__c } from '../../types/symbtalesnap.js';
import { hashCode } from '../../utils/hashUtils.js';
import { newInterfaceImpl } from '../factory/sObjectFactory.js';

export class InterfaceImplGenerator {
    context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    async generate(apexClass: symbtablesnap__Apex_Class__c) {
        if (!apexClass.symbtablesnap__Implements__c) {
            return;
        }
        const context = this.context;
        const interfaces = apexClass.symbtablesnap__Implements__c.split(';');
        for (let interfaceName of interfaces) {
            const impl = newInterfaceImpl({
                Name: apexClass.symbtablesnap__Class_Name__c + ' implements ' + interfaceName,
                symbtablesnap__Implements__c: interfaceName
            });
            impl.Name = impl.Name!.substring(0, 80);
            impl.symbtablesnap__Snapshot_Key__c = context.snapshot.Id + ':InterfaceImpl:' + getHashCode(apexClass, impl);
            context.registerUpsert(impl);
            context.registerRelationship(impl, 'symbtablesnap__Snapshot__c', context.snapshot);
            context.registerRelationship(impl, 'symbtablesnap__Implementation_Class__c', apexClass);
        }
    }
}

function getHashCode(apexClass: symbtablesnap__Apex_Class__c, impl: symbtablesnap__Interface_Implementation__c): number {
    let hash = 7;
    hash = 31 * hash + hashCode(apexClass.symbtablesnap__Class_ID__c);
    hash = 31 * hash + hashCode(apexClass.symbtablesnap__Class_Name__c);
    hash = 31 * hash + hashCode(impl.symbtablesnap__Implements__c);
    return hash;
}
