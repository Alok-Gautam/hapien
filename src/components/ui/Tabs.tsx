'use client'

import { useState, createContext, useContext, ReactNode, useEffect } from 'react'
import { cn } from '@/utils/helpers'

interface TabsContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextType | null>(null)

function useTabs() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider')
  }
  return context
}

export interface TabsProps {
  defaultValue?: string
  value?: string
  children: ReactNode
  className?: string
  onChange?: (value: string) => void
  onValueChange?: (value: string) => void
}

export function Tabs({ defaultValue, value, children, className, onChange, onValueChange }: TabsProps) {
  const [internalTab, setInternalTab] = useState(value || defaultValue || '')
  
  // Support controlled mode
  const activeTab = value !== undefined ? value : internalTab

  useEffect(() => {
    if (value !== undefined) {
      setInternalTab(value)
    }
  }, [value])

  const handleTabChange = (tab: string) => {
    if (value === undefined) {
      setInternalTab(tab)
    }
    onChange?.(tab)
    onValueChange?.(tab)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: ReactNode
  className?: string
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1 bg-neutral-100 rounded-xl',
        className
      )}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabs()
  const isActive = activeTab === value

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
        isActive
          ? 'bg-white text-primary-600 shadow-sm'
          : 'text-neutral-600 hover:text-neutral-900',
        className
      )}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { activeTab } = useTabs()

  if (activeTab !== value) return null

  return (
    <div className={cn('animate-fade-in', className)}>
      {children}
    </div>
  )
}
