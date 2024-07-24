const socket = io();

socket.on('update-products', (products) => {
    // Lógica para actualizar la lista de productos en tiempo real
    console.log(products);
});

document.getElementById('product-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const code = document.getElementById('code').value;
    const price = document.getElementById('price').value;
    const stock = document.getElementById('stock').value;
    const category = document.getElementById('category').value;
    const thumbnails = document.getElementById('thumbnails').value.split(',');

    socket.emit('new-product', {
        title,
        description,
        code,
        price,
        stock,
        category,
        thumbnails
    });
});
