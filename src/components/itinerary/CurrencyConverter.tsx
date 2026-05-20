'use client'

import { useState, useEffect } from 'react'
import { ArrowLeftRight, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getStoredLocation, detectUserLocation, storeDetectedLocation } from '@/lib/user-location'

const popularCurrencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
]

// Fallback exchange rates (approximate, would normally come from API)
const fallbackRates: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.50, PHP: 55.80,
  THB: 34.20, KRW: 1320.50, AUD: 1.53, CAD: 1.36, SGD: 1.34,
  INR: 83.12, IDR: 15650, VND: 24350, AED: 3.67, NZD: 1.63,
  CHF: 0.88, SEK: 10.45, NOK: 10.52, BRL: 4.95, MXN: 17.15,
}

interface CurrencyConverterProps {
  defaultFrom?: string
  defaultTo?: string
  defaultAmount?: number
}

export function CurrencyConverter({ 
  defaultFrom, 
  defaultTo,
  defaultAmount = 100 
}: CurrencyConverterProps) {
  // Get detected currency from location
  const [initialFrom, setInitialFrom] = useState(defaultFrom || 'USD')
  const [initialTo, setInitialTo] = useState(defaultTo || 'EUR')
  
  // Detect user location to set default currency
  useEffect(() => {
    const detectCurrency = async () => {
      const stored = getStoredLocation()
      if (stored && stored.currency) {
        setInitialFrom(stored.currency)
        return
      }
      
      // Detect location if not stored
      const location = await detectUserLocation()
      if (location && location.currency) {
        setInitialFrom(location.currency)
        storeDetectedLocation(location)
      }
    }
    
    if (!defaultFrom) {
      detectCurrency()
    }
  }, [defaultFrom])
  
  const [fromCurrency, setFromCurrency] = useState(initialFrom)
  const [toCurrency, setToCurrency] = useState(initialTo)
  const [amount, setAmount] = useState(defaultAmount)
  const [rates, setRates] = useState<Record<string, number>>(fallbackRates)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Fetch live rates (optional - uses fallback if fails)
  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true)
      try {
        // Using exchangerate-api (free tier: 1500 requests/month)
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
        if (response.ok) {
          const data = await response.json()
          setRates(data.rates)
          setLastUpdated(new Date())
        }
      } catch (error) {
        console.log('Using fallback exchange rates')
      } finally {
        setLoading(false)
      }
    }

    fetchRates()
    // Refresh rates every 5 minutes
    const interval = setInterval(fetchRates, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Calculate converted amount
  const convert = (amount: number, from: string, to: string): number => {
    const fromRate = rates[from] || 1
    const toRate = rates[to] || 1
    // Convert through USD as base
    const inUSD = amount / fromRate
    return inUSD * toRate
  }

  const convertedAmount = convert(amount, fromCurrency, toCurrency)
  const rate = convert(1, fromCurrency, toCurrency)

  // Swap currencies
  const handleSwap = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  const fromSymbol = popularCurrencies.find(c => c.code === fromCurrency)?.symbol || fromCurrency
  const toSymbol = popularCurrencies.find(c => c.code === toCurrency)?.symbol || toCurrency

  return (
    <div className="space-y-4">
      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
            {fromSymbol}
          </span>
          <Input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="pl-10 h-12 text-lg font-semibold"
          />
        </div>
      </div>

      {/* Currency Selectors */}
      <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-end">
        {/* From Currency */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            From
          </label>
          <Select value={fromCurrency} onValueChange={setFromCurrency}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {popularCurrencies.map((currency) => (
                <SelectItem key={`from-${currency.code}`} value={currency.code}>
                  <span className="flex items-center gap-2">
                    <span>{currency.flag}</span>
                    <span className="font-medium">{currency.code}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          className="p-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors mb-0.5"
          aria-label="Swap currencies"
        >
          <ArrowLeftRight className="size-4 text-gray-600" />
        </button>

        {/* To Currency */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            To
          </label>
          <Select value={toCurrency} onValueChange={setToCurrency}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {popularCurrencies.map((currency) => (
                <SelectItem key={`to-${currency.code}`} value={currency.code}>
                  <span className="flex items-center gap-2">
                    <span>{currency.flag}</span>
                    <span className="font-medium">{currency.code}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Result */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#5CA5CD]/5 to-[#E58BEA]/5 border border-[#5CA5CD]/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Converted Amount</p>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? (
                <Loader2 className="size-6 animate-spin text-gray-400" />
              ) : (
                `${toSymbol}${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Exchange Rate</p>
            <p className="text-sm font-semibold text-gray-700">
              1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
            </p>
          </div>
        </div>
        {lastUpdated && (
          <p className="text-[10px] text-gray-400 mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Quick Amounts */}
      <div className="flex flex-wrap gap-2">
        {[10, 50, 100, 500, 1000].map((quickAmount) => (
          <button
            key={quickAmount}
            onClick={() => setAmount(quickAmount)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              amount === quickAmount
                ? 'bg-[#2F5C9B] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {fromSymbol}{quickAmount}
          </button>
        ))}
      </div>
    </div>
  )
}
