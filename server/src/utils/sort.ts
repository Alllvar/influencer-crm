// "-followers" → { followers: -1, _id: 1 }. The _id tie-breaker keeps pagination stable
// when many documents share the same value.
export function parseSort(sort: string): Record<string, 1 | -1> {
  const desc = sort.startsWith('-');
  return { [desc ? sort.slice(1) : sort]: desc ? -1 : 1, _id: 1 };
}
