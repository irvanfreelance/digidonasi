/** Memecah berkas SQL pada titik koma di luar string dan dollar-quote. */
export function splitSql(sql: string): string[] {
  const out: string[] = [];
  let buf = "";
  let i = 0;
  let inDollar = false;
  let inSingle = false;
  while (i < sql.length) {
    const ch = sql[i];
    if (!inSingle && sql.startsWith("$$", i)) {
      inDollar = !inDollar;
      buf += "$$";
      i += 2;
      continue;
    }
    if (!inDollar && !inSingle && sql.startsWith("--", i)) {
      while (i < sql.length && sql[i] !== "\n") i += 1;
      continue;
    }
    if (!inDollar && ch === "'") {
      if (inSingle && sql[i + 1] === "'") {
        buf += "''";
        i += 2;
        continue;
      }
      inSingle = !inSingle;
      buf += ch;
      i += 1;
      continue;
    }
    if (!inDollar && !inSingle && ch === ";") {
      const statement = buf.trim();
      if (statement.length) out.push(statement);
      buf = "";
      i += 1;
      continue;
    }
    buf += ch;
    i += 1;
  }
  const rest = buf.trim();
  if (rest.length) out.push(rest);
  return out;
}
