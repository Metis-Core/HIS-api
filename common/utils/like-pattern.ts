// Postgres LIKE treats \ as the default escape character.
export const containsPattern = (term: string): string =>
  `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
