require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar rutas
const productosRoutes = require('./routes/productos');
const usuariosRoutes = require('./routes/usuarios');
const pedidosRoutes = require('./routes/pedidos');

// Importar middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Importar configuración de base de datos
const Database = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de CORS
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.url}`);
    next();
});

// Ruta de salud de la aplicación
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Rutas de la API
app.use('/api/productos', productosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/pedidos', pedidosRoutes);

// Ruta principal para servir el frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Rutas para páginas específicas
app.get('/productos', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'productos.html'));
});

app.get('/carrito', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'carrito.html'));
});

app.get('/usuario', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'usuario.html'));
});

// Middleware para rutas no encontradas
app.use(notFound);

// Middleware de manejo de errores
app.use(errorHandler);

// ...existing code...

// Inicializar conexión a la base de datos y arrancar el servidor
const startServer = async () => {
    try {
        // Probar conexión a la base de datos
        const database = new Database();
        await database.createPool();
        console.log('✅ Conexión a la base de datos establecida');

        // Arrancar el servidor
        const server = app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`📚 API: http://localhost:${PORT}/api`);
            console.log(`❤️  Health: http://localhost:${PORT}/health`);
            console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔄 Presiona Ctrl+C para detener el servidor`);
        });

        // Mantener el servidor activo
        server.on('error', (error) => {
            console.error('❌ Error en el servidor:', error);
        });

        return server;
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
    console.error('Stack:', error.stack);
    // No cerrar inmediatamente, solo loggear
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
    console.error('En promesa:', promise);
    // No cerrar inmediatamente, solo loggear
});

// Manejo graceful del cierre del servidor
process.on('SIGINT', async () => {
    console.log('\n🛑 Cerrando servidor gracefully...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Cerrando servidor...');
    process.exit(0);
});

// Iniciar el servidor
if (require.main === module) {
    startServer().catch((error) => {
        console.error('❌ Error fatal al iniciar:', error);
        process.exit(1);
    });
}

// === DEBUG (TEMPORAL) ===
const Database = require('./config/database');

app.get('/debug/env', (req, res) => {
  res.json({
    hasMYSQLHOST: !!process.env.MYSQLHOST,
    hasMYSQLUSER: !!process.env.MYSQLUSER,
    hasMYSQLDATABASE: !!process.env.MYSQLDATABASE,
    hasMYSQLPORT: !!process.env.MYSQLPORT,
    nodeEnv: process.env.NODE_ENV,
  });
});

app.get('/debug/db', async (req, res) => {
  try {
    const db = new Database();
    await db.createPool();
    const rows = await db.query('SELECT 1 AS ok');
    res.json({ ok: true, rows });
  } catch (e) {
    res.status(500).json({
      ok: false,
      code: e.code,
      errno: e.errno,
      message: e.message,
      sqlMessage: e.sqlMessage,
    });
  }
});
// === FIN DEBUG ===



module.exports = app;
