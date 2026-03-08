import * as THREE from './vendor/three.module.js';


let scene,camera,renderer,sphereGroup;

let canvas;

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
const rotationSpeed = 0.005;
let mouseMovedThreshold = 8; 
let mouseMovedDuringClick = false;
const minScale = 0.9; 
const maxScale = 1.0;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();


// =========================================================
// NEW: Authentication Variables and Functions
// =========================================================
let isRegisterMode = false;
let authModal, authButton, authForm, authTitle, authSubmit, registerFields, authToggleLink, authMessage;
let loggedInUser = null; // Stores user object if logged in


/**
 * Fetches the login status from a utility endpoint (we'll assume one exists, 
 * or check sessions if we were integrating server-side rendering).
 * For this client-side JS, we rely on a cookie or local storage, but since 
 * PHP sessions were implemented on the backend, we'll try a generic check.
 */
async function checkLoginStatus() {
    // NOTE: Since PHP sessions are used, a simple client-side check is hard.
    // For now, we will assume if the page loads, we check the session via a new API endpoint.
    // We will create a simple 'api/get_session.php' in a moment, but for now:
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
        console.warn("Could not check session status. Assuming logged out.");
        loggedInUser = null;
        updateAuthUI(false);
    }
}

/**
 * Updates the header button text/action based on login status.
 */
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
    // Reset to Login view every time it opens
    setFormMode('login');
    authModal.style.display = 'flex';
    authModal.classList.remove('close');
    authModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
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
    isRegisterMode = (mode === 'register');
    authTitle.textContent = isRegisterMode ? "Create Your VistaVignettes Account" : "Log In to VistaVignettes";
    authSubmit.textContent = isRegisterMode ? "Register" : "Log In";
    registerFields.style.display = isRegisterMode ? 'block' : 'none';
    authToggleLink.innerHTML = isRegisterMode ? "Already have an account? <strong>LOG IN</strong>" : "Need an account? <strong>Sign Up</strong>";
    authMessage.textContent = ''; // Clear message
}

function toggleFormMode(e) {
    e.preventDefault();
    setFormMode(isRegisterMode ? 'login' : 'register');
}

/**
 * Handles form submission for both Login and Register.
 */
async function handleAuthSubmit(e) {
    e.preventDefault();
    authMessage.textContent = ''; 

    const usernameInput = document.getElementById('auth-username').value.trim();
    const passwordInput = document.getElementById('auth-password').value;
    const emailInput = document.getElementById('register-email')?.value.trim();

    // 1. Prepare data and API URL
    let apiUrl = isRegisterMode ? 'api/register.php' : 'api/login.php';
    let data = {
        username: usernameInput,
        password: passwordInput
    };
    if (isRegisterMode) {
        if (!emailInput) {
             authMessage.textContent = "Email is required for registration.";
             return;
        }
        data.email = emailInput;
    }
    
    // 2. Perform API Fetch
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        // 3. Handle response
        if (response.ok && response.status === 200 || response.status === 201) {
            authMessage.style.color = 'green';
            authMessage.textContent = result.message || (isRegisterMode ? "Registration successful!" : "Login successful!");
            
            // If successful login, update state
            if (!isRegisterMode) {
                loggedInUser = {
                    id: result.user_id,
                    username: result.username
                };
                updateAuthUI(true); // Update header button
            }
            
            // Delay closing modal slightly after success
            setTimeout(() => {
                closeAuthModal();
                // Reload page to refresh the three.js sphere if necessary, or just close modal
                if (!isRegisterMode) window.location.reload(); 
            }, 1000);

        } else {
            // Handle errors (400, 401, 409, 500)
            authMessage.style.color = 'red';
            authMessage.textContent = result.message || `Authentication failed: ${response.statusText}`;
        }

    } catch (e) {
        authMessage.style.color = 'red';
        authMessage.textContent = "Network error or server connection failed.";
        console.error("Auth Fetch Error:", e);
    }
}


/**
 * Handles the Logout API call.
 */
async function handleLogout() {
    try {
        const response = await fetch('api/logout.php');
        if (response.ok) {
            loggedInUser = null;
            updateAuthUI(false);
            alert("Logged out successfully.");
            window.location.reload(); // Reload to clear any user-specific content
        } else {
            alert("Logout failed. Please try clearing cookies.");
        }
    } catch (e) {
        console.error("Logout Fetch Error:", e);
        alert("Network error during logout.");
    }
}


// =========================================================
// EXISTING THREE.JS & Core Functions (Unchanged)
// =========================================================

function onMouseDown(event) {
    mouseMovedDuringClick = false;
    if (canvas) { 
        isDragging = true; 
        previousMousePosition = {
            x: event.clientX, 
            y: event.clientY 
        };
        event.preventDefault();
    }
}

function onMouseUp(event) {
    isDragging = false; 
    canvas.style.cursor = 'grab';
}

