import { Context } from './generator.js';
import { symbtablesnap__Apex_Class__c, symbtablesnap__Interface_Implementation__c } from '../../types/symbtalesnap.js';
import { hashCode } from '../../utils/hashUtils.js';

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
            const hash = hashCode([apexClass.symbtablesnap__Class_ID__c, apexClass.symbtablesnap__Class_Name__c, interfaceName]);
            const impl: symbtablesnap__Interface_Implementation__c = {
                attributes: {
                    type: 'symbtablesnap__Interface_Implementation__c'
                },
                Name: apexClass.symbtablesnap__Class_Name__c + ' implements ' + interfaceName,
                symbtablesnap__Snapshot_Key__c: context.snapshot.Id + ':InterfaceImpl:' + hash,
                symbtablesnap__Implements__c: interfaceName
            };
            context.registerUpsert(impl);
            context.registerRelationship(impl, 'symbtablesnap__Snapshot__c', context.snapshot);
            context.registerRelationship(impl, 'symbtablesnap__Implementation_Class__c', apexClass);
        }
    }
}
