import { Context } from './generator.js';
import { symbtablesnap__Apex_Class__c, symbtablesnap__Method__c } from '../../types/symbtalesnap.js';
import { Annotation, Parameter, Position, SymbolTable } from '../../types/tooling.js';
import { hashCode } from '../../utils/hashUtils.js';
import { getAccessModifier, hasTestMethodModifier } from '../../utils/generatorUtils.js';

export class MethodGenerator {
    context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    async generate(apexClass: symbtablesnap__Apex_Class__c, symbolTable: SymbolTable) {
        if (symbolTable == null) {
            return;
        }
        const methodsByNames: Record<string, symbtablesnap__Method__c> = {};
        if (symbolTable.constructors != null) {
            for (let symbolMethod of symbolTable.constructors) {
                await this.generate2(
                    methodsByNames,
                    apexClass,
                    symbolMethod.name,
                    symbolMethod.parameters,
                    null,
                    symbolMethod.modifiers,
                    symbolMethod.annotations,
                    symbolMethod.location,
                    symbolMethod.references
                );
            }
        }
        if (symbolTable.methods != null) {
            for (let symbolMethod of symbolTable.methods) {
                await this.generate2(
                    methodsByNames,
                    apexClass,
                    symbolMethod.name,
                    symbolMethod.parameters,
                    symbolMethod.returnType,
                    symbolMethod.modifiers,
                    symbolMethod.annotations,
                    symbolMethod.location,
                    symbolMethod.references
                );
            }
        }
    }

    async generate2(
        methodsByNames: Record<string, symbtablesnap__Method__c>,
        apexClass: symbtablesnap__Apex_Class__c,
        name: string,
        parameters: Parameter[],
        returnType: string | null,
        modifiers: string[],
        annotations: Annotation[],
        location: Position,
        references: Position[]
    ) {
        const context = this.context;
        const methodName = name;
        const isConstructor = returnType == null;
        const paramTypes: string[] = parameters.map((it) => it.type);
        const params: string[] = parameters.map((it) => it.type + ' ' + it.name);
        const hash = hashCode([
            apexClass.symbtablesnap__Class_ID__c,
            apexClass.symbtablesnap__Class_Name__c,
            methodName,
            returnType,
            ...paramTypes,
            `${location.line}-${location.column}`
        ]);
        const method: symbtablesnap__Method__c = {
            attributes: {
                type: 'symbtablesnap__Method__c'
            },
            Name: methodName + '(' + params.join(', ') + ')',
            symbtablesnap__Snapshot_Key__c: context.snapshot.Id + ':' + (isConstructor ? 'Constructor' : 'Method') + ':' + hash,
            symbtablesnap__Method_Name__c: methodName,
            symbtablesnap__Is_Constructor__c: isConstructor,
            symbtablesnap__Is_Overloaded__c: false,
            symbtablesnap__Is_Test__c: hasTestMethodModifier(modifiers),
            symbtablesnap__Is_Referenced__c: false,
            symbtablesnap__Access_Modifier__c: getAccessModifier(modifiers),
            symbtablesnap__Modifiers__c: modifiers == null ? null : modifiers.join(';'),
            symbtablesnap__Return_Type__c: isConstructor ? apexClass.symbtablesnap__Class_Name__c : returnType,
            symbtablesnap__Is_Referenced_Score__c: 0,
            symbtablesnap__Location_Line__c: location.line,
            symbtablesnap__Location_Column__c: location.column,
            symbtablesnap__Number_of_Parameters__c: parameters.length || 0,
            symbtablesnap__Signature__c: methodName + '(' + paramTypes.join(', ') + ')'
        };
        if (!isConstructor) {
            method.Name += ': ' + method.symbtablesnap__Return_Type__c;
            method.symbtablesnap__Signature__c += ': ' + method.symbtablesnap__Return_Type__c;
        }
        if (methodsByNames.hasOwnProperty(methodName)) {
            methodsByNames[methodName].symbtablesnap__Is_Overloaded__c = true;
            method.symbtablesnap__Is_Overloaded__c = true;
        } else {
            methodsByNames[methodName] = method;
        }
        context.registerRelationship(method, 'symbtablesnap__Snapshot__c', context.snapshot);
        context.registerRelationship(method, 'symbtablesnap__Class__c', apexClass);
        context.registerUpsert(method);
        await context.methodDeclarationGenerator.generate(method, modifiers, annotations);
        for (let reference of references) {
            await context.methodLocalReferenceGenerator.generate(method, apexClass, reference);
        }
    }
}
