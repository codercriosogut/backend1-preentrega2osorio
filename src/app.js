import express from 'express';
import handlebars from 'express-handlebars';
import __dirname from './utils.js';
import productsRouter from './routes/products.router.js';
import cartsRouter from './routes/carts.router.js';
import { Server } from 'socket.io';
import { readProductos, writeProductos, productos } from './dataManager.js';

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.engine('handlebars', handlebars.engine());
app.set('views', __dirname + '/views');
app.set('view engine', 'handlebars');
app.use(express.static(__dirname + '/public'));

// Ruta para mostrar el formulario de llenado
app.get('/form', (req, res) => {
    res.render('form');
});

// Ruta para mostrar los productos en tiempo real
app.get('/real-time-products', async (req, res) => {
    await readProductos();  // Leer productos antes de renderizar la vista
    res.render('realTime.Products', { productos });
});

// Rutas para productos y carritos
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Redirección de la raíz a /api/products
app.use('/', (req, res) => res.redirect('/api/products'));

const httpServer = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const socketServer = new Server(httpServer);

socketServer.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    socket.on('new-product', async (data) => {
        const { title, description, code, price, stock, category, thumbnails } = data;

        const nuevoProducto = {
            id: productos.length ? Math.max(...productos.map(p => p.id)) + 1 : 1,
            title,
            description,
            code,
            price,
            status: true,
            stock,
            category,
            thumbnails: thumbnails || []
        };

        productos.push(nuevoProducto);
        await writeProductos();
        socketServer.emit('update-products', productos);
    });

    socket.on('delete-product', async (id) => {
        const productoIndex = productos.findIndex((producto) => producto.id === id);

        if (productoIndex !== -1) {
            productos.splice(productoIndex, 1);
            await writeProductos();
            socketServer.emit('update-products', productos);
        }
    });
});

// Leer productos al inicio
readProductos();
