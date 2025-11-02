# 🎀 Ateliê Marilu - Site & Painel Admin

![Logo Ateliê Marilu](images/logo.png)

Este é o repositório do site de vitrine (e-commerce) para o Ateliê Marilu, focado na exibição de produtos artesanais para bebês, como kits de naninha e bichinhos de pelúcia.

O projeto é dividido em duas partes principais:
1.  **Site Público:** A vitrine dinâmica que clientes acessam. Ela lê os produtos diretamente do Firebase.
2.  **Painel Administrativo:** Uma área segura (`/admin/admin.html`) onde a proprietária pode gerenciar todos os produtos e o carrossel de imagens sem precisar tocar no código.

---

## ✨ Funcionalidades

### 🛍️ Site Público (`index.html`)

* **Carrossel Dinâmico:** As imagens do carrossel principal são carregadas do Firebase e podem ser alteradas a qualquer momento pelo painel admin.
* **Auto-play no Carrossel:** As imagens passam automaticamente, mas o usuário também pode navegar manualmente.
* **Catálogo Dinâmico:** Os produtos (kits e itens) são carregados do banco de dados Firebase (Firestore).
* **Agrupamento por Preço:** Os produtos são exibidos em seções agrupadas por faixa de preço, assim como no layout estático original.
* **Modal de Produtos:** Ao clicar em um produto, um pop-up (modal) se abre com uma galeria de fotos exclusiva para aquele item.
* **Links de Contato:** Botão de WhatsApp e link para o Instagram no rodapé para facilitar o contato e a venda.

### 🔐 Painel Administrativo (`admin/admin.html`)

* **Autenticação Segura:** Protegido por login e senha através do Firebase Authentication.
* **Gerenciamento de Produtos:** A proprietária pode Adicionar e Excluir qualquer Kit ou Item.
* **Upload de Múltiplas Fotos:** Suporte para enviar várias fotos de uma vez para cada produto.
* **Gerenciamento do Carrossel:** Uma seção dedicada para adicionar ou remover fotos do carrossel principal do site.
* **Armazenamento na Nuvem:** Todas as imagens são enviadas para o Firebase Storage.

---

## 🛠️ Tecnologias Utilizadas

* **Frontend:** HTML5, CSS3, JavaScript (ES6+)
* **Backend (BaaS):** [Firebase](https://firebase.google.com/)
    * **Autenticação:** Firebase Authentication (para login do admin)
    * **Banco de Dados:** Cloud Firestore (para salvar as informações dos produtos)
    * **Armazenamento:** Firebase Storage (para hosp
