import { Connection } from '@salesforce/core/lib/org/connection.js';

export type QueryAllBatch<T> = {
    records: T[];
    currentSize: number;
    totalSize: number;
};

export type QueryAllCallback<T> = (result: QueryAllBatch<T>) => Promise<void>;

export async function queryAll<T>(conn: Connection, query: string, callback: QueryAllCallback<T>): Promise<void> {
    let len = 0;
    let queryResult = await conn.query(query);
    len += queryResult.records.length;
    await callback({
        records: queryResult.records as T[],
        currentSize: len,
        totalSize: queryResult.totalSize
    });
    while (!queryResult.done && queryResult.nextRecordsUrl) {
        queryResult = await conn.queryMore(queryResult.nextRecordsUrl);
        len += queryResult.records.length;
        await callback({
            records: queryResult.records as T[],
            currentSize: len,
            totalSize: queryResult.totalSize
        });
    }
}

export async function queryAllTooling<T>(conn: Connection, query: string, callback: QueryAllCallback<T>): Promise<void> {
    let len = 0;
    let queryResult = await conn.tooling.query(query);
    len += queryResult.records.length;
    await callback({
        records: queryResult.records as T[],
        currentSize: len,
        totalSize: queryResult.totalSize
    });
    while (!queryResult.done && queryResult.nextRecordsUrl) {
        queryResult = await conn.queryMore(queryResult.nextRecordsUrl);
        len += queryResult.records.length;
        await callback({
            records: queryResult.records as T[],
            currentSize: len,
            totalSize: queryResult.totalSize
        });
    }
}
