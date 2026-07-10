export type LocationInference = {
  cidade: string | null;
  estado: string | null;
  confidence: number;
  evidence: string[];
};

type KnownLocation = { city: string; state: string; patterns: RegExp[] };

const KNOWN_LOCATIONS: KnownLocation[] = [
  { city: "Volta Redonda", state: "RJ", patterns: [/\bvolta(?:\s+|-)redonda\b/i, /#volta(?:redonda|redonda-rj)\b/i, /\bvr\s*[-/]?\s*rj\b/i] },
  { city: "Barra Mansa", state: "RJ", patterns: [/\bbarra(?:\s+|-)mansa\b/i, /#barramansa\b/i, /\bbm\s*[-/]?\s*rj\b/i] },
  { city: "Resende", state: "RJ", patterns: [/\bresende\s*[-/]?\s*rj\b/i, /#resende(?:rj)?\b/i] },
  { city: "Piraí", state: "RJ", patterns: [/\bpira[ií]\s*[-/]?\s*rj\b/i, /#pirai(?:rj)?\b/i] },
  { city: "Pinheiral", state: "RJ", patterns: [/\bpinheiral\s*[-/]?\s*rj\b/i, /#pinheiral(?:rj)?\b/i] },
  { city: "Itatiaia", state: "RJ", patterns: [/\bitatiaia\s*[-/]?\s*rj\b/i, /#itatiaia(?:rj)?\b/i] },
  { city: "Quatis", state: "RJ", patterns: [/\bquatis\s*[-/]?\s*rj\b/i, /#quatis(?:rj)?\b/i] },
  { city: "Porto Real", state: "RJ", patterns: [/\bporto\s+real\s*[-/]?\s*rj\b/i, /#portoreal(?:rj)?\b/i] },
  { city: "Valença", state: "RJ", patterns: [/\bvalen[cç]a\s*[-/]?\s*rj\b/i, /#valenca(?:rj)?\b/i] },
  { city: "Rio Claro", state: "RJ", patterns: [/\brio\s+claro\s*[-/]?\s*rj\b/i, /#rioclarorj\b/i] },
];

export function inferLocation(input: { bio?: string | null; site?: string | null; text?: string | null; hashtags?: string[] | null }): LocationInference {
  const sources = [
    ["bio", input.bio],
    ["site", input.site],
    ["texto", input.text],
    ["hashtags", input.hashtags?.join(" ")],
  ] as const;
  const matches: Array<{ location: KnownLocation; source: string; text: string }> = [];

  for (const [source, value] of sources) {
    if (!value) continue;
    for (const location of KNOWN_LOCATIONS) {
      if (location.patterns.some((pattern) => pattern.test(value))) {
        matches.push({ location, source, text: value.slice(0, 140) });
      }
    }
  }

  if (matches.length === 0) return { cidade: null, estado: null, confidence: 0, evidence: [] };
  const counts = new Map<string, number>();
  for (const match of matches) counts.set(match.location.city, (counts.get(match.location.city) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length > 1 && sorted[0][1] === sorted[1][1]) {
    return { cidade: null, estado: null, confidence: 0, evidence: ["Evidências conflitantes; localização não atribuída."] };
  }

  const winner = matches.find((match) => match.location.city === sorted[0][0]);
  if (!winner) return { cidade: null, estado: null, confidence: 0, evidence: [] };
  const winnerMatches = matches.filter((match) => match.location.city === winner.location.city);
  const sourceCount = new Set(winnerMatches.map((match) => match.source)).size;
  const confidence = Math.min(0.99, sourceCount > 1 ? 0.98 : winner.source === "bio" ? 0.9 : 0.78);
  return {
    cidade: winner.location.city,
    estado: winner.location.state,
    confidence,
    evidence: winnerMatches.map((match) => `${match.source}: ${match.text}`),
  };
}
