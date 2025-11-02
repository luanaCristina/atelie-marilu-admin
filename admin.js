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

// Referências para os serviços do Firebase
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Referências para os elementos do HTML (Produtos)
const loginContainer = document.getElementById('login-container');
const adminPanel = document.getElementById('admin-panel');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const userEmail = document.getElementById('user-email');
const addProductForm = document.getElementById('add-product-form');
const uploadStatus = document.getElementById('upload-status');
const kitsList = document.getElementById('kits-list');
const itemsList = document.getElementById('items-list');
const submitButton = document.getElementById('submit-button');

// Referências para os elementos do HTML (Carrossel)
const carouselForm = document.getElementById('carousel-form');
const carouselImagesInput = document.getElementById('carousel-images');
const carouselUploadButton = document.getElementById('carousel-upload-button');
const carouselUploadStatus = document.getElementById('carousel-upload-status');
const carouselImagesList = document.getElementById('carousel-images-list');

//
// --- LÓGICA DE AUTENTICAÇÃO ---
//

// Monitora se o usuário está logado ou não
auth.onAuthStateChanged(user => {
    if (user) {
        // Usuário está logado
        loginContainer.style.display = 'none';
        adminPanel.style.display = 'block';
        userEmail.textContent = user.email;
        loadProducts(); // Carrega os produtos
        loadCarouselImages(); // Carrega as imagens do carrossel
    } else {
        // Usuário não está logado
        loginContainer.style.display = 'flex';
        adminPanel.style.display = 'none';
        userEmail.textContent = '';
    }
});

// Evento de clique do botão de Login
loginButton.addEventListener('click', () => {
    const email = loginEmail.value;
    const password = loginPassword.value;

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Sucesso no login
            loginError.textContent = '';
        })
        .catch(error => {
            // Erro no login
            loginError.textContent = 'E-mail ou senha incorretos.';
        });
});

// Evento de clique do botão de Logout
logoutButton.addEventListener('click', () => {
    auth.signOut();
});

//
// --- LÓGICA DE UPLOAD DE PRODUTOS ---
//

addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede o envio tradicional do formulário
    
    const name = document.getElementById('product-name').value;
    const type = document.getElementById('product-type').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const files = document.getElementById('product-images').files;

    if (files.length === 0) {
        uploadStatus.textContent = 'Por favor, selecione pelo menos uma imagem.';
        return;
    }

    submitButton.disabled = true;
    uploadStatus.textContent = 'Enviando imagens...';

    try {
        // 1. Fazer upload das imagens (agora na pasta 'products')
        const imageUrls = await uploadImages(files, 'products'); // Passa a subpasta
        uploadStatus.textContent = 'Salvando produto no banco de dados...';

        // 2. Salvar as informações do produto no Firestore
        await db.collection('products').add({
            name: name,
            type: type, // 'kit' or 'item'
            price: price,
            imageUrls: imageUrls, // Array com as URLs das imagens
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 3. Limpar formulário e dar feedback
        addProductForm.reset();
        uploadStatus.textContent = 'Produto salvo com sucesso!';
        submitButton.disabled = false;

    } catch (error) {
        console.error("Erro ao salvar produto:", error);
        uploadStatus.textContent = `Erro ao salvar: ${error.message}`;
        submitButton.disabled = false;
    }
});

