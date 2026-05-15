'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  Download,
  Wallet,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  Users,
  Receipt,
  ChevronDown,
  ChevronUp,
  X,
  Lock,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAppStore, type BudgetItem } from '@/lib/store'
import { toast } from 'sonner'

// Category colors - warm theme
const CATEGORY_COLORS: Record<string, string> = {
  Accommodation: '#FF6B6B',
  Food: '#FF8C42',
  Transport: '#FFBA49',
  Activities: '#2EC4B6',
  Shopping: '#E879A8',
  Other: '#A78BFA',
}

const CATEGORIES = ['Accommodation', 'Food', 'Transport', 'Activities', 'Shopping', 'Other']

const CATEGORY_ICONS: Record<string, string> = {
  Accommodation: '🏨',
  Food: '🍽️',
  Transport: '🚗',
  Activities: '🎯',
  Shopping: '🛍️',
  Other: '📦',
}

type SplitType = 'equal' | 'custom' | 'percentage'

interface Settlement {
  from: string
  to: string
  amount: number
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default function BudgetTracker() {
  const { selectedItinerary, currentUser, setSelectedItinerary } = useAppStore()
  const isOwner = currentUser?.id === selectedItinerary?.authorId
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formCategory, setFormCategory] = useState('Food')
  const [formPaidBy, setFormPaidBy] = useState('')
  const [formSplitType, setFormSplitType] = useState<SplitType>('equal')
  const [formSplitAmong, setFormSplitAmong] = useState<string[]>([])
  const [formCustomAmounts, setFormCustomAmounts] = useState<Record<string, string>>({})
  const [formPercentages, setFormPercentages] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get all travelers (user + companions)
  const travelers = useMemo(() => {
    const people: { id: string; name: string }[] = []
    if (currentUser) {
      people.push({ id: currentUser.id, name: 'You' })
    }
    if (selectedItinerary?.companions) {
      selectedItinerary.companions.forEach((c) => {
        people.push({ id: c.id, name: c.name })
      })
    }
    return people
  }, [currentUser, selectedItinerary])

  // Initialize form defaults
  useEffect(() => {
    if (travelers.length > 0 && !formPaidBy) {
      setFormPaidBy(travelers[0].id)
    }
    if (formSplitAmong.length === 0) {
      setFormSplitAmong(travelers.map((t) => t.id))
    }
  }, [travelers, formPaidBy, formSplitAmong.length])

