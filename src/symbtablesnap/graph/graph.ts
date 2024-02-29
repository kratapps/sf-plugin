import {
    SnapshotRecord,
    symbtablesnap__Apex_Class__c,
    symbtablesnap__Apex_Trigger__c,
    symbtablesnap__Method__c
} from '../../types/symbtalesnap.js';
import { hashCode } from '../../utils/hashUtils.js';

const IS_REFERENCED_SCORE_FIELD = 'symbtablesnap__Is_Referenced_Score__c';
const SUPPORTED_TYPES = ['symbtablesnap__Apex_Class__c', 'symbtablesnap__Apex_Trigger__c', 'symbtablesnap__Method__c'];
type NodeSupportedType = symbtablesnap__Apex_Class__c | symbtablesnap__Apex_Trigger__c | symbtablesnap__Method__c;

export class Node {
    private toNodes: Node[] = [];
    private toNodesKeys: Set<string> = new Set<string>();
    private readonly record: NodeSupportedType;

    constructor(record: NodeSupportedType) {
        this.record = record;
    }

    public getKey(): string {
        return this.record.symbtablesnap__Snapshot_Key__c!;
    }

    public addChild(node: Node) {
        if (!this.toNodesKeys.has(node.getKey())) {
            this.toNodes.push(node);
            this.toNodesKeys.add(node.getKey());
        }
    }

    public setScore(score: number) {
        this.record[IS_REFERENCED_SCORE_FIELD] = score > 100 ? 100 : score;
    }

    public addToScore(scoreToAdd: number, scoreToPropagate: number, keysProcessed: Set<string> = new Set<string>()) {
        if (keysProcessed.has(this.record.symbtablesnap__Snapshot_Key__c!)) {
            return;
        }
        keysProcessed.add(this.record.symbtablesnap__Snapshot_Key__c!);
        let score = this.record[IS_REFERENCED_SCORE_FIELD] as number;
        score = score ? score : 0;
        this.setScore(score + scoreToAdd);
        if (scoreToPropagate != null && scoreToPropagate != 0) {
            for (let child of this.toNodes) {
                child.addToScore(scoreToPropagate, scoreToPropagate, keysProcessed);
            }
        }
    }

    public getRecord(): SnapshotRecord {
        return this.record;
    }

    public equals(object: unknown) {
        if (object == null || !(object instanceof Node)) {
            return false;
        }
        return this.getKey() == (object as Node).getKey();
    }

    public hashCode(): number {
        return hashCode(this.getKey());
    }
}

export class Graph {
    private nodesByKeys: Record<string, Node> = {};

    public addRelationship(fromEntity: NodeSupportedType, toEntity: NodeSupportedType) {
        const fromNode = this.getNode(fromEntity);
        const toNode = this.getNode(toEntity);
        fromNode.addChild(toNode);
    }

    public addNode(record: NodeSupportedType) {
        this.getNode(record);
    }

    public getNode(record: NodeSupportedType) {
        if (!this.isSupportedRecord(record)) {
            throw Error('Unsupported type: ' + record.attributes.type);
        }
        let key = record.symbtablesnap__Snapshot_Key__c!;
        if (!this.nodesByKeys.hasOwnProperty(key)) {
            this.nodesByKeys[key] = new Node(record);
        }
        return this.nodesByKeys[key];
    }

    public getNodeByKey(key: string): Node {
        return this.nodesByKeys[key];
    }

    public isSupportedRecord(record: SnapshotRecord): boolean {
        return SUPPORTED_TYPES.includes(record.attributes.type);
    }
}
