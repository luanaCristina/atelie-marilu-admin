//
// --- PASSO 1: COLOQUE SUAS CREDENCIAIS DO FIREBASE AQUI ---
//
const firebaseConfig = {
    apiKey: "SEU_API_KEY",
    authDomain: "SEU_AUTH_DOMAIN",
    projectId: "SEU_PROJECT_ID",
    storageBucket: "SEU_STORAGE_BUCKET",
    messagingSenderId: "SEU_MESSAGING_SENDER_ID",
    appId: "SEU_APP_ID"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- Variáveis Globais do Carrossel ---
let mainCurrentSlide = 0;
let carouselInterval;

//
// --- LÓGICA DE INICIALIZAÇÃO ---
//
document.addEventListener('DOMContentLoaded', function() {
    // Inicia o carregamento dos dados
    loadCarouselImagesFromFirebase();
    loadProductsFromFirebase(); // Esta função foi atualizada
    
    // Configura os controles do modal
    setupModalControls();
    
    // Configura os cliques dos botões do carrossel (só precisa ser feito 1 vez)
    initializeMainCarouselControls();
});


//
// --- LÓGICA DO CARROSSEL (DINÂMICO) ---
//
function loadCarouselImagesFromFirebase() {
    const carouselContainer = document.querySelector('.carousel');
    const loadingMessage = document.getElementById('carousel-loading');
    const prevBtn = document.querySelector('.carousel-control.prev');
    const nextBtn = document.querySelector('.carousel-control.next');

    db.collection('carouselImages').orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        // Limpa imagens antigas
        carouselContainer.querySelectorAll('.carousel-slide').forEach(el => el.remove());
        
        if (snapshot.empty) {
            loadingMessage.textContent = 'Nenhuma imagem no carrossel.';
            loadingMessage.style.display = 'block';
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            return;
        }

        loadingMessage.style.display = 'none';

        // Adiciona as novas imagens do Firebase
        snapshot.forEach((doc, index) => {
            const data = doc.data();
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            if (index === 0) {
                slide.classList.add('active'); 
            }
            slide.innerHTML = `<img src="${data.imageUrl}" alt="Kit Bebê Ateliê Marilu ${index + 1}">`;
            carouselContainer.insertBefore(slide, loadingMessage);
        });

        // Mostra os botões
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'block';
        
        mainCurrentSlide = 0; 
        showMainSlide(mainCurrentSlide, false); 
        
        const slideCount = snapshot.size; 
        resetCarouselInterval(slideCount); 

    }, error => {
        console.error("Erro ao buscar imagens do carrossel:", error);
        loadingMessage.textContent = 'Erro ao carregar imagens.';
        loadingMessage.style.display = 'block';
    });
}

function initializeMainCarouselControls() {
    const mainPrevBtn = document.querySelector('.carousel-control.prev');
    const mainNextBtn = document.querySelector('.carousel-control.next');
    
    mainNextBtn.addEventListener('click', function() {
        showMainSlide(mainCurrentSlide + 1);
    });

    mainPrevBtn.addEventListener('click', function() {
        showMainSlide(mainCurrentSlide - 1);
    });
}

function showMainSlide(index, resetTimer = true) {
    const mainSlides = document.querySelectorAll('.carousel-slide');
    if (mainSlides.length === 0) return; 

    mainSlides.forEach(slide => slide.classList.remove('active'));
    
    if (index >= mainSlides.length) {
        mainCurrentSlide = 0; 
    } else if (index < 0) {
        mainCurrentSlide = mainSlides.length - 1; 
    } else {
        mainCurrentSlide = index;
    }

    mainSlides[mainCurrentSlide].classList.add('active');
    
    if (resetTimer) {
        resetCarouselInterval(mainSlides.length); 
    }
}

function autoAdvanceSlide() {
    showMainSlide(mainCurrentSlide + 1, false); 
}

function startCarouselAutoPlay(slideCount) {
    if (slideCount <= 1) return; 
    carouselInterval = setInterval(autoAdvanceSlide, 5000); 
}

function resetCarouselInterval(slideCount) {
    clearInterval(carouselInterval);
    startCarouselAutoPlay(slideCount);
}


