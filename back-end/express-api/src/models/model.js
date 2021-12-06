import { pool } from './pool';

class Model {
  constructor(table) {
    this.pool = pool;
    this.table = table;
    this.pool.on(
      'error',
      (err, client) =>
        `Error, ${err}, on idle client${client}`
    );
  }

  async select(columns, clause) {
    let query = `SELECT ${columns} FROM ${this.table}`;
    if (clause) query += clause;
    return this.pool.query(query);
  }

  async selectSubQuery(columns, subQuery) {
    const query = `Select ${columns} FROM ${subQuery}`;
    return this.pool.query(query);
  }

  async selectQuery(rawQuery, clause) {
    let query = rawQuery;
    if (clause) query += clause;
    return this.pool.query(query);
  }

  async insertWithReturn(columns, values) {
    const query = `
        INSERT INTO ${this.table}(${columns})
        VALUES (${values})
        RETURNING id, ${columns}
    `;
    return this.pool.query(query);
  }
}

export default Model;
