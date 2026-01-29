
const { jsPDF } = window.jspdf;

// Get references to the HTML elements
const downloadBtn = document.getElementById('download-btn');
const downloadExcelBtn = document.getElementById('download-excel-btn');
const mainContent = document.getElementById('main-content');

let shirtsChart;
let pantsChart;
let accessoriesChart;

// Profile dropdown functionality
function initializeProfile() {
  const user = checkAuth();
  if (!user) return;

  const profileAvatar = document.getElementById('profile-avatar');
  const profileDropdown = document.getElementById('profile-dropdown');
  const profileName = document.getElementById('profile-name');
  const profileInitial = document.getElementById('profile-initial');

  // Set profile name and initial
  profileName.textContent = user.name || user.email || 'User';
  const initial = (user.name || user.email).charAt(0).toUpperCase();
  profileInitial.textContent = initial;

  // Toggle dropdown on avatar click
  profileAvatar.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('show');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    profileDropdown.classList.remove('show');
  });
}

// Store dashboard data for Excel export
let dashboardData = {
  stocks: [],
  movements: [],
  chartStocks: [],
  filteredMovements: [],
  totalStock: 0,
  uniqueLocations: 0,
  inbound: 0,
  outbound: 0,
  startDate: null,
  endDate: null
};

function renderActivityTable(stocks, movements) {
  const tbody = document.getElementById('activity-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  const rows = stocks
    .map((stock) => {
      const relatedMovements = movements.filter((m) => m.stockId === stock.stockId);
      const lastMovementDate = relatedMovements.reduce((latest, m) => {
        const md = new Date(m.dateUpdated);
        return !latest || md > latest ? md : latest;
      }, null);

      const lastUpdated = lastMovementDate || (stock.lastUpdated ? new Date(stock.lastUpdated) : null);

      return {
        stockId: stock.stockId,
        quantity: stock.quantity,
        warehouseLocation: stock.warehouseLocation,
        lastUpdated,
      };
    })
    .sort((a, b) => {
      if (a.lastUpdated && b.lastUpdated) return b.lastUpdated - a.lastUpdated;
      if (a.lastUpdated) return -1;
      if (b.lastUpdated) return 1;
      return a.stockId.localeCompare(b.stockId);
    });

  rows.forEach((row) => {
    const tr = document.createElement('tr');

    const tdId = document.createElement('td');
    tdId.textContent = row.stockId;
    tr.appendChild(tdId);

    const tdQty = document.createElement('td');
    tdQty.textContent = row.quantity;
    tr.appendChild(tdQty);

    const tdLoc = document.createElement('td');
    tdLoc.textContent = row.warehouseLocation || '—';
    tr.appendChild(tdLoc);

    const tdDate = document.createElement('td');
    tdDate.textContent = row.lastUpdated ? row.lastUpdated.toLocaleString() : '—';
    tr.appendChild(tdDate);

    tbody.appendChild(tr);
  });
}

function renderInventoryChart(stocks) {
  const getCategory = (stock) => (stock.productId?.category || stock.category || '').toLowerCase();
  // Separate stocks by category
  const shirtStocks = stocks.filter((s) => getCategory(s) === 'shirts');
  const pantStocks = stocks.filter((s) => getCategory(s) === 'pants');
  const accessoryStocks = stocks.filter((s) => getCategory(s) === 'accessories');

  // Render each category chart
  renderCategoryChart('shirtsChart', 'Shirts', shirtStocks, 'shirts');
  renderCategoryChart('pantsChart', 'Pants', pantStocks, 'pants');
  renderCategoryChart('accessoriesChart', 'Accessories', accessoryStocks, 'accessories');
}

function renderCategoryChart(canvasId, categoryName, stocks, chartType) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // Sort stocks by stockId
  const sortedStocks = [...stocks].sort((a, b) => a.stockId.localeCompare(b.stockId));
  const labels = sortedStocks.map((s) => s.stockId);
  const quantities = sortedStocks.map((s) => s.quantity);
  
  // Set colors based on quantity - red if below 10, blue otherwise
  const backgroundColors = quantities.map(q => q < 10 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(21, 94, 239, 0.15)');
  const borderColors = quantities.map(q => q < 10 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(21, 94, 239, 0.8)');
  const hoverColors = quantities.map(q => q < 10 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(21, 94, 239, 0.25)');

  // Destroy existing chart
  if (chartType === 'shirts' && shirtsChart) shirtsChart.destroy();
  if (chartType === 'pants' && pantsChart) pantsChart.destroy();
  if (chartType === 'accessories' && accessoriesChart) accessoriesChart.destroy();

  const ctx = canvas.getContext('2d');
  const newChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: `${categoryName} Stock Quantity`,
          data: quantities,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          hoverBackgroundColor: hoverColors,
          barThickness: 40,
          minBarLength: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2.4,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `Quantity: ${context.parsed.y}`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Stock ID' },
          ticks: { autoSkip: false },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Quantity' },
          ticks: { 
            precision: 0,
            stepSize: 1
          },
          min: 0,
          suggestedMax: quantities.length > 0 ? Math.max(...quantities) + 5 : 10
        },
      },
    },
  });

  // Store the chart instance
  if (chartType === 'shirts') shirtsChart = newChart;
  if (chartType === 'pants') pantsChart = newChart;
  if (chartType === 'accessories') accessoriesChart = newChart;
}

