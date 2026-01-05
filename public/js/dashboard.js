// This makes sure we can use the jsPDF library
const { jsPDF } = window.jspdf;

// Get references to the HTML elements
const downloadBtn = document.getElementById('download-btn');
const mainContent = document.getElementById('main-content');

async function populateDashboard() {
  try {
    // Fetch stocks data
    const stocksRes = await fetch("http://localhost:3000/stocks");
    const stocks = await stocksRes.json();

    // Fetch movements data
    const movementsRes = await fetch("http://localhost:3000/movements");
    const movements = await movementsRes.json();

    // Get date filter values if they exist
    const startDateInput = document.getElementById("start-date");
    const endDateInput = document.getElementById("end-date");
    
    let filteredMovements = movements;
    
    // Apply date filtering if dates are selected
    if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
      const startDate = new Date(startDateInput.value);
      const endDate = new Date(endDateInput.value);
      endDate.setHours(23, 59, 59, 999); // Include the entire end date
      
      filteredMovements = movements.filter(m => {
        const movementDate = new Date(m.dateUpdated);
        return movementDate >= startDate && movementDate <= endDate;
      });
    }

    // Calculate totals
    const totalStock = stocks.reduce((sum, s) => sum + s.quantity, 0);
    const uniqueLocations = new Set(stocks.map(s => s.warehouseLocation)).size;

    // Calculate inbound and outbound from movements
    const inbound = filteredMovements.filter(m => m.movementType === "Inbound").length;
    const outbound = filteredMovements.filter(m => m.movementType === "Outbound").length;

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

    // Use html2canvas to capture the main content area
    // The scale option improves the quality of the capture
    html2canvas(mainContent, { scale: 2 }).then(canvas => {
        // Get the image data from the canvas
        const imgData = canvas.toDataURL('image/png');

        // Create a new PDF document
        // 'p' for portrait, 'mm' for millimeters, 'a4' for page size
        const pdf = new jsPDF('p', 'mm', 'a4');

        // Get the dimensions of the PDF and the captured image
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;

        // Calculate the width and height of the image to fit in the PDF
        let imgWidth = pdfWidth;
        let imgHeight = imgWidth / ratio;

        // If the image height is greater than the PDF height, we might need to adjust
        // For simplicity, we'll just add it as is. For multi-page, more logic is needed.
        if (imgHeight > pdfHeight) {
            console.warn("Content is taller than a single A4 page. It may be cut off.");
        }

        // Add the image to the PDF
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

        // Save the PDF with a specific filename
        pdf.save('ESCKWEAR_Dashboard_Report.pdf');
    });
});