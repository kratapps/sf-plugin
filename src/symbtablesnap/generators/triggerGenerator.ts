import { Context } from './generator.js';
import { ApexTriggerMember } from '../../types/tooling.js';

export class TriggerGenerator {
    context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    generate(members: ApexTriggerMember[]) {
        // for (let member of members) {
        // }
    }
}
