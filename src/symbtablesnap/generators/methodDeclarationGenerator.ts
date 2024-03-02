import { Context } from './generator.js';
import { symbtablesnap__Declaration__c, symbtablesnap__Method__c, symbtablesnap__Method_Declaration__c } from '../../types/symbtalesnap.js';
import { Annotation } from '../../types/tooling.js';
import { hashCode } from '../../utils/hashUtils.js';

export class MethodDeclarationGenerator {
    context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    async generate(method: symbtablesnap__Method__c, modifiers: string[], annotations: Annotation[]) {
        if (modifiers != null) {
            for (let modifier of modifiers) {
                await this.generate2(method, 'Modifier', modifier);
            }
        }
        if (annotations != null) {
            for (let annotation of annotations) {
                await this.generate2(method, 'Annotation', annotation.name);
            }
        }
    }

    async generate2(method: symbtablesnap__Method__c, type: string, name: string) {
        const context = this.context;
        const declarationHash = hashCode([name, type]);
        let declaration: symbtablesnap__Declaration__c = {
            attributes: {
                type: 'symbtablesnap__Declaration__c',
                url: ''
            },
            Name: name,
            symbtablesnap__Snapshot_Key__c: context.snapshot.Id + ':' + type + ':' + declarationHash,
            symbtablesnap__Type__c: type
        };
        context.registerRelationship(declaration, 'symbtablesnap__Snapshot__c', context.snapshot);
        declaration = context.registerUpsert(declaration);
        const methodDeclarationHash = hashCode([method.symbtablesnap__Snapshot_Key__c, declaration.symbtablesnap__Snapshot_Key__c]);
        const methodDeclaration: symbtablesnap__Method_Declaration__c = {
            attributes: {
                type: 'symbtablesnap__Method_Declaration__c',
                url: ''
            },
            Name: (type == 'Annotation' ? '@' : '') + declaration.Name + ' ' + method.Name,
            symbtablesnap__Snapshot_Key__c: context.snapshot.Id + ':Declaration:' + methodDeclarationHash,
            symbtablesnap__Type__c: declaration.symbtablesnap__Type__c
        };
        context.registerRelationship(methodDeclaration, 'symbtablesnap__Snapshot__c', context.snapshot);
        context.registerRelationship(methodDeclaration, 'symbtablesnap__Method__c', method);
        context.registerRelationship(methodDeclaration, 'symbtablesnap__Declaration__c', declaration);
        context.registerUpsert(methodDeclaration);
    }
}
