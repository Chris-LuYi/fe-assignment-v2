import { useState } from 'react'
import { SegmentSwitch } from '../../components/SegmentSwitch'
import type { Segment } from '../../api/types'
import { AccountList } from './AccountList'
import { BalanceHero } from './BalanceHero'
import { DailyLimitCard } from './DailyLimitCard'
import { DashboardError } from './DashboardError'
import { DashboardSkeleton } from './DashboardSkeleton'
import { TransferDialog } from '../transfer/TransferDialog'
import { TransactionList } from './TransactionList'
import { useDashboardData } from './useDashboardData'

interface DashboardProps {
  segment: Segment
  onSegmentChange: (segment: Segment) => void
}

export function Dashboard({ segment, onSegmentChange }: DashboardProps) {
  const data = useDashboardData()
  const [transferOpen, setTransferOpen] = useState(false)

  if (data.status === 'pending') return <DashboardSkeleton />
  if (data.status === 'error') return <DashboardError onRetry={data.retry} />

  const { customer, accounts, transactions } = data
  return (
    <div className="dashboard">
      <div className="dashboard__main">
        <div className="greeting">
          <h1 className="greeting__title">Good evening, {customer.firstName}</h1>
          {/* On mobile the header has no room for the switch, so it sits here. */}
          <SegmentSwitch
            className="greeting__segment"
            value={segment}
            onChange={onSegmentChange}
          />
        </div>
        <BalanceHero accounts={accounts} onNewTransfer={() => setTransferOpen(true)} />
        <AccountList accounts={accounts} />
        <TransactionList transactions={transactions} />
      </div>
      <aside className="dashboard__rail" aria-label="Transfer limits">
        <DailyLimitCard customer={customer} />
      </aside>

      {transferOpen && (
        <TransferDialog
          accounts={accounts}
          customer={customer}
          onClose={() => setTransferOpen(false)}
        />
      )}
    </div>
  )
}
