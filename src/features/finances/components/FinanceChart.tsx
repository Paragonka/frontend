import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { FinanceMonthly } from '../types'

interface FinanceChartProps {
  data: FinanceMonthly[]
}

export function FinanceChart({ data }: FinanceChartProps) {
  const { t } = useTranslation()

  return (
    <div data-testid="finance-chart" className="h-80 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minHeight={200}
        initialDimension={{ width: 520, height: 320 }}
      >
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="revenue" fill="#22c55e" name={t('Revenue')} />
          <Bar dataKey="expenses" fill="#ef4444" name={t('Expenses')} />
          <Bar dataKey="pnl" fill="#3b82f6" name={t('Profit / Loss')} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
