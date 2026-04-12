declare module 'better-sqlite3' {
  interface Database {
    prepare(sql: string): Statement;
    transaction<T extends (...args: any[]) => any>(fn: T): T;
    exec(sql: string): this;
    close(): this;
  }
  interface Statement {
    run(...params: any[]): RunResult;
    get(...params: any[]): any;
    all(...params: any[]): any[];
  }
  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }
  const Database: {
    (filename: string, options?: any): Database;
    new (filename: string, options?: any): Database;
  };
  export default Database;
}
