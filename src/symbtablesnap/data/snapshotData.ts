import {
    isMethod,
    isProperty,
    SnapshotSObjectType,
    symbtablesnap__Apex_Class__c,
    symbtablesnap__Apex_Trigger__c,
    symbtablesnap__Interface_Implementation__c,
    symbtablesnap__Method__c,
    symbtablesnap__Method_Reference__c,
    symbtablesnap__Property__c
} from '../../types/symbtalesnap.js';
import { hashCode } from '../../utils/hashUtils.js';

export class SnapshotData {
    apexClasses: symbtablesnap__Apex_Class__c[] = [];
    apexTriggers: symbtablesnap__Apex_Trigger__c[] = [];
    methods: symbtablesnap__Method__c[] = [];
    properties: symbtablesnap__Property__c[] = [];
    interfaceImplementations: symbtablesnap__Interface_Implementation__c[] = [];
    methodReferences: symbtablesnap__Method_Reference__c[] = [];

    getClassItemsByEntityIds(): Record<string, ClassItem[]> {
        const methodsByIds: Record<string, ClassItem[]> = {};
        for (let method of this.methods) {
            const entityId = method.symbtablesnap__Class__r!.symbtablesnap__Class_ID__c!;
            if (!methodsByIds.hasOwnProperty(entityId)) {
                methodsByIds[entityId] = [];
            }
            methodsByIds[entityId].push(new ClassItem(method));
        }
        for (let property of this.properties) {
            const entityId = property.symbtablesnap__Class__c
                ? property.symbtablesnap__Class__r!.symbtablesnap__Class_ID__c!
                : property.symbtablesnap__Trigger__r!.symbtablesnap__Trigger_ID__c!;
            if (!methodsByIds.hasOwnProperty(entityId)) {
                methodsByIds[entityId] = [];
            }
            methodsByIds[entityId].push(new ClassItem(property));
        }
        return methodsByIds;
    }
}

export class ClassItem {
    item: symbtablesnap__Method__c | symbtablesnap__Property__c;

    constructor(item: symbtablesnap__Method__c | symbtablesnap__Property__c) {
        this.item = item;
    }

    public isMethod() {
        return isMethod(this.item);
    }

    public getMethod(): symbtablesnap__Method__c {
        if (isMethod(this.item)) {
            return this.item;
        }
        throw Error('Not a method.');
    }

    public getProperty(): symbtablesnap__Property__c {
        if (isProperty(this.item)) {
            return this.item;
        }
        throw Error('Not a property.');
    }

    public getType(): SnapshotSObjectType {
        return this.isMethod() ? 'symbtablesnap__Method__c' : 'symbtablesnap__Property__c';
    }

    public getLine(): number {
        const line = this.isMethod()
            ? this.getMethod().symbtablesnap__Location_Line__c
            : this.getProperty().symbtablesnap__Location_Line__c;
        return Math.round(line!);
    }

    public getColumn(): number {
        const col = this.isMethod()
            ? this.getMethod().symbtablesnap__Location_Column__c
            : this.getProperty().symbtablesnap__Location_Column__c;
        return Math.round(col!);
    }

    equals(object: unknown): boolean {
        if (object == null || !(object instanceof ClassItem)) {
            return false;
        }
        const other = object as ClassItem;
        if (this.getType() != other.getType()) {
            return false;
        }
        if (this.isMethod()) {
            return this.getMethod().symbtablesnap__Snapshot_Key__c == other.getMethod().symbtablesnap__Snapshot_Key__c;
        }
        return this.getProperty().symbtablesnap__Snapshot_Key__c == other.getProperty().symbtablesnap__Snapshot_Key__c;
    }

    hashCode(): number {
        let hash = 7;
        if (this.isMethod()) {
            hash = 31 * hash + hashCode(this.getMethod().symbtablesnap__Snapshot_Key__c);
        } else {
            hash = 31 * hash + hashCode(this.getProperty().symbtablesnap__Snapshot_Key__c);
        }
        return hash;
    }
}

export function classItemSorter(a: ClassItem, b: ClassItem): number {
    if (a.getLine() != b.getLine()) {
        return a.getLine() - b.getLine();
    }
    return a.getColumn() - b.getColumn();
}
