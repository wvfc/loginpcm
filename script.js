// script.js
let isLogin = true;

const autorizados = ['walter', 'admin', 'tecnico123'];

let db;
const request = indexedDB.open('UsuariosDB', 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const objectStore = db.createObjectStore('usuarios', { keyPath: 'username' });
};

request.onsuccess = function(event) {
    db = event.target.result;
};

request.onerror = function(event) {
    alert('Erro ao acessar banco de dados!');
};

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

function handleSubmit() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        alert('Preencha todos os campos.');
        return;
    }

    if (isLogin) {
        login(username, password);
    } else {
        register(username, password);
    }
}

function login(username, password) {
    const transaction = db.transaction(['usuarios'], 'readonly');
    const objectStore = transaction.objectStore('usuarios');
    const request = objectStore.get(username);

    request.onsuccess = async function(event) {
        const result = event.target.result;
        if (!result) {
            alert('Usuário não encontrado!');
            return;
        }
        const passwordHash = await hashPassword(password);
        if (result.password === passwordHash) {
            alert('Login bem-sucedido!');
            window.location.href = 'https://plataformapcm.netlify.app';
        } else {
            alert('Senha incorreta!');
        }
    };

    request.onerror = function(event) {
        alert('Erro ao buscar usuário.');
    }
}

async function register(username, password) {
    if (!autorizados.includes(username)) {
        alert('Usuário não autorizado a registrar!');
        return;
    }

    const transaction = db.transaction(['usuarios'], 'readonly');
    const objectStore = transaction.objectStore('usuarios');

    const checkRequest = objectStore.get(username);

    checkRequest.onsuccess = async function(event) {
        if (event.target.result) {
            alert('Usuário já existe!');
        } else {
            const passwordHash = await hashPassword(password);
            const writeTransaction = db.transaction(['usuarios'], 'readwrite');
            const writeStore = writeTransaction.objectStore('usuarios');
            writeStore.add({ username, password: passwordHash });

            writeTransaction.oncomplete = function() {
                alert('Usuário registrado com sucesso! Faça login.');
                toggleMode();
            };

            writeTransaction.onerror = function() {
                alert('Erro ao registrar usuário.');
            };
        }
    };

    checkRequest.onerror = function(event) {
        alert('Erro ao verificar usuário.');
    }
}

function toggleMode() {
    isLogin = !isLogin;
    document.getElementById('formTitle').innerText = isLogin ? 'Login' : 'Cadastro';
    document.getElementById('submitButton').innerText = isLogin ? 'Entrar' : 'Registrar';
    document.querySelector('.toggle').innerText = isLogin ? 'Novo aqui? Cadastre-se' : 'Já tem uma conta? Faça login';
}
