import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  TooltipItem
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Transaction {
  amount: number;
  type: 'expense' | 'income';
  envelopes?: { name: string };
}

interface TransactionChartProps {
  transactions: Transaction[];
}

export default function TransactionChart({ transactions }: TransactionChartProps) {
  // Group expenses by envelope
  const expensesByEnvelope = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const category = t.envelopes?.name || 'Other';
      acc[category] = (acc[category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  // Calculate total income
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const data: ChartData<'bar'> = {
    labels: ['Money Flow'],
    datasets: [
      {
        label: 'Income',
        data: [totalIncome],
        backgroundColor: '#22c55e',
        borderRadius: 6,
      },
      ...Object.entries(expensesByEnvelope).map(([category, amount], index) => ({
        label: category,
        data: [amount],
        backgroundColor: `hsl(0, 75%, ${70 - (index * 5)}%)`,
        borderRadius: 6,
      }))
    ]
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: false,
        grid: { display: false },
      },
      y: {
        stacked: true,
        display: false,
      }
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { 
          boxWidth: 8,
          padding: 8,
          font: { size: 11 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP'
            }).format(context.raw as number);
            return label;
          }
        }
      }
    }
  };

  return <Bar data={data} options={options} />;
}