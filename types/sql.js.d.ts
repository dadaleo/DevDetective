declare module "sql.js" {
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  }

  interface Database {
    run(sql: string, params?: unknown[]): Database;
    exec(sql: string): QueryExecResult[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  interface Statement {
    bind(params?: unknown[]): boolean;
    step(): boolean;
    getAsObject<T = Record<string, unknown>>(): T;
    get(): unknown[];
    free(): boolean;
    reset(): void;
  }

  interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  export type { Database, Statement, SqlJsStatic, QueryExecResult };

  export default function initSqlJs(
    config?: Partial<{ locateFile: (file: string) => string }>
  ): Promise<SqlJsStatic>;
}