async function populateDashboard() {
  try {
    // Fetch stocks data
    const stocksRes = await fetch("/stocks");
    const stocks = await stocksRes.json();

    // Fetch movements data
    const movementsRes = await fetch("/movements");
    const movements = await movementsRes.json();

    // Get date filter values if they exist
    const startDateInput = document.getElementById("start-date");
    const endDateInput = document.getElementById("end-date");
    
    let filteredMovements = movements;
    let chartStocks = stocks;
    let startDate = null;
    let endDate = null;
    
    // Apply date filtering if dates are selected
    if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
      startDate = new Date(startDateInput.value);
      endDate = new Date(endDateInput.value);
      endDate.setHours(23, 59, 59, 999); // Include the entire end date
      
      filteredMovements = movements.filter(m => {
        const movementDate = new Date(m.dateUpdated);
        return movementDate >= startDate && movementDate <= endDate;
      });

  
      chartStocks = stocks.map((stock) => {
        const stockMovements = movements.filter((m) => m.stockId === stock.stockId);

        // Net movements from startDate to now 
        const netSinceStart = stockMovements.reduce((sum, m) => {
          const movementDate = new Date(m.dateUpdated);
          if (movementDate >= startDate) {
            return sum + (m.movementType === "Inbound" ? m.quantity : -m.quantity);
          }
          return sum;
        }, 0);

        // Net movements within the selected range
        const netInRange = stockMovements.reduce((sum, m) => {
          const movementDate = new Date(m.dateUpdated);
          if (movementDate >= startDate && movementDate <= endDate) {
            return sum + (m.movementType === "Inbound" ? m.quantity : -m.quantity);
          }
          return sum;
        }, 0);

        const startingQty = stock.quantity - netSinceStart;
        const chartQty = startingQty + netInRange;

        return { ...stock, quantity: chartQty };
      });
    }

    // Calculate totals
    const totalStock = stocks.reduce((sum, s) => sum + s.quantity, 0);
    const uniqueLocations = new Set(stocks.map(s => s.warehouseLocation)).size;

    // Calculate inbound and outbound from movements
    const inbound = filteredMovements.filter(m => m.movementType === "Inbound").length;
    const outbound = filteredMovements.filter(m => m.movementType === "Outbound").length;

    // Store data for Excel export
    dashboardData = {
      stocks,
      movements,
      chartStocks,
      filteredMovements,
      totalStock,
      uniqueLocations,
      inbound,
      outbound,
      startDate,
      endDate
    };

    renderInventoryChart(chartStocks);
    renderActivityTable(chartStocks, filteredMovements);

    // Update the DOM
    document.getElementById("total-stock").textContent = totalStock;
    
    // Update location info if element exists
    const locationInfo = document.getElementById("location-info");
    if (locationInfo) {
      locationInfo.textContent = `Units across ${uniqueLocations} location${uniqueLocations !== 1 ? 's' : ''}`;
    }
    
    document.getElementById("inbound-stocks").textContent = inbound;
    document.getElementById("outbound-stocks").textContent = outbound;
  } catch (err) {
    console.error("Error populating dashboard:", err);
  }
}

