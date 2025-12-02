const filterSelect = document.getElementById('filter-category');
const products = document.querySelectorAll('.product-item');

filterSelect.addEventListener('change', () => {
  const selected = filterSelect.value;
  products.forEach(product => {
    if (selected === 'all' || product.dataset.category === selected) {
      product.style.display = '';
    } else {
      product.style.display = 'none';
    }
  });
});