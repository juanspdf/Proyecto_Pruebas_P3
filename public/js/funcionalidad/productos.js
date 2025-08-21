let productos = [];
let productosFiltrados = [];
let vistaActual = 'grid'; // 'grid' o 'list'

// Cargar productos desde la API
async function cargarProductos() {
    try {
        console.log('Cargando productos...');
        const response = await fetch('/api/productos');

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('Datos recibidos:', data);

        if (!data.success || !Array.isArray(data.productos)) {
            throw new Error('Formato de datos inválido');
        }

        productos = data.productos.map(p => ({
            ...p,
            precio: parseFloat(p.precio),
            stock: parseInt(p.stock),
            imagen: p.imagen && !p.imagen.startsWith('http') ?
                `assets/images/${p.imagen}` :
                (p.imagen || 'assets/images/default.jpg')
        }));

        console.log('Productos procesados:', productos);
        productosFiltrados = [...productos];

        // Hacer productos globales para el carrito
        window.productos = productos;

        // Cargar categorías en el filtro
        cargarCategorias();

        // Renderizar productos
        renderProductos();

        // Actualizar contador
        actualizarContador();

    } catch (error) {
        console.error('Error al cargar productos:', error);
        mostrarError(error);
    }
}

// Cargar categorías únicas en el select
function cargarCategorias() {
    const categorySelect = document.getElementById('categorySelect');
    if (!categorySelect) return;

    // Obtener categorías únicas
    const categorias = [...new Set(productos.map(p => p.categoria))];

    // Limpiar opciones existentes (excepto "Todas las categorías")
    while (categorySelect.children.length > 1) {
        categorySelect.removeChild(categorySelect.lastChild);
    }

    // Agregar categorías
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.toLowerCase();
        option.textContent = categoria.charAt(0).toUpperCase() + categoria.slice(1);
        categorySelect.appendChild(option);
    });
}

// Renderizar productos en el DOM
function renderProductos() {
    const contenedor = document.getElementById('product-list');
    if (!contenedor) {
        console.error('No se encontró el contenedor de productos');
        return;
    }

    contenedor.innerHTML = '';

    if (productosFiltrados.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12 text-center py-5">
                <h4 class="text-muted">No hay productos disponibles</h4>
                <p class="text-muted">Intenta ajustar los filtros o recargar la página</p>
            </div>
        `;
        return;
    }

    productosFiltrados.forEach(producto => {
        const precioFormateado = producto.precio.toFixed(2);
        const col = document.createElement('div');

        if (vistaActual === 'grid') {
            col.className = 'col-md-4 col-lg-3 mb-4';
            col.innerHTML = `
                <div class="card h-100 product-card">
                    <div class="position-relative">
                        <img src="${producto.imagen}" class="card-img-top product-image" alt="${producto.nombre}" style="height: 200px; object-fit: cover;">
                        <div class="category-badge badge bg-primary position-absolute top-0 end-0 m-2">
                            ${producto.categoria}
                        </div>
                        ${producto.stock <= 0 ? '<div class="badge bg-danger position-absolute top-0 start-0 m-2">Sin Stock</div>' : ''}
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${producto.nombre}</h5>
                        <p class="card-text text-muted flex-grow-1">${producto.descripcion || 'Sin descripción'}</p>
                        
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="h5 text-primary mb-0">$${precioFormateado}</span>
                                <span class="badge bg-${producto.stock > 0 ? 'success' : 'danger'}">
                                    Stock: ${producto.stock}
                                </span>
                            </div>
                            
                            ${producto.stock > 0 ? `
                            <div class="row g-2">
                                <div class="col-4">
                                    <input type="number" 
                                           class="form-control form-control-sm" 
                                           value="1" 
                                           min="1" 
                                           max="${producto.stock}"
                                           id="cantidad-${producto.id}">
                                </div>
                                <div class="col-8">
                                    <button class="btn btn-primary btn-sm w-100" 
                                            onclick="agregarAlCarrito(${producto.id})">
                                        <i class="fas fa-cart-plus"></i> Agregar
                                    </button>
                                </div>
                            </div>
                            ` : `
                            <button class="btn btn-secondary btn-sm w-100" disabled>
                                <i class="fas fa-times"></i> Sin Stock
                            </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Vista de lista
            col.className = 'col-12 mb-3';
            col.innerHTML = `
                <div class="card">
                    <div class="row g-0">
                        <div class="col-md-2">
                            <img src="${producto.imagen}" class="img-fluid rounded-start h-100" alt="${producto.nombre}" style="object-fit: cover; min-height: 150px;">
                        </div>
                        <div class="col-md-10">
                            <div class="card-body d-flex flex-column h-100">
                                <div class="row">
                                    <div class="col-md-8">
                                        <h5 class="card-title">${producto.nombre}</h5>
                                        <p class="card-text">${producto.descripcion || 'Sin descripción'}</p>
                                        <p class="card-text">
                                            <small class="text-muted">Categoría: ${producto.categoria}</small>
                                        </p>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="text-end">
                                            <h4 class="text-primary">$${precioFormateado}</h4>
                                            <span class="badge bg-${producto.stock > 0 ? 'success' : 'danger'} mb-2">
                                                Stock: ${producto.stock}
                                            </span>
                                            ${producto.stock > 0 ? `
                                            <div class="d-flex gap-2 justify-content-end">
                                                <input type="number" 
                                                       class="form-control form-control-sm" 
                                                       style="width: 80px;"
                                                       value="1" 
                                                       min="1" 
                                                       max="${producto.stock}"
                                                       id="cantidad-${producto.id}">
                                                <button class="btn btn-primary btn-sm" 
                                                        onclick="agregarAlCarrito(${producto.id})">
                                                    <i class="fas fa-cart-plus"></i> Agregar
                                                </button>
                                            </div>
                                            ` : `
                                            <button class="btn btn-secondary btn-sm" disabled>
                                                <i class="fas fa-times"></i> Sin Stock
                                            </button>
                                            `}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        contenedor.appendChild(col);
    });
}

