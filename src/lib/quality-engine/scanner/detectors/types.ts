import type {
  NormalizedResult,
  DecodedPayload,
  DetectorMatch,
  ThreatCategory
} from '../types';

export interface DetectorModule {
  id: string;
  name: string;
  category: ThreatCategory;
  categoryName: string;
  weight: number;
  detect: (
    input: string,
    context: string | undefined,
    normalized: NormalizedResult,
    decoded: DecodedPayload[]
  ) => DetectorMatch[];
}
