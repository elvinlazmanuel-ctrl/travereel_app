'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Heart, Users, Baby, Plus, X, Mail, UserPlus, Search } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import type { Companion } from '@/lib/store'

interface SearchResult {
  id: string
  username: string
  name: string
  avatar: string | null
  bio: string | null
}

const travelTypes = [
  {
    id: 'solo',
    label: 'Solo',
    description: 'Just me exploring',
    icon: User,
    count: '1 person',
    color: 'from-[#2F5C9B] to-[#5CA5CD]',
    bgColor: 'bg-[#2F5C9B]/10',
    borderColor: 'border-[#2F5C9B]',
  },
  {
    id: 'couple',
    label: 'Couple',
    description: 'With my partner',
    icon: Heart,
    count: '2 people',
    color: 'from-[#5CA5CD] to-[#E58BEA]',
    bgColor: 'bg-[#5CA5CD]/10',
    borderColor: 'border-[#5CA5CD]',
  },
  {
    id: 'group',
    label: 'Group',
    description: 'Friends together',
    icon: Users,
    count: '3-10 people',
    color: 'from-[#5CA5CD] to-[#E58BEA]',
    bgColor: 'bg-[#5CA5CD]/10',
    borderColor: 'border-[#5CA5CD]',
  },
  {
    id: 'family',
    label: 'Family',
    description: 'Family adventure',
    icon: Baby,
    count: '2+ people',
    color: 'from-[#E58BEA] to-[#2F5C9B]',
    bgColor: 'bg-[#E58BEA]/10',
    borderColor: 'border-[#E58BEA]',
  },
]

