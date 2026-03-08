// js/profile.js

// Global variables for modals, user state (Copied from gallery.js)
let imageModal, modal, modalImage, modalImageTitle, modalImageDescription, modalDownloadButton, closeButton, modalFavoriteIcon;
let loggedInUser = null; 
let isRegisterMode = false;
let authModal, authButton, authForm, authTitle, authSubmit, registerFields, authToggleLink, authMessage;


// --- AUTHENTICATION & SESSION FUNCTIONS (Copied from gallery.js) ---

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
            return true; // Return true to signal successful login
        } else {
            loggedInUser = null;
            updateAuthUI(false); 
            return false;
        }
    } catch(e) {
        console.warn("Could not check session status for Profile.");
        loggedInUser = null;
        updateAuthUI(false);
        return false;
    }
}

function updateAuthUI(isLoggedIn) {
    if (!authButton) return;

    if (isLoggedIn) {
        authButton.innerHTML = `<span class="material-symbols-outlined">account_circle</span> ${loggedInUser.username}`;
        authButton.removeEventListener('click', openAuthModal);
        authButton.removeEventListener('click', handleLogout); 
        authButton.addEventListener('click', () => {
             // Already on profile page, so clicking logs out
             handleLogout(); 
        }); 
        authButton.oncontextmenu = (e) => {
            e.preventDefault();
            if(confirm("Log out of VistaVignettes?")) {
                handleLogout();
            }
        };

    } else {
        authButton.innerHTML = `<span class="material-symbols-outlined">person</span>`;
        authButton.removeEventListener('click', handleLogout);
        authButton.removeEventListener('click', openAuthModal);
        authButton.addEventListener('click', openAuthModal);
        authButton.oncontextmenu = null; 
    }
}

function openAuthModal() {
    if (!authModal) { console.error("Authentication modal element not found."); return; }
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
    authToggleLink.innerHTML = isRegisterMode ? "Already have an account? <strong>Log In</strong>" : "Need an account? <strong>Register</strong>";
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
            window.location.href = 'index.html'; // Redirect to home page after logout
        } else {
            alert("Logout failed.");
        }
    } catch (e) {
        console.error("Logout Fetch Error:", e);
    }
}

// --- CORE GALLERY FUNCTIONS (Adapted for Profile) ---

async function forceDownload(imageURL, imageId) {
    try {
        await fetch('api/log_download.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_id: imageId })
        });
        
        const response = await fetch(imageURL);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const filename = imageURL.split('/').pop(); 

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
    } catch (e) {
        console.error("Error during download:", e);
        alert("Could not download the image. Please try again.");
    }
}

/**
 * Toggles the favorite status (and reloads the profile page if unfavorited)
 */
async function toggleFavorite(imageId, heartElement) {
    // Check if user is logged in
    if (!loggedInUser) {
        openAuthModal();
        return;
    }
    
    const isCurrentlyFavorited = heartElement.classList.contains('favorited');
    console.log(`Profile: Toggling favorite for image ${imageId}, currently favorited: ${isCurrentlyFavorited}`);
    
    try {
        const response = await fetch('api/toggle_favorite.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_id: imageId })
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to process request.");
        }
        
        // Update UI based on server response
        if (result.status === "added") {
            heartElement.textContent = 'favorite';
            heartElement.classList.add('favorited');
            console.log("Profile: Added to favorites");
        } else if (result.status === "removed") {
            heartElement.textContent = 'favorite_border';
            heartElement.classList.remove('favorited');
            console.log("Profile: Removed from favorites");
            
            // CRITICAL FOR PROFILE PAGE: If the user unfavorites an image, reload the grid
            setTimeout(() => {
                loadProfileImages(loggedInUser.id);
            }, 300);
        }
        
    } catch (e) {
        alert(`Error: ${e.message}`);
        console.error("Favorite toggle error:", e);
    }
}


/**
 * NEW CORE FUNCTION: Fetches and displays only the user's favorited images.
 */
