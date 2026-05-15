'use client'

import { useMemo } from 'react'
import { Wallet, DollarSign } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
]

function getBudgetCategory(amount: number, currency: string): { label: string; color: string; emoji: string } {
  // Convert to USD equivalent for category (rough estimates)
  const rates: Record<string, number> = {
    USD: 1, EUR: 1.08, GBP: 1.27, JPY: 0.0067, PHP: 0.018,
    THB: 0.028, KRW: 0.00075, AUD: 0.65, CAD: 0.74, SGD: 0.74,
    INR: 0.012, BRL: 0.2, MXN: 0.059, IDR: 0.000064, VND: 0.00004,
    NZD: 0.6, CHF: 1.13, SEK: 0.096, NOK: 0.094, AED: 0.27,
  }
  const usdEquiv = amount * (rates[currency] || 1)

  if (usdEquiv <= 0) return { label: 'Set your budget', color: 'bg-gray-100 text-muted-foreground', emoji: '💰' }
  if (usdEquiv < 500) return { label: 'Budget', color: 'bg-green-100 text-green-700', emoji: '🌱' }
  if (usdEquiv < 1500) return { label: 'Moderate', color: 'bg-amber-100 text-amber-700', emoji: '🌿' }
  if (usdEquiv < 3000) return { label: 'Comfortable', color: 'bg-orange-100 text-orange-700', emoji: '🌺' }
  return { label: 'Luxury', color: 'bg-rose-100 text-rose-700', emoji: '👑' }
}

function getRangePercent(amount: number, currency: string): number {
  const rates: Record<string, number> = {
    USD: 1, EUR: 1.08, GBP: 1.27, JPY: 0.0067, PHP: 0.018,
    THB: 0.028, KRW: 0.00075, AUD: 0.65, CAD: 0.74, SGD: 0.74,
    INR: 0.012, BRL: 0.2, MXN: 0.059, IDR: 0.000064, VND: 0.00004,
    NZD: 0.6, CHF: 1.13, SEK: 0.096, NOK: 0.094, AED: 0.27,
  }
  const usdEquiv = amount * (rates[currency] || 1)
  const maxUsd = 5000
  return Math.min((usdEquiv / maxUsd) * 100, 100)
}

const currencySymbol = (code: string) => currencies.find(c => c.code === code)?.symbol || code

export default function StepBudget() {
  const { wizardData, setWizardData } = useAppStore()
  const category = useMemo(
    () => getBudgetCategory(wizardData.budget, wizardData.currency),
    [wizardData.budget, wizardData.currency]
  )
  const rangePercent = useMemo(
    () => getRangePercent(wizardData.budget, wizardData.currency),
    [wizardData.budget, wizardData.currency]
  )

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          What&apos;s your budget?
        </h2>
        <p className="text-sm text-muted-foreground">
          Set a budget to help plan your trip
        </p>
      </div>

      {/* Budget Amount */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Budget Amount
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={wizardData.budget || ''}
            onChange={(e) => setWizardData({ budget: Number(e.target.value) || 0 })}
            className="pl-10 text-2xl font-bold h-14"
          />
        </div>
      </div>

      {/* Currency Selector */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Currency
        </label>
        <Select
          value={wizardData.currency}
          onValueChange={(value) => setWizardData({ currency: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <span className="flex items-center gap-2">
                  <span className="font-medium">{c.symbol}</span>
                  <span>{c.code}</span>
                  <span className="text-gray-400">- {c.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Visual Budget Range */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground">Budget Range</span>
          <Badge className={`${category.color} border-0`}>
            <span className="mr-1">{category.emoji}</span>
            {category.label}
          </Badge>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${rangePercent}%`,
              background: 'linear-gradient(90deg, #2EC4B6, #FFBA49, #FF8C42, #FF6B6B)',
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400">$0</span>
          <span className="text-[10px] text-gray-400">$5,000+</span>
        </div>
      </div>

      {/* Budget Category Cards */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Budget', range: '<$500', emoji: '🌱', color: 'bg-green-50 border-green-200', amount: 300 },
          { label: 'Moderate', range: '$500-$1,500', emoji: '🌿', color: 'bg-amber-50 border-amber-200', amount: 1000 },
          { label: 'Comfortable', range: '$1,500-$3,000', emoji: '🌺', color: 'bg-orange-50 border-orange-200', amount: 2000 },
          { label: 'Luxury', range: '$3,000+', emoji: '👑', color: 'bg-rose-50 border-rose-200', amount: 4000 },
        ].map((cat) => (
          <button
            key={cat.label}
            onClick={() => setWizardData({ budget: cat.amount })}
            className={`p-3 rounded-xl border-2 transition-all text-left ${
              category.label === cat.label
                ? 'border-[#FF6B6B] shadow-sm'
                : 'border-transparent hover:border-gray-200'
            } ${cat.color}`}
          >
            <span className="text-xl">{cat.emoji}</span>
            <p className="text-sm font-semibold text-foreground mt-1">{cat.label}</p>
            <p className="text-xs text-muted-foreground">{cat.range}</p>
          </button>
        ))}
      </div>

      {/* Summary */}
      {wizardData.budget > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-[#2EC4B6]/5 to-[#FFBA49]/5 border border-[#2EC4B6]/20">
          <Wallet className="size-5 text-[#2EC4B6]" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {currencySymbol(wizardData.currency)}{wizardData.budget.toLocaleString()} {wizardData.currency}
            </p>
            <p className="text-xs text-muted-foreground">{category.label} trip</p>
          </div>
        </div>
      )}
    </div>
  )
}
