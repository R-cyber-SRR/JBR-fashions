// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyCr_RKLXTFJ_mM3_mH7NHYG9k41W5ojr4I",
  authDomain: "jbr-fashions.firebaseapp.com",
  projectId: "jbr-fashions",
  storageBucket: "jbr-fashions.firebasestorage.app",
  messagingSenderId: "867415543398",
  appId: "1:867415543398:web:91bc40787fadba964fa7a7",
  measurementId: "G-PKLS4RZ8GH"
};

// --- Initialize Firebase ---
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- Local Fallback Products ---
const products = [
  {
    id: 1,
    name: "Classic T-Shirt",
    price: 399.99,
    image: "ClassicT-Shir.png",
    description: "A timeless classic T-shirt made from 100% cotton. Soft, breathable, and perfect for everyday casual wear."
  },
  {
    id: 2,
    name: "Denim Jeans",
    price: 799.99,
    image: "DenimJeans.png",
    description: "Comfortable and stylish denim jeans for everyday wear. Durable fabric with a modern fit."
  },
  {
    id: 3,
    name: "Hoodie",
    price: 599.99,
    image: "hoodie.png",
    description: "Warm and cozy hoodie, perfect for chilly days. Features a front pocket and adjustable drawstring hood."
  },
  {
    id: 4,
    name: "Cargo Pant",
    price: 699.99,
    image: "cargoPant.png",
    description: "Versatile cargo pants with multiple pockets. Ideal for outdoor activities and casual outings."
  },
  {
    id: 5,
    name: "Classic Shirt",
    price: 999.99,
    image: "ClassicShirt.png",
    description: "Elegant classic shirt crafted from premium fabric. Suitable for both formal and semi-formal occasions."
  },
  {
    id: 6,
    name: "Formal Pant",
    price: 999.99,
    image: "formal_Pant.png",
    description: "Tailored formal pants with a sleek finish. Perfect for office wear and special events."
  }
];

// --- Initialize products in Firestore (run once, comment out after) ---
// function initProducts() {
//   products.forEach(product => {
//     db.collection("products").doc(product.id.toString()).set(product)
//       .catch(error => console.error("Error adding product:", error));
//   });
// }
// initProducts(); // Uncomment to initialize products, then comment out to avoid duplicates

// --- Product Rendering ---
function renderProducts() {
  const productGrid = document.getElementById("product-grid");
  if (!productGrid) return;
  productGrid.innerHTML = "";
  db.collection("products").get().then(querySnapshot => {
    if (querySnapshot.empty) {
      // Fallback to local products
      products.forEach(product => {
        const productCard = document.createElement("div");
        productCard.className = "product-card bg-white shadow-md rounded-lg p-4 flex flex-col items-center";
        productCard.innerHTML = `
          <a href="product.html?id=${product.id}">
            <img src="${product.image}" alt="${product.name}" class="w-32 h-32 object-cover mb-4">
            <h3 class="text-lg font-semibold">${product.name}</h3>
          </a>
          <p class="text-gray-600">₹${product.price.toFixed(2)}</p>
          <button class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-4" onclick="addToCart('${product.id}')">
            Add to Cart
          </button>
        `;
        productGrid.appendChild(productCard);
      });
    } else {
      querySnapshot.forEach(doc => {
        const product = doc.data();
        const productCard = document.createElement("div");
        productCard.className = "product-card bg-white shadow-md rounded-lg p-4 flex flex-col items-center";
        productCard.innerHTML = `
          <a href="product.html?id=${product.id}">
            <img src="${product.image}" alt="${product.name}" class="w-32 h-32 object-cover mb-4">
            <h3 class="text-lg font-semibold">${product.name}</h3>
          </a>
          <p class="text-gray-600">₹${product.price.toFixed(2)}</p>
          <button class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-4" onclick="addToCart('${product.id}')">
            Add to Cart
          </button>
        `;
        productGrid.appendChild(productCard);
      });
    }
  }).catch(error => console.error("Error fetching products:", error));
}

