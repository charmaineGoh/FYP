// This makes sure we can use the jsPDF library
const { jsPDF } = window.jspdf;

// Get references to the HTML elements
const downloadBtn = document.getElementById('download-btn');
const mainContent = document.getElementById('main-content');

async function populateDashboard() {
  try {
    const res = await fetch("http://localhost:3000/stocks");
    const stocks = await res.json();

    // Calculate totals
    const totalStock = stocks.reduce((sum, s) => sum + s.quantity, 0);

    // Placeholder values until you have inbound/outbound/movements logic
    const inbound = 0;
    const outbound = 0;
    const movements = 0;

    // Update the DOM
    document.getElementById("total-stock").textContent = totalStock;
    document.getElementById("inbound-stock").textContent = inbound;
    document.getElementById("outbound-stock").textContent = outbound;
    document.getElementById("movements-stock").textContent = movements;
  } catch (err) {
    console.error("Error populating dashboard:", err);
  }
}

// Run it once when the page loads
populateDashboard();

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