import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { engine } from 'express-handlebars';
import productsRouter from './routes/products.router.js';
import cartsRouter from './routes/carts.router.js';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

let productos = [];

async function readProductos() {
    try {
        const data = await fs.readFile('productos.json', 'utf8');
        productos = JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile('productos.json', JSON.stringify([]));
            productos = [];
        } else {
            console.error("Error al leer el archivo", error);
        }
    }
}

async function writeProductos() {
    try {
        await fs.writeFile('productos.json', JSON.stringify(productos, null, 2));
    } catch (error) {
        console.error("Error al escribir en el archivo", error);
    }
}

readProductos();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

app.get('/realtimeproducts', (req, res) => {
    res.render('realtimeproducts');
});

app.get('/form', (req, res) => {
    res.render('form');
});

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.emit('updateProducts', productos);

    socket.on('addProduct', async (product) => {
        productos.push(product);
        await writeProductos();
        io.emit('updateProducts', productos);
    });

    socket.on('deleteProduct', async (productId) => {
        productos = productos.filter(product => product.id !== productId);
        await writeProductos();
        io.emit('updateProducts', productos);
    });
});

const port = 8080;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