export default function StepTravelType() {
  const { wizardData, setWizardData, currentUser } = useAppStore()
  const [companionName, setCompanionName] = useState('')
  const [companionEmail, setCompanionEmail] = useState('')
  
  // AJAX search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const selectedType = wizardData.travelType
  const companions = wizardData.companions
  const needsCompanions = selectedType !== 'solo'

  // Debounced search - triggers after 300ms of no typing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    setShowSearchResults(true)

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Get auth token
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
        
        const response = await fetch(`/api/users/search?query=${encodeURIComponent(searchQuery)}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        })

        if (response.ok) {
          const data = await response.json()
          setSearchResults(data.users || [])
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300) // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectType = (typeId: string) => {
    setWizardData({ travelType: typeId })
  }

  const handleSelectUser = (user: SearchResult) => {
    // Check if user is already added
    const alreadyAdded = companions.some(c => c.userId === user.id)
    if (alreadyAdded) {
      return
    }

    const newCompanion: Companion = {
      id: `comp-${user.id}`,
      name: user.name || user.username,
      email: null,
      userId: user.id,
    }
    setWizardData({ companions: [...companions, newCompanion] })
    setSearchQuery('')
    setSearchResults([])
    setShowSearchResults(false)
  }

  const handleAddCompanion = () => {
    if (!companionName.trim()) return
    
    // Check if name matches a searched user
    const matchedUser = searchResults.find(
      u => (u.username.toLowerCase() === companionName.trim().toLowerCase()) ||
           (u.name?.toLowerCase() === companionName.trim().toLowerCase())
    )

    if (matchedUser) {
      handleSelectUser(matchedUser)
      return
    }

    // Add as manual companion (not linked to user account)
    const newCompanion: Companion = {
      id: `comp-${Date.now()}`,
      name: companionName.trim(),
      email: companionEmail.trim() || null,
      userId: null,
    }
    setWizardData({ companions: [...companions, newCompanion] })
    setCompanionName('')
    setCompanionEmail('')
  }

  const handleRemoveCompanion = (id: string) => {
    setWizardData({ companions: companions.filter((c) => c.id !== id) })
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          Who are you traveling with?
        </h2>
        <p className="text-sm text-muted-foreground">
          Select your travel style
        </p>
      </div>

      {/* Travel Type Cards */}
      <div className="grid grid-cols-2 gap-3">
        {travelTypes.map((type) => {
          const Icon = type.icon
          const isSelected = selectedType === type.id
          return (
            <motion.button
              key={type.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelectType(type.id)}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? `${type.borderColor} ${type.bgColor} shadow-sm`
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div
                className={`size-10 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center mb-3`}
              >
                <Icon className="size-5 text-white" />
              </div>
              <p className="text-sm font-bold text-foreground">{type.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
              <p className="text-[10px] text-gray-400 mt-1">{type.count}</p>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 size-5 rounded-full bg-gradient-to-r from-[#2F5C9B] to-[#5CA5CD] flex items-center justify-center"
                >
                  <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Companion Input (if not solo) */}
      <AnimatePresence>
        {needsCompanions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-2">
              {/* Tag instruction */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#5CA5CD]/5 border border-[#5CA5CD]/20">
                <UserPlus className="size-4 text-[#5CA5CD] shrink-0" />
                <p className="text-xs text-gray-600">
                  Tag your companions so they can view and collaborate on the itinerary
                </p>
              </div>

              {/* Companion Form */}
              <div className="space-y-2">
                {/* AJAX Search Input */}
                <div className="relative" ref={searchRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    placeholder="Search by username or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  
                  {/* Search Results Dropdown */}
                  <AnimatePresence>
                    {showSearchResults && searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50"
                      >
                        {searchResults.map((user) => {
                          const alreadyAdded = companions.some(c => c.userId === user.id)
                          return (
                            <button
                              key={user.id}
                              onClick={() => !alreadyAdded && handleSelectUser(user)}
                              disabled={alreadyAdded}
                              className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                                alreadyAdded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                              }`}
                            >
                              <div className="size-10 rounded-full bg-gradient-to-br from-[#2F5C9B] to-[#5CA5CD] flex items-center justify-center shrink-0">
                                <span className="text-sm font-bold text-white">
                                  {(user.name || user.username).charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-semibold text-foreground truncate">
                                  @{user.username}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {user.name}
                                </p>
                              </div>
                              {alreadyAdded && (
                                <span className="text-xs text-muted-foreground">Added</span>
                              )}
                            </button>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Loading indicator */}
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="size-4 border-2 border-gray-300 border-t-[#5CA5CD] rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Manual Add Form */}
                <div className="space-y-2">
                  <Input
                    placeholder="Or add manually - Name"
                    value={companionName}
                    onChange={(e) => setCompanionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && companionName.trim()) handleAddCompanion()
                    }}
                  />
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        placeholder="Email (optional)"
                        value={companionEmail}
                        onChange={(e) => setCompanionEmail(e.target.value)}
                        className="pl-10"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && companionName.trim()) handleAddCompanion()
                        }}
                      />
                    </div>
                    <Button
                      onClick={handleAddCompanion}
                      disabled={!companionName.trim()}
                      size="icon"
                      className="bg-[#5CA5CD] hover:bg-[#5CA5CD]/90 text-white shrink-0"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Companions List */}
              {companions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Added Companions ({companions.length})
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {companions.map((c) => (
                      <motion.div
                        key={c.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 20, opacity: 0 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                      >
                        <div className="size-8 rounded-full bg-gradient-to-br from-[#2F5C9B] to-[#5CA5CD] flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {c.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                          {c.email && (
                            <p className="text-xs text-gray-400 truncate">{c.email}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveCompanion(c.id)}
                          className="p-1 rounded-full hover:bg-red-50 transition-colors"
                          aria-label={`Remove ${c.name}`}
                        >
                          <X className="size-4 text-gray-400 hover:text-[#2F5C9B]" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {companions.length === 0 && needsCompanions && (
                <p className="text-xs text-amber-600 text-center">
                  Add at least one companion for your {selectedType} trip
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }
      `}</style>
    </div>
  )
}