// --- Cart Functions ---
function getCart() {
  const user = auth.currentUser;
  if (user) {
    // Firestore cart will be handled in renderCart
    return null;
  }
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  const user = auth.currentUser;
  if (user) {
    // Firestore cart handled separately
    return;
  }
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(productId) {
  const user = auth.currentUser;
  if (user) {
    db.collection("products").doc(productId.toString()).get().then(doc => {
      if (doc.exists) {
        const product = doc.data();
        db.collection("carts").doc(user.uid).collection("items").add(product)
          .then(() => {
            alert(`${product.name} added to cart!`);
            if (window.location.pathname.includes("cart.html")) {
              renderCart();
            }
          })
          .catch(error => console.error("Error adding to cart:", error));
      }
    });
  } else {
    const product = products.find(p => p.id == productId);
    const cart = getCart();
    cart.push(product);
    saveCart(cart);
    if (window.location.pathname.includes("cart.html")) {
      renderCart();
    }
    alert(`${product.name} added to cart!`);
  }
}

function buyNow(productId) {
  addToCart(productId);
  window.location.href = "cart.html";
}

function renderCart() {
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  if (!cartItems || !cartTotal) return;
  const user = auth.currentUser;
  if (user) {
    db.collection("carts").doc(user.uid).collection("items").get().then(querySnapshot => {
      cartItems.innerHTML = "";
      if (querySnapshot.empty) {
        cartItems.innerHTML = "<p>Your cart is empty.</p>";
        cartTotal.textContent = "Total: ₹0.00";
      } else {
        let total = 0;
        querySnapshot.forEach(doc => {
          const item = doc.data();
          total += item.price;
          const cartItem = document.createElement("div");
          cartItem.className = "flex justify-between mb-2";
          cartItem.innerHTML = `
            <span>${item.name}</span>
            <div>
              <span>₹${item.price.toFixed(2)}</span>
              <button class="ml-4 text-red-500 hover:text-red-700" onclick="removeFromCart('${doc.id}', true)">Remove</button>
            </div>
          `;
          cartItems.appendChild(cartItem);
        });
        cartTotal.textContent = `Total: ₹${total.toFixed(2)}`;
      }
    }).catch(error => console.error("Error fetching cart:", error));
  } else {
    const cart = getCart();
    cartItems.innerHTML = "";
    if (cart.length === 0) {
      cartItems.innerHTML = "<p>Your cart is empty.</p>";
      cartTotal.textContent = "Total: ₹0.00";
    } else {
      cart.forEach((item, index) => {
        const cartItem = document.createElement("div");
        cartItem.className = "flex justify-between mb-2";
        cartItem.innerHTML = `
          <span>${item.name}</span>
          <div>
            <span>₹${item.price.toFixed(2)}</span>
            <button class="ml-4 text-red-500 hover:text-red-700" onclick="removeFromCart(${index}, false)">Remove</button>
          </div>
        `;
        cartItems.appendChild(cartItem);
      });
      const total = cart.reduce((sum, item) => sum + item.price, 0);
      cartTotal.textContent = `Total: ₹${total.toFixed(2)}`;
    }
  }
}

function removeFromCart(id, isFirebase) {
  const user = auth.currentUser;
  if (user && isFirebase) {
    db.collection("carts").doc(user.uid).collection("items").doc(id).delete()
      .then(() => renderCart())
      .catch(error => console.error("Error removing from cart:", error));
  } else {
    const cart = getCart();
    cart.splice(id, 1);
    saveCart(cart);
    renderCart();
  }
}

// --- Auth Link ---
function updateAuthLink() {
  const authLink = document.getElementById("auth-link");
  if (!authLink) return;
  auth.onAuthStateChanged(user => {
    if (user) {
      authLink.textContent = "Logout";
      authLink.onclick = () => {
        auth.signOut().then(() => window.location.href = "login.html");
      };
    } else {
      authLink.textContent = "Login";
      authLink.onclick = () => {
        window.location.href = "login.html";
      };
    }
  });
}

// --- Auth Form (Login/Register) ---
function setupAuthForm() {
  const formTitle = document.getElementById("form-title");
  const authButton = document.getElementById("auth-button");
  const toggleText = document.getElementById("toggle-text");
  const toggleLink = document.getElementById("toggle-link");
  if (!formTitle || !authButton || !toggleText || !toggleLink) return;

  let isLogin = true;

  const updateForm = () => {
    formTitle.textContent = isLogin ? "Login" : "Register";
    authButton.textContent = isLogin ? "Login" : "Register";
    toggleText.textContent = isLogin ? "Don't have an account?" : "Already have an account?";
    toggleLink.textContent = isLogin ? "Register" : "Login";
  };

  toggleLink.onclick = (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    updateForm();
  };

  authButton.onclick = () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    if (!email || !password) {
      alert("Please fill in all fields.");
      return;
    }
    if (isLogin) {
      auth.signInWithEmailAndPassword(email, password)
        .then(() => {
          alert("Logged in successfully!");
          window.location.href = "account.html";
        })
        .catch(error => alert("Error logging in: " + error.message));
    } else {
      auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
          alert("Registered successfully!");
          window.location.href = "account.html";
        })
        .catch(error => alert("Error registering: " + error.message));
    }
  };

  updateForm();
}

// --- Account Rendering ---
function renderAccount() {
  const accountInfo = document.getElementById("account-info");
  if (!accountInfo) return;
  auth.onAuthStateChanged(user => {
    if (user) {
      accountInfo.innerHTML = `
        <p class="mb-4"><strong>Email:</strong> ${user.email}</p>
        <button class="bg-red-500 text-white w-full py-2 rounded hover:bg-red-600" onclick="logout()">Logout</button>
      `;
    } else {
      accountInfo.innerHTML = `
        <p class="mb-4">You are not logged in.</p>
        <a href="login.html" class="text-blue-500 hover:underline">Go to Login</a>
      `;
    }
  });
}

function logout() {
  auth.signOut().then(() => window.location.href = "login.html");
}