//
// --- LÓGICA DE UPLOAD DO CARROSSEL ---
//
carouselForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const files = carouselImagesInput.files;
    if (files.length === 0) {
        carouselUploadStatus.textContent = 'Por favor, selecione ao menos uma imagem.';
        return;
    }

    carouselUploadButton.disabled = true;
    carouselUploadStatus.textContent = 'Enviando imagens...';

    try {
        // 1. Fazer upload (na pasta 'carousel')
        const imageUrls = await uploadImages(files, 'carousel'); 

        // 2. Salvar no Firestore (coleção 'carouselImages')
        carouselUploadStatus.textContent = 'Salvando no banco de dados...';
        const batch = db.batch(); // Usar um "batch" para salvar várias imagens
        imageUrls.forEach(url => {
            const docRef = db.collection('carouselImages').doc(); // Cria um novo doc
            batch.set(docRef, {
                imageUrl: url,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        await batch.commit();

        carouselForm.reset();
        carouselUploadStatus.textContent = 'Imagens do carrossel salvas!';
        carouselUploadButton.disabled = false;

    } catch (error) {
        console.error("Erro ao salvar imagens do carrossel:", error);
        carouselUploadStatus.textContent = `Erro: ${error.message}`;
        carouselUploadButton.disabled = false;
    }
});


//
// --- FUNÇÃO DE UPLOAD DE IMAGENS (MODIFICADA) ---
//
async function uploadImages(files, subfolder) { // Adicionado 'subfolder'
    const uploadTasks = [];
    const imageUrls = [];

    for (const file of files) {
        // USA A SUBPASTA (ex: 'products/' ou 'carousel/')
        const storageRef = storage.ref(`${subfolder}/${Date.now()}_${file.name}`);
        const task = storageRef.put(file);
        uploadTasks.push(task);

        task.on('state_changed', 
            (snapshot) => {
                // Progresso do upload
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                // Atualiza o status correto
                if (subfolder === 'products') {
                    uploadStatus.textContent = `Enviando imagem ${files.length > 1 ? (uploadTasks.length) : ''}: ${progress.toFixed(0)}%`;
                } else {
                    carouselUploadStatus.textContent = `Enviando imagem ${files.length > 1 ? (uploadTasks.length) : ''}: ${progress.toFixed(0)}%`;
                }
            },
            (error) => {
                throw error; // Propaga o erro para o 'catch' principal
            },
            async () => {
                // Upload completo, pega a URL
                const downloadURL = await task.snapshot.ref.getDownloadURL();
                imageUrls.push(downloadURL);
            }
        );
    }
    
    // Espera todas as tarefas de upload terminarem
    await Promise.all(uploadTasks);
    return imageUrls;
}

//
// --- LÓGICA DE CARREGAR E EXCLUIR PRODUTOS ---
//
function loadProducts() {
    db.collection('products').orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => { // onSnapshot ouve em tempo real
        
        kitsList.innerHTML = ''; // Limpa as listas
        itemsList.innerHTML = '';
        
        snapshot.forEach(doc => {
            const product = doc.data();
            product.id = doc.id; // Adiciona o ID do documento ao objeto
            
            const card = createProductCard(product);
            
            if (product.type === 'kit') {
                kitsList.appendChild(card);
            } else {
                itemsList.appendChild(card);
            }
        });
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card-admin';
    
    card.innerHTML = `
        <img src="${product.imageUrls[0]}" alt="${product.name}">
        <h4>${product.name}</h4>
        <p>R$ ${product.price.toFixed(2)}</p>
        <button class="delete-button" data-id="${product.id}" data-images='${JSON.stringify(product.imageUrls)}'>X</button>
    `;
    
    // Adiciona o evento de clique no botão de excluir
    card.querySelector('.delete-button').addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const images = JSON.parse(e.target.dataset.images);
        
        if (confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`)) {
            try {
                // 1. Excluir do Firestore
                await db.collection('products').doc(id).delete();
                
                // 2. Excluir imagens do Storage
                for (const url of images) {
                    const imageRef = storage.refFromURL(url);
                    await imageRef.delete();
                }
                
                // alert('Produto excluído com sucesso!'); // Opcional
            } catch (error) {
                console.error("Erro ao excluir produto:", error);
                alert('Erro ao excluir produto.');
            }
        }
    });
    return card;
}

//
// --- LÓGICA DE CARREGAR E EXCLUIR IMAGENS DO CARROSSEL ---
//

function loadCarouselImages() {
    db.collection('carouselImages').orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        carouselImagesList.innerHTML = '';
        snapshot.forEach(doc => {
            const image = doc.data();
            image.id = doc.id;
            const card = createCarouselImageCard(image);
            carouselImagesList.appendChild(card);
        });
    });
}

function createCarouselImageCard(image) {
    const card = document.createElement('div');
    card.className = 'product-card-admin'; // Reutiliza o estilo
    card.innerHTML = `
        <img src="${image.imageUrl}" alt="Imagem Carrossel">
        <button class="delete-button" data-id="${image.id}" data-url="${image.imageUrl}">X</button>
    `;
    
    // Adiciona o evento de clique no botão de excluir
    card.querySelector('.delete-button').addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const url = e.target.dataset.url;
        
        if (confirm('Tem certeza que deseja excluir esta imagem do carrossel?')) {
            try {
                // 1. Excluir do Firestore
                await db.collection('carouselImages').doc(id).delete();
                // 2. Excluir do Storage
                const imageRef = storage.refFromURL(url);
                await imageRef.delete();
            } catch (error) {
                console.error("Erro ao excluir imagem:", error);
                alert('Erro ao excluir imagem.');
            }
        }
    });
    return card;
}