async function loadProfileImages(userId) {
    const api_url = `/Wallpapersite/api/get_images.php?is_sphere_image=0&is_favorited=1&user_id=${userId}`;
    
    try {
        const response = await fetch(api_url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        const allImages = data.imagePaths;
        const galleryGrid = document.getElementById('gallery-grid');
        const profileTitle = document.getElementById('profile-title');

        if (!galleryGrid || !profileTitle) return;

        profileTitle.textContent = `${loggedInUser.username}'s Favorites`;
        galleryGrid.innerHTML = '';

        if (!allImages || allImages.length === 0) {
            galleryGrid.innerHTML = '<p>You haven\'t added any wallpapers to your favorites yet. Go to the <a href="gallery.html">Gallery</a> to save some!</p>';
            return;
        }

        allImages.forEach(image => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';

            const fullImageUrl = image.path;
            const imageId = image.id; 

            // Image, Icons, and Buttons creation (similar to gallery.js)
            const img = document.createElement('img');
            img.src = fullImageUrl;
            img.alt = image.name;
            img.loading = 'lazy';
            
            const favoriteIcon = document.createElement('span');
            favoriteIcon.className = 'favorite-icon material-symbols-outlined favorited';
            favoriteIcon.textContent = 'favorite'; // Always filled on the profile page since these are favorites
            
            // Event listener to toggle favorite status
            favoriteIcon.addEventListener('click', (event) => {
                event.stopPropagation();
                // Since this is the profile page, unfavoriting reloads the grid
                toggleFavorite(imageId, favoriteIcon);
            });
            
            const downloadButton = document.createElement('a');
            downloadButton.className = 'download-button';
            downloadButton.textContent = 'Download';
            downloadButton.addEventListener('click', (event) => {
                event.preventDefault();
                forceDownload(fullImageUrl, imageId); 
            });

            galleryItem.appendChild(img);
            galleryItem.appendChild(favoriteIcon); 
            galleryItem.appendChild(downloadButton);
            
            galleryItem.addEventListener('click', () => {
                openModal(imageId, fullImageUrl, image.name, image.description, true); // Always favorited on profile page
            });

            galleryGrid.appendChild(galleryItem);
        });

    } catch (e) {
        console.error("Error loading profile images:", e);
        const galleryGrid = document.getElementById('gallery-grid');
        if (galleryGrid) {
            galleryGrid.innerHTML = `<p>Error fetching your favorites. Please try again later.</p>`;
        }
    }
}

// --- MODAL FUNCTIONS ---

function openModal(imageId, imageSrc, title, description, isFavorited) {
    if (!imageModal || !modalImage) return;

    modalImage.src = imageSrc;
    modalImage.alt = title;
    modalImageTitle.textContent = title;
    modalImageDescription.textContent = description;

    let absoluteImageUrl = new URL(imageSrc, window.location.href).href;
    
    // Update Modal Download Button
    modalDownloadButton.removeEventListener('click', modalDownloadHandler);
    modalDownloadButton.addEventListener('click', (event) => {
        event.preventDefault();
        forceDownload(absoluteImageUrl, imageId);
    });

    // Update Modal Favorite Button
    if (modalFavoriteIcon) {
        modalFavoriteIcon.textContent = isFavorited === 1 ? 'favorite' : 'favorite_border';
        if (isFavorited === 1) {
            modalFavoriteIcon.classList.add('favorited');
        } else {
            modalFavoriteIcon.classList.remove('favorited');
        }
        modalFavoriteIcon.setAttribute('data-image-id', imageId); 

        // Ensure only one listener is active
        modalFavoriteIcon.removeEventListener('click', modalFavoriteHandler);
        modalFavoriteIcon.addEventListener('click', (event) => {
            event.stopPropagation(); 
            toggleFavorite(imageId, modalFavoriteIcon);
        });
    }

    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = scrollBarWidth + 'px';
    document.body.style.overflow = 'hidden';

    modal.classList.remove('close');
    modal.classList.add('open');
    imageModal.style.display = 'flex';
}

function closeModal() {
    if (imageModal && modal) {
        modal.classList.remove('open');
        modal.classList.add('close');

        const onAnimationEnd = () => {
            if (modal.classList.contains('close')) {
                imageModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                document.body.style.paddingRight = '';
                modal.removeEventListener('animationend', onAnimationEnd);
            }
        };
        modal.addEventListener('animationend', onAnimationEnd);
    }
}

// Handler for the modal download button (dummy handler)
function modalDownloadHandler(event) {
    event.preventDefault();
}

// Handler for the modal favorite button (dummy handler)
function modalFavoriteHandler(event) {
    event.preventDefault(); 
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
    
    const isAuthenticated = await checkLoginStatus(); 

    // --- ENFORCE LOGIN ---
    if (!isAuthenticated) {
        document.querySelector('main').innerHTML = `
            <section class="gallery-section" style="padding: 100px 0;">
                <h2>Access Denied</h2>
                <p>Please log in to view your personalized profile.</p>
                <button class="download-button" style="width: 200px; margin-top: 20px;" onclick="document.getElementById('auth-button').click()">Log In</button>
            </section>
        `;
        // Open modal automatically for better UX
        setTimeout(openAuthModal, 50); 
        return;
    }
    // --- END ENFORCE LOGIN ---


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
    
    // 2. Image Modal Initialization
    imageModal = document.getElementById('image-modal');
    modal = imageModal; // Use imageModal itself if it represents the overall container
    modalImage = document.getElementById('modal-image');
    modalImageTitle = document.getElementById('modal-image-title');
    modalImageDescription = document.getElementById('modal-image-description');
    modalDownloadButton = document.getElementById('modal-download-button');
    modalFavoriteIcon = document.getElementById('modal-favorite-icon');
    closeButton = imageModal ? imageModal.querySelector('.close-button:not(.close-auth-button)') : null;

    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }
    if (imageModal) {
        imageModal.addEventListener('click', (event) => {
            if (event.target === imageModal) closeModal();
        });
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && imageModal.style.display === 'flex') {
                closeModal();
            }
        });
    }
    
    // 3. Profile Content Initialization
    
    // Start loading the user's favorites
    loadProfileImages(loggedInUser.id);
    
});