  // Fetch budget items
  const fetchBudgetItems = useCallback(async () => {
    if (!selectedItinerary) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/budget?itineraryId=${selectedItinerary.id}`)
      if (res.ok) {
        const data = await res.json()
        setBudgetItems(data.budgetItems || [])
      }
    } catch (err) {
      console.error('Failed to fetch budget items:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedItinerary])

  useEffect(() => {
    fetchBudgetItems()
  }, [fetchBudgetItems])

  // Calculations
  const totalBudget = selectedItinerary?.budget || 0
  const currency = selectedItinerary?.currency || 'USD'
  const totalSpent = budgetItems.reduce((sum, item) => sum + item.amount, 0)
  const remaining = totalBudget - totalSpent
  const spentPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0

  // Category breakdown for pie chart
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {}
    budgetItems.forEach((item) => {
      map[item.category] = (map[item.category] || 0) + item.amount
    })
    return Object.entries(map).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS.Other,
    }))
  }, [budgetItems])

  // Grouped items by category
  const groupedItems = useMemo(() => {
    const map: Record<string, BudgetItem[]> = {}
    budgetItems.forEach((item) => {
      if (!map[item.category]) map[item.category] = []
      map[item.category].push(item)
    })
    return map
  }, [budgetItems])

  // Per-person breakdown
  const perPersonBreakdown = useMemo(() => {
    const map: Record<string, { paid: number; share: number }> = {}
    travelers.forEach((t) => {
      map[t.id] = { paid: 0, share: 0 }
    })
    budgetItems.forEach((item) => {
      // Who paid
      if (map[item.paidBy]) {
        map[item.paidBy].paid += item.amount
      }
      // Who owes what
      const splitPeople = item.splitAmong.length > 0 ? item.splitAmong : travelers.map((t) => t.id)
      const perPerson = item.amount / splitPeople.length
      splitPeople.forEach((personId) => {
        if (map[personId]) {
          map[personId].share += perPerson
        }
      })
    })
    return travelers.map((t) => ({
      ...t,
      paid: Math.round((map[t.id]?.paid || 0) * 100) / 100,
      share: Math.round((map[t.id]?.share || 0) * 100) / 100,
      balance: Math.round(((map[t.id]?.paid || 0) - (map[t.id]?.share || 0)) * 100) / 100,
    }))
  }, [budgetItems, travelers])

  // Settlement calculations
  const settlements = useMemo(() => {
    const result: Settlement[] = []
    const balances = perPersonBreakdown.filter((p) => Math.abs(p.balance) > 0.01)

    const debtors = balances.filter((p) => p.balance < 0).sort((a, b) => a.balance - b.balance)
    const creditors = balances.filter((p) => p.balance > 0).sort((a, b) => b.balance - a.balance)

    let di = 0
    let ci = 0
    while (di < debtors.length && ci < creditors.length) {
      const debt = Math.abs(debtors[di].balance)
      const credit = creditors[ci].balance
      const amount = Math.min(debt, credit)

      if (amount > 0.01) {
        result.push({
          from: debtors[di].name,
          to: creditors[ci].name,
          amount: Math.round(amount * 100) / 100,
        })
      }

      debtors[di].balance += amount
      creditors[ci].balance -= amount

      if (Math.abs(debtors[di].balance) < 0.01) di++
      if (Math.abs(creditors[ci].balance) < 0.01) ci++
    }

    return result
  }, [perPersonBreakdown])

  // Get traveler name by ID
  const getTravelerName = (id: string) => {
    const t = travelers.find((t) => t.id === id)
    return t ? t.name : id
  }

  // Toggle split among
  const toggleSplitPerson = (personId: string) => {
    setFormSplitAmong((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
    )
  }

  // Reset form
  const resetForm = () => {
    setFormName('')
    setFormAmount('')
    setFormCategory('Food')
    setFormPaidBy(travelers[0]?.id || '')
    setFormSplitType('equal')
    setFormSplitAmong(travelers.map((t) => t.id))
    setFormCustomAmounts({})
    setFormPercentages({})
  }

  // Add expense
  const handleAddExpense = async () => {
    if (!formName.trim() || !formAmount || !selectedItinerary || !currentUser) return
    if (!isOwner) return
    setIsSubmitting(true)
    try {
      const amount = parseFloat(formAmount)
      let splitAmong = formSplitAmong

      if (formSplitType === 'custom') {
        // Filter to only those with custom amounts > 0
        splitAmong = Object.entries(formCustomAmounts)
          .filter(([, val]) => parseFloat(val) > 0)
          .map(([id]) => id)
      } else if (formSplitType === 'percentage') {
        splitAmong = Object.entries(formPercentages)
          .filter(([, val]) => parseFloat(val) > 0)
          .map(([id]) => id)
      }

      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          amount,
          category: formCategory,
          paidBy: formPaidBy,
          splitAmong,
          itineraryId: selectedItinerary.id,
          userId: currentUser.id,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setBudgetItems((prev) => [data.budgetItem, ...prev])
        // Update store itinerary
        if (selectedItinerary) {
          setSelectedItinerary({
            ...selectedItinerary,
            budgetItems: [...budgetItems, data.budgetItem],
          })
        }
        resetForm()
        setIsSheetOpen(false)
      }
    } catch (err) {
      console.error('Failed to add expense:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete expense
  const handleDeleteExpense = async (itemId: string) => {
    if (!currentUser || !isOwner) return
    try {
      const res = await fetch(`/api/budget?id=${itemId}&userId=${currentUser.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setBudgetItems((prev) => prev.filter((item) => item.id !== itemId))
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete expense')
      }
    } catch (err) {
      console.error('Failed to delete expense:', err)
      toast.error('Failed to delete expense')
    }
  }