function onMouseMove(event) {

    if (isDragging && !mouseMovedDuringClick) {
        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;
        if (Math.abs(deltaX) > mouseMovedThreshold || Math.abs(deltaY) > mouseMovedThreshold) {
            mouseMovedDuringClick = true; // Mark as a drag
        }
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(sphereGroup.children);

    // --- CURSOR LOGIC REFINEMENT START ---
    
    if (isDragging) {
        // If actively dragging, show the 'grabbing' (pinched hand) cursor.
        canvas.style.cursor = 'grabbing';
    } else if (intersects.length > 0) {
        // If not dragging but hovering over an image, show 'pointer'.
        canvas.style.cursor = 'pointer'; 
    } else {
        // Otherwise (not dragging, not hovering), show the 'grab' (normal hand) cursor.
        canvas.style.cursor = 'grab'; 
    }

    // --- CURSOR LOGIC REFINEMENT END ---

    if (!isDragging) return; 

    const deltaX = event.clientX - previousMousePosition.x; 
    const deltaY = event.clientY - previousMousePosition.y; 

    if (sphereGroup) { 
        sphereGroup.rotation.y += deltaX * rotationSpeed; 
        sphereGroup.rotation.x += deltaY * rotationSpeed; 
    }

    previousMousePosition = {
        x: event.clientX,
        y: event.clientY
    };
    event.preventDefault();
}

function onTouchStart(event) {
    if (event.touches.length === 1) { 
        isDragging = true;
        previousMousePosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY 
        };
    }
    event.preventDefault(); 
}

function onTouchEnd(event) {
    isDragging = false;
}

function onTouchMove(event) {
    if (!isDragging || event.touches.length !== 1) return; 

    const deltaX = event.touches[0].clientX - previousMousePosition.x;
    const deltaY = event.touches[0].clientY - previousMousePosition.y;

    if (sphereGroup) { 
        sphereGroup.rotation.y += deltaX * rotationSpeed;
        sphereGroup.rotation.x += deltaY * rotationSpeed; 
    }

    previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
    };
    event.preventDefault();
}

function onWindowResize() {
    if (!canvas || !camera || !renderer) return; 
    
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    camera.aspect = width / height; 
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.render(scene, camera); 
} 

function init(imagePathsToLoad){
    canvas = document.getElementById('threeJsCanvas');
    if(!canvas){
        console.error("Error: Canvas element with ID 'threeJsCanvas' not found!")
        return;
    }

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xb2c7a2);
    
    sphereGroup = new THREE.Group();
    scene.add(sphereGroup);
    
    const textureLoader = new THREE.TextureLoader();
    const radius = 2.9;
    const numImages =  imagePathsToLoad.length;
    const goldenRatio = (1+ Math.sqrt(5)) / 2;

    const basePlaneSize = 1.5;

    const baseCircleRadius = 0.8; // Base radius for CircleGeometry

    scene.background = new THREE.Color(0xb2c7a2);
    scene.fog = new THREE.Fog(0xb2c7a2, radius * 0.8, radius * 2.5);

    const backgroundSphereGeometry = new THREE.SphereGeometry(radius * 1.05, 64, 64);
    const backgroundSphereMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff, 
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide 
    });
    const backgroundSphere = new THREE.Mesh(backgroundSphereGeometry, backgroundSphereMaterial);
    scene.add(backgroundSphere);

    if(numImages>0){
         imagePathsToLoad.forEach((image, index) => {

            textureLoader.load(image.path,
                (texture) => {
                    texture.flipY = false;
                    texture.needsUpdate = true;
                    texture.rotation = Math.PI; 
                    texture.center.set(0.5, 0.5);

                    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true});

                    // Use CircleGeometry as the base shape
                    const geometry = new THREE.CircleGeometry(baseCircleRadius, 64); // Increased segments for smoother circle/oval
                    const imagePlane = new THREE.Mesh(geometry, material);

                    const imageAspectRatio = texture.image.width / texture.image.height;
                    const randomScaleFactor = minScale + (Math.random() * (maxScale - minScale)); 

                    let scaleX = randomScaleFactor;
                    let scaleY = randomScaleFactor;

                    // Apply aspect ratio scaling
                    if (imageAspectRatio > 1) { // Landscape image
                        scaleY /= imageAspectRatio; 
                    } else { // Portrait or square image
                        scaleX *= imageAspectRatio;
                    }

                    // Apply oval shape scaling (less stretchy)
                    scaleX *= 0.9; // Less horizontal compression
                    scaleY *= 1.1; // Less vertical stretch

                    imagePlane.scale.set(scaleX, scaleY, 1.0); 
                    
                    // Add subtle random rotation on its local X-axis to make it appear to curve
                    imagePlane.rotation.x += (Math.random() - 0.5) * 0.2; 

                    const phi = Math.acos(1-(2 * index) / numImages);
                    const theta = 2 * Math.PI * index / goldenRatio;

                    imagePlane.position.setFromSphericalCoords(radius, phi, theta);
                    imagePlane.lookAt(sphereGroup.position);

                    sphereGroup.add(imagePlane);
                },
                undefined,
                (err) => {
                    console.error('An error happened loading image:', image.path, err);

                    const placeholderTexture = textureLoader.load('https://placehold.co/200x200/AAAAAA/000000?text=Error');
                    const placeholderMaterial = new THREE.MeshBasicMaterial({ map: placeholderTexture, side: THREE.DoubleSide });

                    const geometry = new THREE.CircleGeometry(baseCircleRadius, 64); // Use CircleGeometry for placeholder
                    const imagePlane = new THREE.Mesh(geometry, placeholderMaterial);

                    const randomScaleFactor = minScale + (Math.random() * (maxScale - minScale)); 
                    let scaleX = randomScaleFactor;
                    let scaleY = randomScaleFactor;
                    
                    // Apply oval shape scaling to placeholder (less stretchy)
                    scaleX *= 0.9;
                    scaleY *= 1.1;
                    imagePlane.scale.set(scaleX, scaleY, 1.0); 
                    
                    imagePlane.rotation.x += (Math.random() - 0.5) * 0.2; // Add curve illusion to placeholder

                    const phi = Math.acos(1-(2 * index) / numImages);
                    const theta = 2 * Math.PI * index / goldenRatio;

                    imagePlane.position.setFromSphericalCoords(radius, phi, theta);
                    imagePlane.lookAt(sphereGroup.position);
                    sphereGroup.add(imagePlane);
                }
            );
        });
    }

    camera = new THREE.PerspectiveCamera(75,width/height,0.1,1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio); 
    renderer.setSize(width, height);

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseUp);

    canvas.addEventListener('touchstart', onTouchStart); 
    canvas.addEventListener('touchend', onTouchEnd); 
    canvas.addEventListener('touchmove', onTouchMove);
    canvas.addEventListener('click', onClick, false);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); 
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1); 
    scene.add(directionalLight);

    window.addEventListener('resize', onWindowResize, false);
}