//
// --- LÓGICA DE CARREGAR PRODUTOS (ATUALIZADA COM GRUPOS DE PREÇO) ---
//
function loadProductsFromFirebase() {
    const kitsGrid = document.getElementById('kits-grid');
    const itemsGrid = document.getElementById('items-grid');

    // Busca produtos ordenados por preço (para facilitar)
    db.collection('products').orderBy('price')
      .onSnapshot(snapshot => {
        
        // Limpa os grids
        kitsGrid.innerHTML = '';
        itemsGrid.innerHTML = '';
        
        let kitsFound = false;
        let itemsFound = false;
        
        // Objeto para agrupar produtos por preço
        const productsByPrice = {
            kit: {},
            item: {}
        };

        // 1. Agrupa os produtos que vêm do Firebase
        snapshot.forEach(doc => {
            const product = doc.data();
            product.id = doc.id; 
            const priceKey = product.price.toFixed(2); // ex: "145.90"
            
            if (product.type === 'kit') {
                if (!productsByPrice.kit[priceKey]) {
                    productsByPrice.kit[priceKey] = []; // Cria um array para esse preço
                }
                productsByPrice.kit[priceKey].push(product);
                kitsFound = true;
            } else { // 'item'
                if (!productsByPrice.item[priceKey]) {
                    productsByPrice.item[priceKey] = [];
                }
                productsByPrice.item[priceKey].push(product);
                itemsFound = true;
            }
        });

        // 2. Constrói o HTML dos KITS agrupados
        if (kitsFound) {
            // Pega as chaves de preço (ex: "145.90", "155.00") e ordena
            const kitPrices = Object.keys(productsByPrice.kit).sort((a, b) => a - b);
            
            kitPrices.forEach(price => {
                // Cria o 'price-group' que existia no HTML antigo
                const priceGroup = document.createElement('div');
                priceGroup.className = 'price-group';
                
                // Cria o <h3> com o título do preço
                const priceTitle = document.createElement('h3');
                priceTitle.textContent = `R$ ${price.replace('.', ',')}`;
                priceGroup.appendChild(priceTitle);
                
                // Cria o 'product-grid' para os produtos desse preço
                const grid = document.createElement('div');
                grid.className = 'product-grid';
                
                // Adiciona cada produto desse preço ao grid
                productsByPrice.kit[price].forEach(product => {
                    grid.appendChild(createProductCard(product));
                });
                
                priceGroup.appendChild(grid);
                kitsGrid.appendChild(priceGroup); // Adiciona o grupo de preço à seção de kits
            });
        } else {
             kitsGrid.innerHTML = '<p class="loading-message">Nenhum kit cadastrado ainda.</p>';
        }

        // 3. Constrói o HTML dos ITENS agrupados (mesma lógica)
        if (itemsFound) {
            const itemPrices = Object.keys(productsByPrice.item).sort((a, b) => a - b);
            
            itemPrices.forEach(price => {
                const priceGroup = document.createElement('div');
                priceGroup.className = 'price-group';
                
                const priceTitle = document.createElement('h3');
                priceTitle.textContent = `R$ ${price.replace('.', ',')}`;
                priceGroup.appendChild(priceTitle);
                
                const grid = document.createElement('div');
                grid.className = 'product-grid';
                
                productsByPrice.item[price].forEach(product => {
                    grid.appendChild(createProductCard(product));
                });
                
                priceGroup.appendChild(grid);
                itemsGrid.appendChild(priceGroup); // Adiciona o grupo de preço à seção de itens
            });
        } else {
            itemsGrid.innerHTML = '<p class="loading-message">Nenhuma pelúcia cadastrada ainda.</p>';
        }

    }, error => {
        console.error("Erro ao buscar produtos:", error);
        kitsGrid.innerHTML = '<p class="loading-message">Erro ao carregar os produtos.</p>';
        itemsGrid.innerHTML = '<p class="loading-message">Erro ao carregar os produtos.</p>';
    });
}

// Esta função cria o card (igual à anterior, não muda)
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.dataset.name = product.name;
    card.dataset.price = product.price.toFixed(2).replace('.', ',');
    card.dataset.images = JSON.stringify(product.imageUrls);
    
    card.innerHTML = `
        <img src="${product.imageUrls[0]}" alt="${product.name}">
        <h4>${product.name}</h4>
        <p>R$ ${product.price.toFixed(2).replace('.', ',')}</p>
    `;
    
    card.addEventListener('click', () => {
        openProductModal(product);
    });
    
    return card;
}


//
// --- FUNÇÕES DO MODAL ---
// (Esta parte é igual à anterior, não muda)
//
const modal = document.getElementById('product-modal');
const modalName = document.getElementById('modal-product-name');
const modalPrice = document.getElementById('modal-product-price');
const modalImageContainer = document.getElementById('modal-image-container');
const modalPrevBtn = document.querySelector('.modal-control.prev');
const modalNextBtn = document.querySelector('.modal-control.next');

let modalImages = [];
let modalCurrentIndex = 0;

function openProductModal(product) {
    modalName.textContent = product.name;
    modalPrice.textContent = `R$ ${product.price.toFixed(2).replace('.', ',')}`;
    modalImageContainer.innerHTML = '';
    modalImages = product.imageUrls;
    modalCurrentIndex = 0;
    
    modalImages.forEach((url, index) => {
        const slide = document.createElement('div');
        slide.className = 'modal-slide';
        if (index === 0) {
            slide.classList.add('active');
        }
        slide.innerHTML = `<img src="${url}" alt="${product.name} - foto ${index + 1}">`;
        modalImageContainer.appendChild(slide);
    });
    modal.style.display = 'flex';
}

function setupModalControls() {
    const closeButton = document.querySelector('.modal-close-button');
    closeButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    modalPrevBtn.addEventListener('click', () => showModalSlide(modalCurrentIndex - 1));
    modalNextBtn.addEventListener('click', () => showModalSlide(modalCurrentIndex + 1));
}

function closeModal() {
    modal.style.display = 'none';
}

function showModalSlide(index) {
    const slides = modalImageContainer.querySelectorAll('.modal-slide');
    slides.forEach(slide => slide.classList.remove('active'));
    if (index >= slides.length) {
        modalCurrentIndex = 0;
    } else if (index < 0) {
        modalCurrentIndex = slides.length - 1;
    } else {
        modalCurrentIndex = index;
    }
    slides[modalCurrentIndex].classList.add('active');
}