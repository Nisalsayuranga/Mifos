// Canonical Branch IDs matching public.branches table in Supabase
export const CANONICAL_BRANCHES = [
  { id: 'HQ',   name: 'Head Office' },
  { id: 'KHT',  name: 'Kahathuduwa' },
  { id: 'KTW',  name: 'Kottawa' },
  { id: 'KOT',  name: 'Kotikawatta' },
  { id: 'PND',  name: 'Panadura' },
  { id: 'BRL',  name: 'Borella' },
  { id: 'DHW',  name: 'Dehiwala' },
  { id: 'DMT',  name: 'Dematagoda' },
  { id: 'HMG',  name: 'Homagama' },
  { id: 'KDW',  name: 'Kadawatha' },
  { id: 'KIR',  name: 'Kiribathgoda' },
  { id: 'W2',   name: 'Wattala 2' },
  { id: 'W3',   name: 'Wattala 3' },
  { id: 'W4',   name: 'Wattala 4' },
  { id: 'TEST', name: 'Test Branch' },
] as const;

// Normalization map from any alias / UI value to canonical database branch_id
const BRANCH_ALIAS_MAP: Record<string, string> = {
  // Test Branch
  'TEST': 'TEST',
  'TESTBRANCH': 'TEST',
  'TEST BRANCH': 'TEST',

  // Kahathuduwa
  'KAH': 'KHT',
  'KHT': 'KHT',
  'KAHATHUDUWA': 'KHT',
  'KAHATHOTUWA': 'KHT',
  'KAHATHUTUWA': 'KHT',

  // Panadura
  'PAN': 'PND',
  'PND': 'PND',
  'PANADURA': 'PND',

  // Dematagoda
  'DEM': 'DMT',
  'DMT': 'DMT',
  'DEMATAGODA': 'DMT',
  'DEMOTAGODA': 'DMT',

  // Borella
  'BOR': 'BRL',
  'BRL': 'BRL',
  'BORELLA': 'BRL',

  // Kadawatha
  'KAD': 'KDW',
  'KDW': 'KDW',
  'KADAWATHA': 'KDW',
  'KADAWATTA': 'KDW',

  // Kottawa
  'KTW': 'KTW',
  'KOTTAWA': 'KTW',

  // Kotikawatta
  'KOT': 'KOT',
  'KOTIKAWATTA': 'KOT',

  // Homagama
  'HOM': 'HMG',
  'HMG': 'HMG',
  'HOMAGAMA': 'HMG',

  // Kiribathgoda
  'KIR': 'KIR',
  'KIR1': 'KIR',
  'KIR2': 'KIR',
  'KIRIBATHGODA': 'KIR',

  // Wattala
  'WAT2': 'W2',
  'W2': 'W2',
  'WAT3': 'W3',
  'W3': 'W3',
  'WAT4': 'W4',
  'W4': 'W4',

  // Dehiwala
  'DHW': 'DHW',
  'DEHIWALA': 'DHW',

  // HQ
  'HQ': 'HQ',
  'HEAD OFFICE': 'HQ',
};

/**
 * Normalizes any branch code / alias / name to its canonical DB branch_id (e.g. 'KAH' -> 'KHT')
 */
export function normalizeBranchId(branchId: string | null | undefined): string {
  if (!branchId) return 'HQ';
  const clean = branchId.trim().toUpperCase();
  return BRANCH_ALIAS_MAP[clean] || clean;
}

/**
 * Returns all potential aliases for a given branch to ensure backward-compatible DB searches
 */
export function getBranchSearchTerms(branchId: string | null | undefined): string[] {
  const norm = normalizeBranchId(branchId);
  const terms = new Set<string>([norm]);
  if (branchId) terms.add(branchId.trim().toUpperCase());

  if (norm === 'KHT') {
    terms.add('KAH');
    terms.add('Kahathuduwa');
    terms.add('Kahathotuwa');
  } else if (norm === 'PND') {
    terms.add('PAN');
    terms.add('Panadura');
  } else if (norm === 'DMT') {
    terms.add('DEM');
    terms.add('Dematagoda');
  } else if (norm === 'BRL') {
    terms.add('BOR');
    terms.add('Borella');
  } else if (norm === 'KDW') {
    terms.add('KAD');
    terms.add('Kadawatha');
  } else if (norm === 'KTW') {
    terms.add('Kottawa');
  } else if (norm === 'HMG') {
    terms.add('HOM');
    terms.add('Homagama');
  } else if (norm === 'W4') {
    terms.add('WAT4');
  } else if (norm === 'W3') {
    terms.add('WAT3');
  } else if (norm === 'W2') {
    terms.add('WAT2');
  } else if (norm === 'TEST') {
    terms.add('TESTBRANCH');
    terms.add('testbranch');
    terms.add('Test Branch');
  }

  return Array.from(terms);
}
