import { Context } from './generator.js';
import { symbtablesnap__Declaration__c, symbtablesnap__Method__c } from '../../types/symbtalesnap.js';
import { Annotation } from '../../types/tooling.js';
import { hashCode } from '../../utils/hashUtils.js';
import { newDeclaration, newMethodDeclaration } from '../factory/sObjectFactory.js';

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
        let declaration = newDeclaration({
            Name: name,
            symbtablesnap__Type__c: type
        });
        declaration.symbtablesnap__Snapshot_Key__c = context.snapshot.Id + ':' + type + ':' + getDeclarationHashCode(declaration);
        context.registerRelationship(declaration, 'symbtablesnap__Snapshot__c', context.snapshot);
        declaration = context.registerUpsert(declaration);
        const methodDeclaration = newMethodDeclaration({
            Name: (type == 'Annotation' ? '@' : '') + declaration.Name + ' ' + method.Name,
            symbtablesnap__Type__c: declaration.symbtablesnap__Type__c
        });
        methodDeclaration.Name = methodDeclaration.Name!.substring(0, 80);
        methodDeclaration.symbtablesnap__Snapshot_Key__c = context.snapshot.Id + ':Declaration:' + getHashCode(method, declaration);
        context.registerRelationship(methodDeclaration, 'symbtablesnap__Snapshot__c', context.snapshot);
        context.registerRelationship(methodDeclaration, 'symbtablesnap__Method__c', method);
        context.registerRelationship(methodDeclaration, 'symbtablesnap__Declaration__c', declaration);
        context.registerUpsert(methodDeclaration);
    }
}

function getDeclarationHashCode(declaration: symbtablesnap__Declaration__c): number {
    let hash = 7;
    hash = 31 * hash + hashCode(declaration.Name);
    hash = 31 * hash + hashCode(declaration.symbtablesnap__Type__c);
    return hash;
}

function getHashCode(method: symbtablesnap__Method__c, declaration: symbtablesnap__Declaration__c): number {
    let hash = 7;
    hash = 31 * hash + hashCode(method.symbtablesnap__Snapshot_Key__c);
    hash = 31 * hash + hashCode(declaration.symbtablesnap__Snapshot_Key__c);
    return hash;
}
