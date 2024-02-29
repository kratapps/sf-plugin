import { SnapshotData } from '../data/snapshotData.js';
import { Graph } from './graph.js';

export function buildGraph(snapshot: SnapshotData): Graph {
    const graph = new Graph();
    for (let apexTrigger of snapshot.apexTriggers) {
        graph.addNode(apexTrigger);
    }
    for (let apexClass of snapshot.apexClasses) {
        graph.addNode(apexClass);
    }
    for (let method of snapshot.methods) {
        graph.addNode(method);
    }
    for (let reference of snapshot.methodReferences) {
        if (reference.symbtablesnap__Referenced_Method__r != null) {
            if (reference.symbtablesnap__Used_By_Method__r != null) {
                graph.addRelationship(reference.symbtablesnap__Used_By_Method__r, reference.symbtablesnap__Referenced_Method__r);
            }
            if (reference.symbtablesnap__Used_By_Class__r != null) {
                graph.addRelationship(reference.symbtablesnap__Used_By_Class__r, reference.symbtablesnap__Referenced_Method__r);
            }
            if (reference.symbtablesnap__Used_By_Trigger__r != null) {
                graph.addRelationship(reference.symbtablesnap__Used_By_Trigger__r, reference.symbtablesnap__Referenced_Method__r);
            }
        }
        if (reference.symbtablesnap__Referenced_Method__r?.symbtablesnap__Class__r != null) {
            if (reference.symbtablesnap__Used_By_Method__r != null) {
                graph.addRelationship(
                    reference.symbtablesnap__Used_By_Method__r,
                    reference.symbtablesnap__Referenced_Method__r.symbtablesnap__Class__r
                );
            }
            if (reference.symbtablesnap__Used_By_Class__r != null) {
                graph.addRelationship(
                    reference.symbtablesnap__Used_By_Class__r,
                    reference.symbtablesnap__Referenced_Method__r.symbtablesnap__Class__r
                );
            }
            if (reference.symbtablesnap__Used_By_Trigger__r != null) {
                graph.addRelationship(
                    reference.symbtablesnap__Used_By_Trigger__r,
                    reference.symbtablesnap__Referenced_Method__r.symbtablesnap__Class__r
                );
            }
        }
    }
    for (let implementation of snapshot.interfaceImplementations) {
        if (implementation.symbtablesnap__Implements_Interface__r != null) {
            graph.addRelationship(
                implementation.symbtablesnap__Implementation_Class__r!,
                implementation.symbtablesnap__Implements_Interface__r
            );
        }
    }
    return graph;
}
