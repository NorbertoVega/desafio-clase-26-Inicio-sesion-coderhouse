const httpServer = require('./src/app')

const PORT = 3000;

httpServer.listen(PORT, () =>
    console.log(`Servidor corriendo en puerto ${PORT}`)
);

