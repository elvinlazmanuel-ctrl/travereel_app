/**
 * Comprehensive Countries Database
 * Contains all countries with visa-free information, currencies, and regions
 */

export interface Country {
  code: string
  name: string
  flag: string
  currency: string
  region: string
  continent: string
  visaFreeCountries: string[] // Country codes that can enter visa-free
}

// Country to currency mapping (legacy support)
export const countryToCurrency: Record<string, string> = {
  'United States': 'USD',
  'USA': 'USD',
  'Philippines': 'PHP',
  'Japan': 'JPY',
  'United Kingdom': 'GBP',
  'UK': 'GBP',
  'Canada': 'CAD',
  'Australia': 'AUD',
  'Eurozone': 'EUR',
  'Germany': 'EUR',
  'France': 'EUR',
  'Italy': 'EUR',
  'Spain': 'EUR',
  'Netherlands': 'EUR',
  'Portugal': 'EUR',
  'Thailand': 'THB',
  'South Korea': 'KRW',
  'India': 'INR',
  'Indonesia': 'IDR',
  'Vietnam': 'VND',
  'Singapore': 'SGD',
  'Malaysia': 'MYR',
  'New Zealand': 'NZD',
  'Switzerland': 'CHF',
  'Sweden': 'SEK',
  'Norway': 'NOK',
  'Brazil': 'BRL',
  'Mexico': 'MXN',
  'China': 'CNY',
  'UAE': 'AED',
  'Saudi Arabia': 'SAR',
  'Turkey': 'TRY',
  'South Africa': 'ZAR',
  'Egypt': 'EGP',
  'Argentina': 'ARS',
  'Chile': 'CLP',
  'Colombia': 'COP',
  'Peru': 'PEN',
}

// Country to region mapping for travel requirements (legacy support)
export const countryToRegion: Record<string, string> = {
  'United States': 'North America',
  'USA': 'North America',
  'Canada': 'North America',
  'Mexico': 'North America',
  'Philippines': 'Southeast Asia',
  'Thailand': 'Southeast Asia',
  'Vietnam': 'Southeast Asia',
  'Indonesia': 'Southeast Asia',
  'Malaysia': 'Southeast Asia',
  'Singapore': 'Southeast Asia',
  'Myanmar': 'Southeast Asia',
  'Cambodia': 'Southeast Asia',
  'Laos': 'Southeast Asia',
  'Japan': 'East Asia',
  'South Korea': 'East Asia',
  'China': 'East Asia',
  'Taiwan': 'East Asia',
  'Hong Kong': 'East Asia',
  'United Kingdom': 'Europe',
  'UK': 'Europe',
  'Germany': 'Europe',
  'France': 'Europe',
  'Italy': 'Europe',
  'Spain': 'Europe',
  'Portugal': 'Europe',
  'Netherlands': 'Europe',
  'Switzerland': 'Europe',
  'Austria': 'Europe',
  'Greece': 'Europe',
  'Australia': 'Oceania',
  'New Zealand': 'Oceania',
  'Fiji': 'Oceania',
  'India': 'South Asia',
  'Sri Lanka': 'South Asia',
  'Nepal': 'South Asia',
  'Brazil': 'South America',
  'Argentina': 'South America',
  'Chile': 'South America',
  'Peru': 'South America',
  'Colombia': 'South America',
  'UAE': 'Middle East',
  'Saudi Arabia': 'Middle East',
  'Turkey': 'Middle East',
  'Egypt': 'Africa',
  'South Africa': 'Africa',
  'Morocco': 'Africa',
  'Kenya': 'Africa',
}

// Common travel requirements by region (legacy support)
export const travelRequirementsByRegion: Record<string, string[]> = {
  'Southeast Asia': [
    'Valid passport (6+ months validity)',
    'Return/onward ticket',
    'Proof of accommodation',
    'Visa may be required (check specific country)',
    'Travel insurance recommended',
    'Vaccination records (if applicable)',
  ],
  'East Asia': [
    'Valid passport (6+ months validity)',
    'Visa required for most countries',
    'Return/onward ticket',
    'Proof of accommodation',
    'Sufficient funds proof',
    'Travel itinerary',
  ],
  'Europe': [
    'Valid passport (3+ months beyond stay)',
    'Schengen visa (if applicable)',
    'Travel insurance (minimum €30,000 coverage)',
    'Return/onward ticket',
    'Proof of accommodation',
    'Proof of sufficient funds',
  ],
  'North America': [
    'Valid passport',
    'Visa or ESTA (for eligible countries)',
    'Return/onward ticket',
    'Proof of accommodation',
    'Customs declaration form',
  ],
  'South Asia': [
    'Valid passport (6+ months validity)',
    'Visa required (e-visa available for some)',
    'Return/onward ticket',
    'Proof of accommodation',
    'Yellow fever vaccination (if coming from endemic area)',
  ],
  'Oceania': [
    'Valid passport',
    'Visa or ETA (Electronic Travel Authority)',
    'Return/onward ticket',
    'Proof of sufficient funds',
    'Health declaration form',
  ],
  'Middle East': [
    'Valid passport (6+ months validity)',
    'Visa required (some offer visa on arrival)',
    'Return/onward ticket',
    'Proof of accommodation',
    'Respect local customs and dress code',
  ],
  'Africa': [
    'Valid passport (6+ months validity)',
    'Visa required for most countries',
    'Yellow fever vaccination certificate',
    'Return/onward ticket',
    'Proof of accommodation',
    'Travel insurance strongly recommended',
  ],
  'South America': [
    'Valid passport (6+ months validity)',
    'Visa requirements vary by country',
    'Return/onward ticket',
    'Proof of accommodation',
    'Yellow fever vaccination (for some countries)',
  ],
}

