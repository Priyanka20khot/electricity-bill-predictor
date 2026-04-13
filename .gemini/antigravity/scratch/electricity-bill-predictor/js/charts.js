// Chart.js wrappers for the app
let pieChart = null;
let lineChart = null;

export function renderPieChart(canvasId, appliances) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  if (pieChart) pieChart.destroy();

  const labels = appliances.map(a => a.name);
  const data   = appliances.map(a => Math.round((a.watts * a.hours * a.days * a.qty) / 1000 * 10) / 10);
  const colors = [
    '#f5c518','#4f8ef7','#10b981','#7c3aed','#f97316',
    '#00d4ff','#ef4444','#ec4899','#84cc16','#06b6d4',
    '#a78bfa','#fb923c','#34d399','#60a5fa','#f472b6','#facc15'
  ];

  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: '#0a0e1a',
        borderWidth: 3,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#8b9dc3',
            font: { family: 'Inter', size: 12 },
            padding: 12,
            boxWidth: 14,
            borderRadius: 3
          }
        },
        tooltip: {
          backgroundColor: '#131d35',
          titleColor: '#f0f4ff',
          bodyColor: '#8b9dc3',
          borderColor: '#1e2d4e',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ${ctx.parsed} kWh (${Math.round(ctx.parsed / data.reduce((a,b)=>a+b,0)*100)}%)`
          }
        }
      }
    }
  });
}

export function renderLineChart(canvasId, records) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  if (lineChart) lineChart.destroy();

  const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sorted.map(r => new Date(r.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
  const billData = sorted.map(r => r.bill);
  const unitData = sorted.map(r => r.units);

  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Bill (₹)',
          data: billData,
          borderColor: '#f5c518',
          backgroundColor: 'rgba(245,197,24,0.08)',
          pointBackgroundColor: '#f5c518',
          pointRadius: 5,
          tension: 0.4,
          fill: true,
          yAxisID: 'y'
        },
        {
          label: 'Units (kWh)',
          data: unitData,
          borderColor: '#4f8ef7',
          backgroundColor: 'rgba(79,142,247,0.06)',
          pointBackgroundColor: '#4f8ef7',
          pointRadius: 5,
          tension: 0.4,
          fill: true,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: {
            color: '#8b9dc3',
            font: { family: 'Inter', size: 12 },
            boxWidth: 14, borderRadius: 3
          }
        },
        tooltip: {
          backgroundColor: '#131d35',
          titleColor: '#f0f4ff',
          bodyColor: '#8b9dc3',
          borderColor: '#1e2d4e',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(30,45,78,0.6)' },
          ticks: { color: '#4a5680', font: { family:'Inter', size:12 } }
        },
        y: {
          position: 'left',
          grid: { color: 'rgba(30,45,78,0.6)' },
          ticks: { color: '#f5c518', font: { family:'Inter', size:12 }, callback: v => '₹'+v }
        },
        y1: {
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: '#4f8ef7', font: { family:'Inter', size:12 }, callback: v => v+'kWh' }
        }
      }
    }
  });
}
