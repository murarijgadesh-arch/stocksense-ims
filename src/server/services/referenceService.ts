import { DatabaseSync } from 'node:sqlite';

export function getNextReference(db: DatabaseSync, type: 'RCP' | 'DLV' | 'TRF' | 'ADJ'): string {
  let table = '';
  switch (type) {
    case 'RCP':
      table = 'receipts';
      break;
    case 'DLV':
      table = 'deliveries';
      break;
    case 'TRF':
      table = 'transfers';
      break;
    case 'ADJ':
      table = 'adjustments';
      break;
  }

  const query = `SELECT COUNT(*) as count FROM ${table}`;
  const row = db.prepare(query).get() as { count: number } | undefined;
  const count = (row?.count || 0) + 1;
  return `${type}-${String(count).padStart(4, '0')}`;
}