// Actualizar contador de productos
function actualizarContador() {
    const counter = document.getElementById('productCount');
    if (counter) {
        counter.textContent = `${productosFiltrados.length} productos encontrados`;
    }
}

// Mostrar error
function mostrarError(error) {
    Swal.fire({
        icon: 'error',
        title: 'Error al cargar productos',
        text: error.message || 'Ocurrió un error inesperado',
        confirmButtonText: 'Reintentar'
    }).then((result) => {
        if (result.isConfirmed) {
            cargarProductos();
        }
    });
}

// Buscar productos
function buscarProductos(termino) {
    aplicarFiltros();
}

// Aplicar todos los filtros
function aplicarFiltros() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const categoria = document.getElementById('categorySelect')?.value || 'all';
    const minPrice = parseFloat(document.getElementById('minPrice')?.value) || 0;
    const maxPrice = parseFloat(document.getElementById('maxPrice')?.value) || Infinity;
    const sortBy = document.getElementById('sortSelect')?.value || 'default';

    // Filtrar productos
    productosFiltrados = productos.filter(producto => {
        const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm) ||
            producto.descripcion.toLowerCase().includes(searchTerm) ||
            producto.categoria.toLowerCase().includes(searchTerm);

        const matchesCategory = categoria === 'all' || producto.categoria.toLowerCase() === categoria;
        const matchesPrice = producto.precio >= minPrice && producto.precio <= maxPrice;

        return matchesSearch && matchesCategory && matchesPrice;
    });

    // Ordenar productos
    switch (sortBy) {
        case 'priceAsc':
            productosFiltrados.sort((a, b) => a.precio - b.precio);
            break;
        case 'priceDesc':
            productosFiltrados.sort((a, b) => b.precio - a.precio);
            break;
        case 'nameAsc':
            productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
            break;
        case 'nameDesc':
            productosFiltrados.sort((a, b) => b.nombre.localeCompare(a.nombre));
            break;
        default:
            // Mantener orden original
            break;
    }

    renderProductos();
    actualizarContador();
}

// Cambiar vista
function cambiarVista(tipo) {
    vistaActual = tipo;

    // Actualizar botones
    const gridBtn = document.getElementById('gridView');
    const listBtn = document.getElementById('listView');

    if (gridBtn && listBtn) {
        gridBtn.classList.toggle('active', tipo === 'grid');
        listBtn.classList.toggle('active', tipo === 'list');
    }

    renderProductos();
}

// Inicializar productos
function initProductos() {
    cargarProductos();

    // Event listeners
    const searchInput = document.getElementById('searchInput');
    const categorySelect = document.getElementById('categorySelect');
    const sortSelect = document.getElementById('sortSelect');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const gridView = document.getElementById('gridView');
    const listView = document.getElementById('listView');

    if (searchInput) {
        searchInput.addEventListener('input', aplicarFiltros);
    }

    if (categorySelect) {
        categorySelect.addEventListener('change', aplicarFiltros);
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', aplicarFiltros);
    }

    if (minPrice) {
        minPrice.addEventListener('input', aplicarFiltros);
    }

    if (maxPrice) {
        maxPrice.addEventListener('input', aplicarFiltros);
    }

    if (gridView) {
        gridView.addEventListener('click', () => cambiarVista('grid'));
    }

    if (listView) {
        listView.addEventListener('click', () => cambiarVista('list'));
    }

    // Establecer vista inicial
    cambiarVista('grid');
}

// Hacer funciones globales
window.initProductos = initProductos;
window.cargarProductos = cargarProductos;
window.buscarProductos = buscarProductos;
window.aplicarFiltros = aplicarFiltros;
window.cambiarVista = cambiarVista;

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initProductos === 'function') {
        initProductos();
    }
});