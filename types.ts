export interface CoinData {
  id: string;
  name: string;
  year: number | null;
  country: string;
  denomination: string;
  value: number;
  currency: string;
  composition: string;
  description: string;
  condition: string;
  dateAdded: string;
  frontImageUrl: string;
  backImageUrl: string;
  isRare: boolean;
  rarityDetails: string;
  sources?: string[];
}

export interface CoinAnalysisResult {
  name: string;
  year: number | null;
  country: string;
  denomination: string;
  estimatedValue: number;
  composition: string;
  description: string;
  conditionEstimate: string;
  isRare: boolean;
  rarityDetails: string;
  sources?: string[];
}

export type ViewState = 'dashboard' | 'collection' | 'add' | 'details';
