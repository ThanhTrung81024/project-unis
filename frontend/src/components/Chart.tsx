import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ChartProps {
  data: any[]
  type?: 'line' | 'bar'
  xKey: string
  yKey: string
  title?: string
  height?: number
  color?: string
}

export const Chart = ({
  data,
  type = 'line',
  xKey,
  yKey,
  title,
  height = 300,
  color = '#3b82f6',
}: ChartProps) => {
  const ChartComponent = type === 'line' ? LineChart : BarChart

  return (
    <div>
      {title && (
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={xKey} 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              if (typeof value === 'string' && value.includes('T')) {
                return new Date(value).toLocaleDateString()
              }
              return value
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            labelFormatter={(value) => {
              if (typeof value === 'string' && value.includes('T')) {
                return new Date(value).toLocaleDateString()
              }
              return value
            }}
          />
          <Legend />
          {type === 'line' ? (
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
            />
          ) : (
            <Bar dataKey={yKey} fill={color} />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}