// Run it once when the page loads
populateDashboard();

// Add filter button listener if it exists
const filterBtn = document.getElementById("filter-btn");
if (filterBtn) {
  filterBtn.addEventListener("click", () => {
    populateDashboard();
  });
}

// Add a click event listener to the download button
downloadBtn.addEventListener('click', () => {
    console.log('Download button clicked!');

    
    
    html2canvas(mainContent, { scale: 2 }).then(canvas => {
      
        const imgData = canvas.toDataURL('image/png');

        
        const pdf = new jsPDF('p', 'mm', 'a4');

        // Get the dimensions of the PDF and the captured image
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;

       
        let imgWidth = pdfWidth;
        let imgHeight = imgWidth / ratio;

       
        if (imgHeight > pdfHeight) {
            console.warn("Content is taller than a single A4 page. It may be cut off.");
        }

        // Add the image to the PDF
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

        // Save the PDF with a specific filename
        pdf.save('ESCKWEAR_Dashboard_Report.pdf');
    });
});

// Helper function to format date
function formatDateForExcel(date) {
  if (!date) return '';
  const d = new Date(date);
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Add Excel download functionality
if (downloadExcelBtn) {
  downloadExcelBtn.addEventListener('click', () => {
    console.log('Download Excel button clicked!');

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Get date range text
    let dateRangeText = 'All Time';
    if (dashboardData.startDate && dashboardData.endDate) {
      dateRangeText = `${formatDateForExcel(dashboardData.startDate)} to ${formatDateForExcel(dashboardData.endDate)}`;
    }

    // Sheet 1: Summary
    const summaryData = [
      ['ESCKWEAR Dashboard Report'],
      ['Date Range:', dateRangeText],
      ['Generated:', new Date().toLocaleString()],
      [],
      ['Metric', 'Value'],
      ['Total Stock Level', dashboardData.totalStock],
      ['Unique Locations', dashboardData.uniqueLocations],
      ['Inbound Movements', dashboardData.inbound],
      ['Outbound Movements', dashboardData.outbound]
    ];
    const ws_summary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws_summary, 'Summary');

    // Sheet 2: Stock Levels per ID
    const stockLevelsData = [
      ['Stock ID', 'Quantity', 'Warehouse Location', 'Last Updated']
    ];
    dashboardData.chartStocks
      .sort((a, b) => a.stockId.localeCompare(b.stockId))
      .forEach(stock => {
        stockLevelsData.push([
          stock.stockId,
          stock.quantity,
          stock.warehouseLocation || '—',
          stock.lastUpdated ? new Date(stock.lastUpdated).toLocaleString() : '—'
        ]);
      });
    const ws_stocks = XLSX.utils.aoa_to_sheet(stockLevelsData);
    XLSX.utils.book_append_sheet(wb, ws_stocks, 'Stock Levels');

    // Sheet 3: Movement Details (filtered)
    const movementData = [
      ['Stock ID', 'Movement Type', 'From', 'To', 'Quantity', 'Date Updated']
    ];
    dashboardData.filteredMovements
      .sort((a, b) => new Date(b.dateUpdated) - new Date(a.dateUpdated))
      .forEach(movement => {
        movementData.push([
          movement.stockId,
          movement.movementType,
          movement.from,
          movement.to,
          movement.quantity,
          new Date(movement.dateUpdated).toLocaleString()
        ]);
      });
    const ws_movements = XLSX.utils.aoa_to_sheet(movementData);
    XLSX.utils.book_append_sheet(wb, ws_movements, 'Movements');

    // Generate filename with current date
    const now = new Date();
    const filename = `ESCKWEAR_Dashboard_${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}.xlsx`;

    // Write the file
    XLSX.writeFile(wb, filename);
    console.log('Excel file generated successfully');
  });
}

// Initialize profile on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeProfile();
});