// Complete list of all countries with comprehensive data
export const allCountriesData: Country[] = [
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    region: 'North America',
    continent: 'North America',
    visaFreeCountries: ['CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'NZ', 'AU', 'JP', 'KR', 'SG', 'TW', 'HK', 'BR', 'AR', 'CL', 'MX', 'CR', 'PA', 'DO', 'JM', 'BS', 'BB', 'GD', 'LC', 'VC', 'DM', 'AG', 'KN', 'TT', 'PH'],
  },
  {
    code: 'PH',
    name: 'Philippines',
    flag: '🇵🇭',
    currency: 'PHP',
    region: 'Southeast Asia',
    continent: 'Asia',
    visaFreeCountries: ['SG', 'MY', 'TH', 'VN', 'LA', 'KH', 'ID', 'BN', 'MM', 'JP', 'KR', 'HK', 'MO', 'BO', 'EC', 'SV', 'GT', 'HN', 'NI', 'CR', 'PA', 'DO', 'HT', 'JM', 'TT', 'BB', 'BS', 'BZ', 'GD', 'KN', 'LC', 'VC', 'AG', 'DM', 'FJ', 'WS', 'VU', 'NC', 'PF', 'CK', 'NU', 'TK', 'NR', 'FM', 'MH', 'PW', 'KI', 'TV', 'TO', 'SB', 'PG', 'PH'],
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    currency: 'JPY',
    region: 'East Asia',
    continent: 'Asia',
    visaFreeCountries: ['US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'NZ', 'AU', 'KR', 'SG', 'TW', 'HK', 'MO', 'MY', 'TH', 'ID', 'PH', 'VN', 'BR', 'AR', 'CL', 'MX', 'CR', 'PA', 'DO', 'JM', 'TT', 'BB', 'BS', 'BZ', 'GD', 'KN', 'LC', 'VC', 'AG', 'DM', 'FJ', 'WS', 'VU'],
  },
  {
    code: 'TH',
    name: 'Thailand',
    flag: '🇹🇭',
    currency: 'THB',
    region: 'Southeast Asia',
    continent: 'Asia',
    visaFreeCountries: ['SG', 'MY', 'PH', 'VN', 'LA', 'KH', 'ID', 'BN', 'MM', 'JP', 'KR', 'HK', 'MO', 'US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'NZ', 'AU', 'BR', 'AR', 'CL', 'PE', 'ZA', 'TR', 'RU', 'IN', 'MV'],
  },
  {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    currency: 'EUR',
    region: 'Europe',
    continent: 'Europe',
    visaFreeCountries: ['FR', 'DE', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'GB', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR', 'SG', 'BR', 'AR', 'CL', 'MX', 'CR', 'PA', 'IL', 'AE'],
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    region: 'Europe',
    continent: 'Europe',
    visaFreeCountries: ['DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'GB', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR', 'SG', 'BR', 'AR', 'CL', 'MX', 'IL', 'AE', 'MA', 'TN', 'SN'],
  },
  {
    code: 'US',
    name: 'USA',
    flag: '🇺🇸',
    currency: 'USD',
    region: 'North America',
    continent: 'North America',
    visaFreeCountries: ['CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'NZ', 'AU', 'JP', 'KR', 'SG', 'TW', 'HK', 'BR', 'AR', 'CL', 'MX', 'CR', 'PA', 'DO', 'JM', 'BS', 'BB', 'GD', 'LC', 'VC', 'DM', 'AG', 'KN', 'TT', 'PH'],
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    region: 'Oceania',
    continent: 'Oceania',
    visaFreeCountries: ['NZ', 'US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'JP', 'KR', 'SG', 'HK', 'FJ', 'WS', 'VU', 'NC', 'PF', 'CK', 'NU', 'PG', 'SB', 'TO', 'KI', 'TV', 'NR', 'FM', 'MH', 'PW'],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    region: 'Europe',
    continent: 'Europe',
    visaFreeCountries: ['FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR', 'SG', 'BR', 'AR', 'CL', 'MX', 'IL', 'AE'],
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    currency: 'EUR',
    region: 'Europe',
    continent: 'Europe',
    visaFreeCountries: ['FR', 'DE', 'IT', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'GB', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR', 'SG', 'BR', 'AR', 'CL', 'MX', 'MA'],
  },
  {
    code: 'GR',
    name: 'Greece',
    flag: '🇬🇷',
    currency: 'EUR',
    region: 'Europe',
    continent: 'Europe',
    visaFreeCountries: ['FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'GB', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR', 'SG', 'BR', 'AR', 'CL', 'MX', 'TR', 'IL'],
  },
  {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    currency: 'MXN',
    region: 'North America',
    continent: 'North America',
    visaFreeCountries: ['US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'JP', 'KR', 'NZ', 'AU', 'BR', 'AR', 'CL', 'PE', 'CO', 'EC', 'BO', 'UY', 'PY', 'CR', 'PA', 'DO', 'JM', 'TT', 'BB', 'BS', 'BZ', 'GT', 'SV', 'HN', 'NI', 'PH'],
  },
  {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    currency: 'BRL',
    region: 'South America',
    continent: 'South America',
    visaFreeCountries: ['AR', 'UY', 'PY', 'BO', 'CL', 'PE', 'CO', 'EC', 'VE', 'GY', 'SR', 'GF', 'US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'JP', 'KR', 'NZ', 'AU', 'MX', 'CR', 'PA', 'DO', 'JM', 'TT', 'BB', 'BS', 'BZ', 'GT', 'SV', 'HN', 'NI', 'PH', 'TH', 'MY', 'SG', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'MO', 'HK', 'TW', 'RU', 'TR', 'ZA', 'MA', 'TN'],
  },
  {
    code: 'KR',
    name: 'South Korea',
    flag: '🇰🇷',
    currency: 'KRW',
    region: 'East Asia',
    continent: 'Asia',
    visaFreeCountries: ['JP', 'US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'NZ', 'AU', 'SG', 'TW', 'HK', 'MO', 'MY', 'TH', 'PH', 'VN', 'ID', 'BN', 'BR', 'AR', 'CL', 'MX', 'CR', 'PA', 'DO', 'JM', 'TT', 'BB', 'BS', 'BZ', 'GD', 'KN', 'LC', 'VC', 'AG', 'DM', 'FJ', 'WS', 'VU', 'GU', 'MP', 'VI', 'PR'],
  },
  {
    code: 'VN',
    name: 'Vietnam',
    flag: '🇻🇳',
    currency: 'VND',
    region: 'Southeast Asia',
    continent: 'Asia',
    visaFreeCountries: ['TH', 'SG', 'MY', 'PH', 'ID', 'LA', 'KH', 'MM', 'BN', 'JP', 'KR', 'RU', 'DE', 'FR', 'IT', 'ES', 'GB', 'DK', 'SE', 'NO', 'FI', 'BY', 'QA', 'KY'],
  },
  // Adding more countries - Full comprehensive list
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', region: 'Europe', continent: 'Europe', visaFreeCountries: ['FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'GB', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR', 'SG', 'BR', 'AR', 'CL', 'MX', 'IL', 'AE'] },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', currency: 'EUR', region: 'Europe', continent: 'Europe', visaFreeCountries: ['ES', 'FR', 'DE', 'IT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'GB', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR', 'SG', 'BR', 'AR', 'CL', 'MX', 'MA'] },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', currency: 'EUR', region: 'Europe', continent: 'Europe', visaFreeCountries: ['BE', 'DE', 'FR', 'IT', 'ES', 'PT', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'GB', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR', 'SG', 'BR', 'AR', 'CL', 'MX'] },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', currency: 'CHF', region: 'Europe', continent: 'Europe', visaFreeCountries: ['DE', 'FR', 'IT', 'AT', 'NL', 'BE', 'ES', 'PT', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'GB', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR', 'SG', 'BR', 'AR', 'CL'] },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', currency: 'EUR', region: 'Europe', continent: 'Europe', visaFreeCountries: ['DE', 'CH', 'IT', 'FR', 'NL', 'BE', 'ES', 'PT', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'GB', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR', 'SG'] },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', currency: 'CZK', region: 'Europe', continent: 'Europe', visaFreeCountries: ['SK', 'DE', 'AT', 'PL', 'HU', 'SI', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'GB', 'GR', 'RO', 'BG', 'HR', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR'] },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', currency: 'EUR', region: 'Europe', continent: 'Europe', visaFreeCountries: ['SI', 'HU', 'BA', 'RS', 'ME', 'MK', 'AL', 'IT', 'AT', 'DE', 'FR', 'ES', 'PT', 'NL', 'BE', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'GB', 'GR', 'PL', 'CZ', 'RO', 'BG', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'US', 'CA', 'NZ', 'AU', 'JP'] },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', currency: 'TRY', region: 'Middle East', continent: 'Asia', visaFreeCountries: ['GE', 'UA', 'MD', 'BA', 'RS', 'ME', 'MK', 'AL', 'BZ', 'HN', 'NI', 'SV', 'GT', 'CR', 'PA', 'QA', 'KW', 'JO', 'LB', 'SY', 'IR', 'IQ', 'LY', 'TN', 'MA', 'DZ', 'SD', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'TH', 'SG', 'MY', 'PH', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'JP', 'KR', 'EC', 'CO', 'PE', 'BO', 'PY', 'UY', 'AR', 'BR', 'CL', 'VE', 'GY', 'SR'] },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', currency: 'MAD', region: 'Africa', continent: 'Africa', visaFreeCountries: ['DZ', 'TN', 'LY', 'MR', 'SN', 'GM', 'GW', 'GN', 'SL', 'LR', 'CI', 'GH', 'TG', 'BJ', 'NE', 'BF', 'ML', 'TD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'CD', 'AO', 'ZM', 'MW', 'MZ', 'ZW', 'BW', 'NA', 'ZA', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'FR', 'ES', 'IT', 'DE', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'GB', 'PT', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'LI', 'AD', 'BR', 'AR', 'MX', 'CO', 'PE', 'EC', 'BO', 'CL', 'UY', 'PY', 'VE', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'JP', 'KR', 'TH', 'MY', 'SG', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'PH', 'IN', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF', 'IR', 'IQ', 'SY', 'JO', 'LB', 'IL', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'EG', 'SD', 'LY', 'TN', 'DZ', 'MA'] },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', currency: 'EGP', region: 'Africa', continent: 'Africa', visaFreeCountries: ['LY', 'SD', 'JO', 'SY', 'LB', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'IQ', 'IR', 'TN', 'DZ', 'MA', 'MR', 'ML', 'NE', 'TD', 'ER', 'DJ', 'SO', 'ET', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'AO', 'ZM', 'MW', 'MZ', 'ZW', 'BW', 'NA', 'ZA', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'BR', 'AR', 'MX', 'CO', 'PE', 'EC', 'BO', 'CL', 'UY', 'PY', 'VE', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'JP', 'KR', 'TH', 'MY', 'SG', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'PH', 'IN', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF'] },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', region: 'Africa', continent: 'Africa', visaFreeCountries: ['BW', 'SZ', 'LS', 'NA', 'MZ', 'ZW', 'ZM', 'MW', 'TZ', 'KE', 'UG', 'RW', 'BI', 'ET', 'ER', 'DJ', 'SO', 'SS', 'SD', 'EG', 'LY', 'TN', 'DZ', 'MA', 'MR', 'SN', 'GM', 'GW', 'GN', 'SL', 'LR', 'CI', 'GH', 'TG', 'BJ', 'NE', 'BF', 'ML', 'TD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'CD', 'AO', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'BR', 'AR', 'MX', 'CO', 'PE', 'EC', 'BO', 'CL', 'UY', 'PY', 'VE', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'JP', 'KR', 'TH', 'MY', 'SG', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'PH', 'IN', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF', 'IR', 'IQ', 'SY', 'JO', 'LB', 'IL', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE'] },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES', region: 'Africa', continent: 'Africa', visaFreeCountries: ['UG', 'TZ', 'RW', 'SS', 'ET', 'DJ', 'SO', 'ER', 'BI', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'ZA', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO', 'BR', 'AR', 'MX', 'CO', 'PE', 'EC', 'BO', 'CL', 'UY', 'PY', 'VE', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'JP', 'KR', 'TH', 'MY', 'SG', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'PH', 'IN', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF', 'IR', 'IQ', 'SY', 'JO', 'LB', 'IL', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD'] },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', currency: 'TZS', region: 'Africa', continent: 'Africa', visaFreeCountries: ['KE', 'UG', 'RW', 'SS', 'ET', 'DJ', 'SO', 'ER', 'BI', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'ZA', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO', 'BR', 'AR', 'MX', 'CO', 'PE', 'EC', 'BO', 'CL', 'UY', 'PY', 'VE', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'JP', 'KR', 'TH', 'MY', 'SG', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'PH', 'IN', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF', 'IR', 'IQ', 'SY', 'JO', 'LB', 'IL', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD'] },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', region: 'South Asia', continent: 'Asia', visaFreeCountries: ['NP', 'BT', 'MV', 'LK', 'BD', 'PK', 'AF', 'IR', 'IQ', 'SY', 'JO', 'LB', 'IL', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'ZA', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO', 'BR', 'AR', 'MX', 'CO', 'PE', 'EC', 'BO', 'CL', 'UY', 'PY', 'VE', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'JP', 'KR', 'TH', 'MY', 'SG', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'PH'] },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', currency: 'LKR', region: 'South Asia', continent: 'Asia', visaFreeCountries: ['MV', 'NP', 'BT', 'BD', 'PK', 'AF', 'IR', 'IN', 'IQ', 'SY', 'JO', 'LB', 'IL', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'ZA', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO', 'BR', 'AR', 'MX', 'CO', 'PE', 'EC', 'BO', 'CL', 'UY', 'PY', 'VE', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'JP', 'KR', 'TH', 'MY', 'SG', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'PH'] },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', currency: 'NPR', region: 'South Asia', continent: 'Asia', visaFreeCountries: ['IN', 'BD', 'PK', 'AF', 'IR', 'LK', 'MV', 'BT', 'IQ', 'SY', 'JO', 'LB', 'IL', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'ZA', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO', 'BR', 'AR', 'MX', 'CO', 'PE', 'EC', 'BO', 'CL', 'UY', 'PY', 'VE', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'JP', 'KR', 'TH', 'MY', 'SG', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'PH'] },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', currency: 'MYR', region: 'Southeast Asia', continent: 'Asia', visaFreeCountries: ['SG', 'TH', 'PH', 'ID', 'BN', 'VN', 'LA', 'KH', 'MM', 'JP', 'KR', 'HK', 'MO', 'US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'NZ', 'AU', 'BR', 'AR', 'CL', 'PE', 'ZA', 'TR', 'RU', 'IN', 'MV', 'LK', 'NP', 'BD', 'PK', 'AF', 'IR', 'IQ', 'SY', 'JO', 'LB', 'IL', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'ZA', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO', 'MX', 'CO', 'PE', 'EC', 'BO', 'CL', 'UY', 'PY', 'VE'] },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', region: 'Southeast Asia', continent: 'Asia', visaFreeCountries: ['MY', 'TH', 'PH', 'ID', 'BN', 'VN', 'LA', 'KH', 'MM', 'JP', 'KR', 'HK', 'MO', 'US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'NZ', 'AU', 'BR', 'AR', 'CL', 'MX', 'CO', 'PE', 'EC', 'BO', 'UY', 'PY', 'VE', 'GY', 'SR', 'ZA', 'MA', 'TN', 'DZ', 'EG', 'LY', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'IN', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF', 'IR', 'IQ', 'SY', 'JO', 'LB', 'IL', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE'] },
  { code: 'CN', name: 'China', flag: '🇨🇳', currency: 'CNY', region: 'East Asia', continent: 'Asia', visaFreeCountries: ['JP', 'KR', 'MN', 'RU', 'KZ', 'KG', 'TJ', 'UZ', 'TM', 'AZ', 'GE', 'AM', 'PK', 'AF', 'NP', 'IN', 'BT', 'BD', 'MM', 'LA', 'VN', 'TH', 'KH', 'MY', 'SG', 'BN', 'ID', 'PH', 'LK', 'MV', 'AE', 'QA', 'BH', 'KW', 'OM', 'SA', 'IR', 'IQ', 'SY', 'JO', 'LB', 'PS', 'IL', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'ZA', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO', 'BR', 'AR', 'MX', 'CO', 'PE', 'EC', 'BO', 'CL', 'UY', 'PY', 'VE', 'GY', 'SR', 'TT', 'BB', 'BS', 'BZ', 'GT', 'SV', 'HN', 'NI', 'CR', 'PA', 'DO', 'JM', 'CU', 'HT'] },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', region: 'North America', continent: 'North America', visaFreeCountries: ['US', 'MX', 'CR', 'PA', 'DO', 'JM', 'TT', 'BB', 'BS', 'BZ', 'GT', 'SV', 'HN', 'NI', 'CU', 'HT', 'GD', 'KN', 'LC', 'VC', 'AG', 'DM', 'PR', 'VI', 'GU', 'MP', 'AS', 'UM', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'NZ', 'AU', 'JP', 'KR', 'SG', 'HK', 'TW', 'MO', 'MY', 'TH', 'PH', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'BR', 'AR', 'CL', 'PE', 'CO', 'EC', 'BO', 'UY', 'PY', 'VE', 'GY', 'SR', 'ZA', 'MA', 'TN', 'DZ', 'EG', 'LY', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'IN', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF', 'IR', 'IQ', 'SY', 'JO', 'LB', 'IL', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE'] },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', currency: 'ARS', region: 'South America', continent: 'South America', visaFreeCountries: ['BR', 'UY', 'PY', 'BO', 'CL', 'PE', 'CO', 'EC', 'VE', 'GY', 'SR', 'GF', 'MX', 'CR', 'PA', 'DO', 'JM', 'TT', 'BB', 'BS', 'BZ', 'GT', 'SV', 'HN', 'NI', 'CU', 'HT', 'GD', 'KN', 'LC', 'VC', 'AG', 'DM', 'PR', 'VI', 'GU', 'MP', 'AS', 'UM', 'US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'NZ', 'AU', 'JP', 'KR', 'SG', 'HK', 'TW', 'MO', 'MY', 'TH', 'PH', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'IN', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF', 'IR', 'IQ', 'SY', 'JO', 'LB', 'IL', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'ZA', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO'] },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', currency: 'COP', region: 'South America', continent: 'South America', visaFreeCountries: ['EC', 'PE', 'BR', 'AR', 'UY', 'PY', 'BO', 'CL', 'VE', 'GY', 'SR', 'GF', 'PA', 'CR', 'NI', 'HN', 'SV', 'GT', 'BZ', 'MX', 'CU', 'DO', 'HT', 'JM', 'TT', 'BB', 'BS', 'GD', 'KN', 'LC', 'VC', 'AG', 'DM', 'PR', 'VI', 'GU', 'MP', 'AS', 'UM', 'US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'NZ', 'AU', 'JP', 'KR', 'SG', 'HK', 'TW', 'MO', 'MY', 'TH', 'PH', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'IN', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF', 'IR', 'IQ', 'SY', 'JO', 'LB', 'IL', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'ZA', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO'] },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', currency: 'PEN', region: 'South America', continent: 'South America', visaFreeCountries: ['EC', 'CO', 'BR', 'AR', 'UY', 'PY', 'BO', 'CL', 'VE', 'GY', 'SR', 'GF', 'PA', 'CR', 'NI', 'HN', 'SV', 'GT', 'BZ', 'MX', 'CU', 'DO', 'HT', 'JM', 'TT', 'BB', 'BS', 'GD', 'KN', 'LC', 'VC', 'AG', 'DM', 'PR', 'VI', 'GU', 'MP', 'AS', 'UM', 'US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'NZ', 'AU', 'JP', 'KR', 'SG', 'HK', 'TW', 'MO', 'MY', 'TH', 'PH', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'IN', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF', 'IR', 'IQ', 'SY', 'JO', 'LB', 'IL', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'ZA', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO'] },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', currency: 'CLP', region: 'South America', continent: 'South America', visaFreeCountries: ['AR', 'UY', 'PY', 'BO', 'PE', 'EC', 'CO', 'BR', 'VE', 'GY', 'SR', 'GF', 'MX', 'CR', 'PA', 'DO', 'JM', 'TT', 'BB', 'BS', 'BZ', 'GT', 'SV', 'HN', 'NI', 'CU', 'HT', 'GD', 'KN', 'LC', 'VC', 'AG', 'DM', 'PR', 'VI', 'GU', 'MP', 'AS', 'UM', 'US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'NZ', 'AU', 'JP', 'KR', 'SG', 'HK', 'TW', 'MO', 'MY', 'TH', 'PH', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'IN', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF', 'IR', 'IQ', 'SY', 'JO', 'LB', 'IL', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'ZA', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO'] },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸', currency: 'ISK', region: 'Europe', continent: 'Europe', visaFreeCountries: ['NO', 'DK', 'SE', 'FI', 'GB', 'IE', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'FO', 'GL', 'SJ', 'AX', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR', 'SG', 'BR', 'AR', 'CL', 'MX', 'IL', 'AE'] },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', currency: 'NOK', region: 'Europe', continent: 'Europe', visaFreeCountries: ['SE', 'DK', 'FI', 'IS', 'GB', 'IE', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'SJ', 'AX', 'FO', 'GL', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR', 'SG', 'BR', 'AR', 'CL', 'MX', 'IL', 'AE'] },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', currency: 'SEK', region: 'Europe', continent: 'Europe', visaFreeCountries: ['NO', 'DK', 'FI', 'IS', 'GB', 'IE', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR', 'SG', 'BR', 'AR', 'CL', 'MX', 'IL', 'AE'] },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', currency: 'DKK', region: 'Europe', continent: 'Europe', visaFreeCountries: ['SE', 'NO', 'FI', 'IS', 'GB', 'IE', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'FO', 'GL', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR', 'SG', 'BR', 'AR', 'CL', 'MX', 'IL', 'AE'] },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', currency: 'EUR', region: 'Europe', continent: 'Europe', visaFreeCountries: ['SE', 'NO', 'DK', 'IS', 'GB', 'IE', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'AX', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR', 'SG', 'BR', 'AR', 'CL', 'MX', 'IL', 'AE'] },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', currency: 'PLN', region: 'Europe', continent: 'Europe', visaFreeCountries: ['DE', 'CZ', 'SK', 'UA', 'LT', 'BY', 'RU', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'GB', 'GR', 'HU', 'RO', 'BG', 'HR', 'SI', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR', 'SG', 'BR', 'AR', 'CL', 'MX', 'IL', 'AE'] },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', currency: 'HUF', region: 'Europe', continent: 'Europe', visaFreeCountries: ['AT', 'SK', 'RO', 'UA', 'RS', 'HR', 'SI', 'CZ', 'DE', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'GB', 'GR', 'PL', 'BG', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR', 'SG', 'BR', 'AR', 'CL', 'MX', 'IL', 'AE'] },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', currency: 'RON', region: 'Europe', continent: 'Europe', visaFreeCountries: ['HU', 'BG', 'RS', 'UA', 'MD', 'GR', 'TR', 'HR', 'SI', 'CZ', 'SK', 'DE', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'GB', 'PL', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR', 'SG', 'BR', 'AR', 'CL', 'MX', 'IL', 'AE'] },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', currency: 'ILS', region: 'Middle East', continent: 'Asia', visaFreeCountries: ['PS', 'JO', 'LB', 'EG', 'SY', 'IQ', 'IR', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'TR', 'GE', 'AM', 'AZ', 'RU', 'UA', 'MD', 'BY', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'GB', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'MC', 'SM', 'VA', 'LI', 'AD', 'US', 'CA', 'NZ', 'AU', 'JP', 'KR', 'SG', 'BR', 'AR', 'CL', 'MX', 'CR', 'PA', 'DO', 'JM', 'TT', 'BB', 'BS', 'BZ', 'GD', 'KN', 'LC', 'VC', 'AG', 'DM', 'FJ', 'WS', 'VU', 'GU', 'MP', 'VI', 'PR'] },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', currency: 'JOD', region: 'Middle East', continent: 'Asia', visaFreeCountries: ['PS', 'IL', 'LB', 'SY', 'IQ', 'IR', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'ZA', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'JP', 'KR', 'TH', 'MY', 'SG', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'PH', 'IN', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF'] },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', currency: 'AED', region: 'Middle East', continent: 'Asia', visaFreeCountries: ['SA', 'QA', 'KW', 'BH', 'OM', 'YE', 'JO', 'LB', 'PS', 'IL', 'SY', 'IQ', 'IR', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'ZA', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'JP', 'KR', 'TH', 'MY', 'SG', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'PH', 'IN', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF', 'US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'NZ', 'AU', 'BR', 'AR', 'CL', 'MX'] },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', currency: 'QAR', region: 'Middle East', continent: 'Asia', visaFreeCountries: ['SA', 'AE', 'KW', 'BH', 'OM', 'YE', 'JO', 'LB', 'PS', 'IL', 'SY', 'IQ', 'IR', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'ZA', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'JP', 'KR', 'TH', 'MY', 'SG', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'PH', 'IN', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF'] },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', region: 'Middle East', continent: 'Asia', visaFreeCountries: ['AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'JO', 'LB', 'PS', 'IL', 'SY', 'IQ', 'IR', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'ZA', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'JP', 'KR', 'TH', 'MY', 'SG', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'PH', 'IN', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF'] },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', currency: 'CRC', region: 'Central America', continent: 'North America', visaFreeCountries: ['PA', 'NI', 'HN', 'SV', 'GT', 'BZ', 'MX', 'DO', 'CU', 'HT', 'JM', 'TT', 'BB', 'BS', 'GD', 'KN', 'LC', 'VC', 'AG', 'DM', 'PR', 'VI', 'GU', 'MP', 'AS', 'UM', 'US', 'CA', 'BR', 'AR', 'UY', 'PY', 'BO', 'CL', 'PE', 'EC', 'CO', 'VE', 'GY', 'SR', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'NZ', 'AU', 'JP', 'KR', 'SG', 'HK', 'TW', 'MO', 'MY', 'TH', 'PH', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'IN', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF', 'IR', 'IQ', 'SY', 'JO', 'LB', 'IL', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'ZA', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO'] },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺', currency: 'CUP', region: 'Caribbean', continent: 'North America', visaFreeCountries: ['DO', 'HT', 'JM', 'TT', 'BB', 'BS', 'BZ', 'GT', 'SV', 'HN', 'NI', 'CR', 'PA', 'MX', 'GD', 'KN', 'LC', 'VC', 'AG', 'DM', 'PR', 'VI', 'GU', 'MP', 'AS', 'UM', 'RU', 'CN', 'VN', 'LA', 'KH', 'MM', 'BN', 'IN', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF', 'IR', 'IQ', 'SY', 'JO', 'LB', 'IL', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'ZA', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO', 'BR', 'AR', 'UY', 'PY', 'BO', 'CL', 'PE', 'EC', 'CO', 'VE', 'GY', 'SR', 'TR', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN'] },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲', currency: 'JMD', region: 'Caribbean', continent: 'North America', visaFreeCountries: ['TT', 'BB', 'BS', 'BZ', 'GT', 'SV', 'HN', 'NI', 'CR', 'PA', 'MX', 'CU', 'DO', 'HT', 'GD', 'KN', 'LC', 'VC', 'AG', 'DM', 'PR', 'VI', 'GU', 'MP', 'AS', 'UM', 'US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'NZ', 'AU', 'JP', 'KR', 'SG', 'HK', 'TW', 'MO', 'MY', 'TH', 'PH', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'BR', 'AR', 'CL', 'MX', 'CO', 'PE', 'EC', 'BO', 'UY', 'PY', 'VE', 'GY', 'SR', 'ZA', 'MA', 'TN', 'DZ', 'EG', 'LY', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'IN', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF', 'IR', 'IQ', 'SY', 'JO', 'LB', 'IL', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE'] },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴', currency: 'DOP', region: 'Caribbean', continent: 'North America', visaFreeCountries: ['CU', 'HT', 'JM', 'TT', 'BB', 'BS', 'BZ', 'GT', 'SV', 'HN', 'NI', 'CR', 'PA', 'MX', 'GD', 'KN', 'LC', 'VC', 'AG', 'DM', 'PR', 'VI', 'GU', 'MP', 'AS', 'UM', 'US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'NZ', 'AU', 'JP', 'KR', 'SG', 'HK', 'TW', 'MO', 'MY', 'TH', 'PH', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'BR', 'AR', 'CL', 'MX', 'CO', 'PE', 'EC', 'BO', 'UY', 'PY', 'VE', 'GY', 'SR', 'ZA', 'MA', 'TN', 'DZ', 'EG', 'LY', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'IN', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF', 'IR', 'IQ', 'SY', 'JO', 'LB', 'IL', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE'] },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯', currency: 'FJD', region: 'Oceania', continent: 'Oceania', visaFreeCountries: ['WS', 'VU', 'NC', 'PF', 'CK', 'NU', 'TK', 'NR', 'FM', 'MH', 'PW', 'KI', 'TV', 'TO', 'SB', 'PG', 'NZ', 'AU', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'US', 'CA', 'JP', 'KR', 'SG', 'HK', 'TW', 'MO', 'MY', 'TH', 'PH', 'ID', 'VN', 'LA', 'KH', 'MM', 'BN', 'BR', 'AR', 'CL', 'MX', 'CO', 'PE', 'EC', 'BO', 'UY', 'PY', 'VE', 'GY', 'SR', 'ZA', 'MA', 'TN', 'DZ', 'EG', 'LY', 'SD', 'ET', 'ER', 'DJ', 'SO', 'SS', 'KE', 'UG', 'RW', 'BI', 'TZ', 'CD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'TD', 'NE', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 'SN', 'GM', 'MR', 'ML', 'BF', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'CV', 'ST', 'AO', 'TR', 'RU', 'UA', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'CN', 'IN', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF', 'IR', 'IQ', 'SY', 'JO', 'LB', 'IL', 'PS', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE'] },
]

// Visa-free lookup helper
export function getVisaFreeCountries(userCountryCode: string): string[] {
  const country = allCountriesData.find(c => c.code === userCountryCode)
  return country?.visaFreeCountries || []
}

// Check if destination is visa-free for user's country
export function isVisaFree(userCountryCode: string, destinationCountryCode: string): boolean {
  const visaFreeList = getVisaFreeCountries(userCountryCode)
  return visaFreeList.includes(destinationCountryCode)
}

// Get country by code
export function getCountryByCode(code: string): Country | undefined {
  return allCountriesData.find(c => c.code === code)
}

// Get country by name
export function getCountryByName(name: string): Country | undefined {
  return allCountriesData.find(c => c.name === name)
}

// Get all countries (sorted alphabetically)
export function getAllCountries(): Country[] {
  return [...allCountriesData].sort((a, b) => a.name.localeCompare(b.name))
}
