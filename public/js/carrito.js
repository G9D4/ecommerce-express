document.addEventListener('DOMContentLoaded', () => {
    const cartDropdown = document.querySelector('.cart-dropdown .cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');

    // Realizar una solicitud para obtener los productos del carrito
    fetch('/api/carrito')
        .then(response => response.json())
        .then(data => {
            cartDropdown.innerHTML = ''; // Limpiar la lista antes de agregar productos
            let total = 0;
            data.productos.forEach(producto => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${producto.nombreproducto} (x${producto.cantidad})</span>
                    <span>${producto.precio * producto.cantidad}</span>
                `;
                cartDropdown.appendChild(li);
                total += producto.precio * producto.cantidad;
            });
            cartTotalPrice.textContent = total.toFixed(2); // Mostrar el total
        })
        .catch(err => console.error('Error fetching cart items:', err));
});
