const express = require('express');
const moment = require('moment');
const { Server: HttpServer } = require("http");
const { Server: IOServer } = require("socket.io");
const ProductosDaoMariaDB = require('./daos/ProductosDaoMariaDB');
const MensajesDaoMongoDB = require('./daos/MensajesDaoMongoDB');
const contenedorMensajes = new MensajesDaoMongoDB(true);

const app = express();
const router = require('./router/productos');
const routerUsers = require('./router/usuarios');
const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(express.static('./public'))

const renderAllMessages = async () => {
    try {
        const messages = await contenedorMensajes.getAll();
        io.sockets.emit("render-all-messages", messages);
    }
    catch (error) {
        console.log('Error: ', error);
    }
}

io.on("connection", (socket) => {

    socket.on('add-new-product', async data => {
        const contenedorProductos = new ProductosDaoMariaDB();
        const id = await contenedorProductos.save(data);
        if (id !== -1) {
            const newProduct = await contenedorProductos.getById(id);
            io.sockets.emit('render-new-product', JSON.parse(JSON.stringify(newProduct))[0]);
            contenedorProductos.closeConnection();
        }
    });

    socket.on('user-logged-in', data => {
        if (data)
            renderAllMessages();
    })

    socket.on('add-new-message', data => {
        const now = moment();
        data = { ...data, time: now.format("D/MM/YYYY h:mm:ss") }
        contenedorMensajes.save(data)
            .then(() => {
                renderAllMessages();
            })
            .catch((error) => {
                console.log(`Error al cargar mensajes: ${error}`)
            });
    });
});

app.use('/api', router);
app.use('/api', routerUsers);

module.exports = httpServer;

