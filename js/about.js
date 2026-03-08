// js/about.js

let loggedInUser = null; 

// =========================================================
// AUTHENTICATION UI VARIABLES & SETUP
// We only need the core logic to display the modal and handle sessions.
// =========================================================
let isRegisterMode = false;
let authModal, authButton, authForm, authTitle, authSubmit, registerFields, authToggleLink, authMessage;

// --- Authentication Functions (Copied from main.js/gallery.js) ---

async function checkLoginStatus() {
    try {
        const response = await fetch('api/get_session.php');
        const data = await response.json();
        
        if (data.logged_in) {
            loggedInUser = { 
                id: data.user_id, 
                username: data.username 
            };
            updateAuthUI(true); 
        } else {
            loggedInUser = null;
            updateAuthUI(false); 
        }
    } catch(e) {
        console.warn("Could not check session status.");
        loggedInUser = null;
        updateAuthUI(false);
    }
}

function updateAuthUI(isLoggedIn) {
    if (!authButton) return;

    if (isLoggedIn) {
        // --- MODIFIED LOGIC ---
        // Change button text to show username
        authButton.innerHTML = `<span class="material-symbols-outlined">account_circle</span> ${loggedInUser.username}`;
        
        // Change button action to navigate to profile.html
        authButton.removeEventListener('click', openAuthModal);
        authButton.removeEventListener('click', handleLogout); // Ensure no residual logout listener
        authButton.addEventListener('click', () => {
             window.location.href = 'profile.html'; // Navigate to the new page
        }); 
        
        // Add a long-press/right-click listener to allow logout from the profile button itself
        authButton.oncontextmenu = (e) => {
            e.preventDefault();
            if(confirm("Log out of VistaVignettes?")) {
                handleLogout();
            }
        };

    } else {
        // --- ORIGINAL LOGIN LOGIC ---
        authButton.innerHTML = `<span class="material-symbols-outlined">person</span>`;
        authButton.removeEventListener('click', handleLogout);
        authButton.removeEventListener('click', openAuthModal); // Remove any residual listener first
        authButton.addEventListener('click', openAuthModal);
        authButton.oncontextmenu = null; // Remove context menu on log out
    }
}

function openAuthModal() {
    if (!authModal) {
        console.error("Authentication modal element not found.");
        return;
    }
    setFormMode('login');
    authModal.style.display = 'flex';
    authModal.classList.remove('close');
    authModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
    if (!authModal) return;

    authModal.classList.remove('open');
    authModal.classList.add('close');
    
    const onAnimationEnd = () => {
        if (authModal.classList.contains('close')) {
            authModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            authModal.removeEventListener('animationend', onAnimationEnd);
        }
    };
    authModal.addEventListener('animationend', onAnimationEnd);
}

function setFormMode(mode) {
    if (!authTitle || !authSubmit || !registerFields || !authToggleLink || !authMessage) return;
    
    isRegisterMode = (mode === 'register');
    authTitle.textContent = isRegisterMode ? "Create Your VistaVignettes Account" : "Log In to VistaVignettes";
    authSubmit.textContent = isRegisterMode ? "Register" : "Log In";
    registerFields.style.display = isRegisterMode ? 'block' : 'none';
    authToggleLink.innerHTML = isRegisterMode ? "Already have an account? <strong>LOG IN</strong>" : "Need an account? <strong>Sign Up</strong>";
    authMessage.textContent = ''; 
}

function toggleFormMode(e) {
    e.preventDefault();
    setFormMode(isRegisterMode ? 'login' : 'register');
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    authMessage.textContent = ''; 

    const usernameInput = document.getElementById('auth-username').value.trim();
    const passwordInput = document.getElementById('auth-password').value;
    const emailInput = document.getElementById('register-email')?.value.trim();

    let apiUrl = isRegisterMode ? 'api/register.php' : 'api/login.php';
    let data = { username: usernameInput, password: passwordInput };
    if (isRegisterMode) {
        if (!emailInput) { authMessage.textContent = "Email is required for registration."; return; }
        data.email = emailInput;
    }
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (response.ok && (response.status === 200 || response.status === 201)) {
            authMessage.style.color = 'green';
            authMessage.textContent = result.message || "Success!";
            
            if (!isRegisterMode) {
                loggedInUser = { id: result.user_id, username: result.username };
                updateAuthUI(true); 
            }
            
            setTimeout(() => {
                closeAuthModal();
                if (!isRegisterMode) window.location.reload(); 
            }, 1000);

        } else {
            authMessage.style.color = 'red';
            authMessage.textContent = result.message || `Authentication failed.`;
        }

    } catch (e) {
        authMessage.style.color = 'red';
        authMessage.textContent = "Network error or server connection failed.";
    }
}

async function handleLogout() {
    try {
        const response = await fetch('api/logout.php');
        if (response.ok) {
            loggedInUser = null;
            updateAuthUI(false);
            alert("Logged out successfully.");
            window.location.reload(); 
        } else {
            alert("Logout failed.");
        }
    } catch (e) {
        console.error("Logout Fetch Error:", e);
    }
}


// --- DOM Content Loaded Initialization ---
document.addEventListener('DOMContentLoaded', async function(){
    
    // 1. Authentication UI Initialization
    authModal = document.getElementById('auth-modal');
    authButton = document.getElementById('auth-button');
    authForm = document.getElementById('auth-form');
    authTitle = document.getElementById('auth-title');
    authSubmit = document.getElementById('auth-submit');
    registerFields = document.getElementById('register-fields');
    authToggleLink = document.getElementById('toggle-register');
    authMessage = document.getElementById('auth-message');
    const closeAuthButton = document.querySelector('.close-auth-button'); 
    
    // Check login status first (will run updateAuthUI, setting up the button's action)
    await checkLoginStatus(); 

    // Authentication Event Listeners
    if (closeAuthButton) {
        closeAuthButton.addEventListener('click', closeAuthModal);
    }
    if (authModal) {
        authModal.addEventListener('click', (event) => {
            if (event.target === authModal) closeAuthModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && authModal.style.display === 'flex') {
                closeAuthModal();
            }
        });
    }
    if (authToggleLink) {
        authToggleLink.addEventListener('click', toggleFormMode);
    }
    if (authForm) {
        authForm.addEventListener('submit', handleAuthSubmit);
    }
});