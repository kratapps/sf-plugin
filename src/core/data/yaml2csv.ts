import { readYaml, walkFiles, writeCsv } from '../../utils/file.js';

interface Options {
    csvFile: string;
    yamlDir: string;
}

function getHeaderValuePairs(record: any): [string[], string[]] {
    const header: string[] = [];
    const values: string[] = [];
    for (let field of Object.keys(record)) {
        let value = record[field];
        header.push(field);
        values.push(`${value}`);
    }
    return [header, values];
}

export async function yaml2csv({ csvFile, yamlDir }: Options) {
    const header = [];
    const rows = [];
    for await (const recordFile of await walkFiles(yamlDir)) {
        if (recordFile.name.startsWith('.')) {
            continue;
        }
        const record = await readYaml(recordFile.path);
        const [recordHeader, recordValues] = getHeaderValuePairs(record);
        if (rows.length === 0) {
            header.push(...recordHeader);
            rows.push(header);
        }
        rows.push(recordValues);
    }
    await writeCsv(csvFile, rows);
}
