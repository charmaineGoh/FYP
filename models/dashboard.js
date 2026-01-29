let salesChart;

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    fetchDashboardData(); // Load initial data

    // Filter Button Click
    document.getElementById('filter-btn').addEventListener('click', () => {
        const start = document.getElementById('start-date').value;
        const end = document.getElementById('end-date').value;
        fetchDashboardData(start, end);
    });
});

async function fetchDashboardData(startDate = '', endDate = '') {
    try {
        // Call new API route
        let url = `/stocks/dashboard/stats`;
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        // 1. Update Cards
        document.getElementById('total-stock').innerText = data.totalStock;
        document.getElementById('inbound-stocks').innerText = data.inboundCount;
        // Update sub-text
        document.querySelector('.card-info').innerText = `Units across ${data.locationCount} locations`;

        // 2. Update Table
        const tableBody = document.getElementById('transaction-body');
        tableBody.innerHTML = '';
        data.rawData.forEach(item => {
            tableBody.innerHTML += `
                <tr>
                    <td>${new Date(item.lastUpdated).toLocaleDateString()}</td>
                    <td>${item.stockId}</td>
                    <td>${item.quantity}</td>
                    <td>${item.warehouseLocation}</td>
                </tr>
            `;
        });

        // 3. Update Chart
        updateChart(data.rawData);

    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

function initChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    salesChart = new Chart(ctx, {
        type: 'bar', 
        data: {
            labels: [],
            datasets: [{
                label: 'Stock Quantity',
                data: [],
                backgroundColor: '#A39BBE',
                borderRadius: 5
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function updateChart(stocks) {
    // Map data for the chart: labels = Stock IDs, data = Quantities
    salesChart.data.labels = stocks.map(s => s.stockId);
    salesChart.data.datasets[0].data = stocks.map(s => s.quantity);
    salesChart.update();
}