  // Export budget data
  const handleExport = () => {
    const csvRows = ['Category,Name,Amount,Paid By,Split Among']
    budgetItems.forEach((item) => {
      csvRows.push(
        `${item.category},${item.name},${item.amount},${getTravelerName(item.paidBy)},${item.splitAmong.map(getTravelerName).join(' & ')}`
      )
    })
    csvRows.push(`\nTotal,,${totalSpent},,`)
    csvRows.push(`Budget,,${totalBudget},,`)
    csvRows.push(`Remaining,,${remaining},,`)

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget-${selectedItinerary?.title || 'trip'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Progress bar color based on spending
  const getProgressColor = () => {
    if (spentPercentage >= 90) return 'bg-[#FF6B6B]'
    if (spentPercentage >= 70) return 'bg-[#FF8C42]'
    if (spentPercentage >= 50) return 'bg-[#FFBA49]'
    return 'bg-[#2EC4B6]'
  }

  if (!selectedItinerary) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <Wallet className="size-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground">No Itinerary Selected</h3>
        <p className="text-sm text-muted-foreground mt-1">Select an itinerary to view its budget tracker.</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-5 pb-6">
      {/* Read-only indicator for non-owners */}
      {!isOwner && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
          <Lock className="size-3.5 text-gray-400" />
          <span className="text-xs text-muted-foreground">View only — only the trip organizer can edit expenses</span>
        </div>
      )}
      {/* Overview Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49] p-5 text-white shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-white/80">Total Budget</p>
            <p className="text-3xl font-bold mt-0.5">{formatCurrency(totalBudget, currency)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={handleExport}
          >
            <Download className="size-5" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${spentPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${getProgressColor()}`}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/70">Spent</p>
            <p className="text-sm font-semibold">{formatCurrency(totalSpent, currency)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/70">Remaining</p>
            <p className="text-sm font-semibold">{formatCurrency(remaining, currency)}</p>
          </div>
        </div>
      </motion.div>

      {/* Per-person breakdown */}
      {travelers.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="size-4 text-[#FF8C42]" />
                Per-Person Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-3">
                {perPersonBreakdown.map((person) => (
                  <div key={person.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{person.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Paid: {formatCurrency(person.paid, currency)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          person.balance > 0
                            ? 'text-emerald-600'
                            : person.balance < 0
                              ? 'text-[#FF6B6B]'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {person.balance > 0 ? '+' : ''}
                        {formatCurrency(person.balance, currency)}
                      </p>
                      <p className="text-xs text-gray-400">balance</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Expense Categories Pie Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Receipt className="size-4 text-[#FFBA49]" />
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {categoryData.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="w-36 h-36 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value, currency)}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5">
                  {categoryData.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="size-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-xs text-gray-600">
                          {CATEGORY_ICONS[cat.name]} {cat.name}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {formatCurrency(cat.value, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <TrendingDown className="size-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No expenses yet</p>
                <p className="text-xs text-gray-400">Add your first expense to see the breakdown</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Expense List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Receipt className="size-4 text-[#2EC4B6]" />
              Expenses
              <Badge variant="secondary" className="ml-auto text-xs bg-gray-100 text-gray-600">
                {budgetItems.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : budgetItems.length === 0 ? (
              <div className="py-6 text-center">
                <Receipt className="size-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No expenses recorded</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                {Object.entries(groupedItems).map(([category, items]) => {
                  const categoryTotal = items.reduce((sum, item) => sum + item.amount, 0)
                  const isExpanded = expandedCategory === category

                  return (
                    <div key={category} className="rounded-lg border border-gray-100 overflow-hidden">
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : category)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="size-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: CATEGORY_COLORS[category] || CATEGORY_COLORS.Other }}
                          />
                          <span className="text-sm font-medium text-foreground">
                            {CATEGORY_ICONS[category]} {category}
                          </span>
                          <Badge variant="secondary" className="text-[10px] bg-gray-100 text-muted-foreground h-4 px-1">
                            {items.length}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {formatCurrency(categoryTotal, currency)}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="size-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="size-4 text-gray-400" />
                          )}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between px-3 py-2 border-t border-gray-50 hover:bg-gray-50/50 group"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-foreground truncate">{item.name}</p>
                                  <p className="text-xs text-gray-400">
                                    Paid by {getTravelerName(item.paidBy)}
                                    {item.splitAmong.length > 0 &&
                                      ` · Split ${item.splitAmong.length} ways`}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                  <span className="text-sm font-medium text-foreground">
                                    {formatCurrency(item.amount, currency)}
                                  </span>
                                  {isOwner && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-[#FF6B6B]"
                                      onClick={() => handleDeleteExpense(item.id)}
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Settlements */}
      {settlements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ArrowRight className="size-4 text-[#FF6B6B]" />
                Settle Up
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {settlements.map((settlement, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="size-7 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center text-xs font-medium text-[#FF6B6B] flex-shrink-0">
                        {settlement.from.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">
                          <span className="font-medium">{settlement.from}</span>
                          <span className="text-gray-400"> owes </span>
                          <span className="font-medium">{settlement.to}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-sm font-semibold text-[#FF6B6B]">
                        {formatCurrency(settlement.amount, currency)}
                      </span>
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white px-2.5"
                        onClick={() => {
                          toast.success(`Settlement of ${formatCurrency(settlement.amount, currency)} marked as settled`)
                        }}
                      >
                        <CheckCircle2 className="size-3 mr-1" />
                        Settle
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Floating Add Button - only visible to itinerary owner */}
      {isOwner && (
      <Sheet open={isSheetOpen} onOpenChange={(open) => {
        setIsSheetOpen(open)
        if (!open) resetForm()
      }}>
        <SheetTrigger asChild>
          <motion.div
            className="fixed bottom-20 right-4 z-30"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
          >
            <Button
              className="size-14 rounded-full shadow-lg bg-gradient-to-br from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49] hover:opacity-90 text-white"
              size="icon"
            >
              <Plus className="size-6" />
            </Button>
          </motion.div>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-left">Add Expense</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 px-1 pb-6">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Expense Name</Label>
              <Input
                placeholder="e.g., Dinner at restaurant"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Amount + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_ICONS[cat]} {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Paid By */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Paid By</Label>
              <Select value={formPaidBy} onValueChange={setFormPaidBy}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {travelers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Split Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Split Type</Label>
              <div className="flex gap-1.5">
                {(['equal', 'custom', 'percentage'] as SplitType[]).map((type) => (
                  <Button
                    key={type}
                    variant={formSplitType === type ? 'default' : 'outline'}
                    size="sm"
                    className={`flex-1 text-xs h-8 capitalize ${
                      formSplitType === type
                        ? 'bg-[#FF8C42] hover:bg-[#FF8C42]/90 text-white'
                        : 'border-gray-200 text-gray-600'
                    }`}
                    onClick={() => setFormSplitType(type)}
                  >
                    {type === 'equal' ? 'Equal' : type === 'custom' ? 'Custom' : '%'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Split Among */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-foreground">Split Among</Label>
              <div className="space-y-2">
                {travelers.map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <Checkbox
                      checked={formSplitAmong.includes(t.id)}
                      onCheckedChange={() => toggleSplitPerson(t.id)}
                      className="data-[state=checked]:bg-[#2EC4B6] data-[state=checked]:border-[#2EC4B6]"
                    />
                    <span className="text-sm text-foreground flex-1">{t.name}</span>
                    {formSplitType === 'custom' && formSplitAmong.includes(t.id) && (
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={formCustomAmounts[t.id] || ''}
                        onChange={(e) =>
                          setFormCustomAmounts((prev) => ({ ...prev, [t.id]: e.target.value }))
                        }
                        className="w-24 h-8 text-xs"
                      />
                    )}
                    {formSplitType === 'percentage' && formSplitAmong.includes(t.id) && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          placeholder="0"
                          value={formPercentages[t.id] || ''}
                          onChange={(e) =>
                            setFormPercentages((prev) => ({ ...prev, [t.id]: e.target.value }))
                          }
                          className="w-16 h-8 text-xs"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add Button */}
            <Button
              className="w-full h-11 bg-gradient-to-r from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49] hover:opacity-90 text-white font-semibold"
              onClick={handleAddExpense}
              disabled={!formName.trim() || !formAmount || isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Expense'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      )}
    </div>
  )
}