function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene,camera);

    if(!isDragging && sphereGroup){
        sphereGroup.rotation.y += rotationSpeed * 0.5;
    }
}

function onClick(event) {

    if (mouseMovedDuringClick) {
        console.log("DEBUG: Click ignored because it was part of a drag.");
        return; // Do not navigate if it was a drag
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1; 

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(sphereGroup.children);

    if (intersects.length > 0) {

        window.location.href = 'gallery.html'; 
    }

}

document.addEventListener('DOMContentLoaded', async function(){
    
    // =========================================================
    // NEW: Authentication Initialization and Event Listeners
    // =========================================================
    
    authModal = document.getElementById('auth-modal');
    authButton = document.getElementById('auth-button');
    authForm = document.getElementById('auth-form');
    authTitle = document.getElementById('auth-title');
    authSubmit = document.getElementById('auth-submit');
    registerFields = document.getElementById('register-fields');
    authToggleLink = document.getElementById('toggle-register');
    authMessage = document.getElementById('auth-message');
    const closeAuthButton = document.querySelector('.close-auth-button');
    
    // Event listeners for the Authentication Modal
    if (authButton) {
        authButton.addEventListener('click', openAuthModal);
    }
    if (closeAuthButton) {
        closeAuthButton.addEventListener('click', closeAuthModal);
    }
    if (authModal) {
        // Close modal when clicking outside the content
        authModal.addEventListener('click', (event) => {
            if (event.target === authModal) closeAuthModal();
        });
        // Close modal on escape key
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
    
    // Check login status on page load (essential for updating the header)
    await checkLoginStatus(); 
    
    
    // =========================================================
    // EXISTING: Search and Three.js Initialization Logic
    // =========================================================
    
    const searchForm = document.querySelector('.search-bar'); 
    const searchInput = document.querySelector('.search-input');

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            const searchTerm = searchInput.value;

            // Redirects to the gallery page with the search term
            window.location.href = `gallery.html?search_term=${encodeURIComponent(searchTerm)}`;
        });
    }

    try {
        // Pass the is_sphere_image flag (1) to get images for the home sphere
        const response = await fetch('api/get_images.php?is_sphere_image=1'); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json(); 
        const fetchedImagePaths = data.imagePaths; 

        if (!fetchedImagePaths || fetchedImagePaths.length === 0) {
            console.warn("No images found for the 3D sphere.");
            canvas = document.getElementById('threeJsCanvas');
            if (canvas) canvas.style.display = 'none'; 
            document.body.innerHTML += '<h1>No images to display. Please add images to your project.</h1>';
            return;
        }

        init(fetchedImagePaths); 
        animate();
    } catch(e) {
        console.error("Error during Three.js initialization or animation start:", e);
        canvas = document.getElementById('threeJsCanvas');
        if (canvas) canvas.style.display = 'none'; 
        document.body.innerHTML += `<h1>Error loading images: ${e.message}. Check console for details.</h1>`;
    }
});