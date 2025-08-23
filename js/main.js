import * as THREE from './vendor/three.module.js';


let scene,camera,renderer,sphereGroup;

let canvas;

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
const rotationSpeed = 0.005;
const minScale = 0.6; 
const maxScale = 0.8;




function onMouseDown(event) {
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
}

function onMouseMove(event) {
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
    scene.background = new THREE.Color(0xf0f0f0);
    
    sphereGroup = new THREE.Group();
    scene.add(sphereGroup);
    
    const textureLoader = new THREE.TextureLoader();
    const radius = 2.9;
    const numImages =  imagePathsToLoad.length;
    const goldenRatio = (1+ Math.sqrt(5)) / 2;

    const basePlaneSize = 1.5;

    const baseCircleRadius = 0.9; // Base radius for CircleGeometry

    scene.background = new THREE.Color(0xf4f4f4);
    scene.fog = new THREE.Fog(0xf4f4f4, radius * 0.8, radius * 2.5);

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
         imagePathsToLoad.forEach((path, index) => {

            textureLoader.load(path,
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
                    console.error('An error happened loading image:', path, err);

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

document.addEventListener('DOMContentLoaded', async function(){
    try {
        // --- NEW: Fetch image paths from data.json ---
        const response = await fetch('data.json'); // Fetch the JSON file
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json(); // Parse the JSON response
        const fetchedImagePaths = data.imagePaths; // Get the array of paths

        if (!fetchedImagePaths || fetchedImagePaths.length === 0) {
            console.error("Error: No image paths found in data.json or array is empty.");
            // Optionally, display a message on the canvas or page
            canvas = document.getElementById('threeJsCanvas');
            if (canvas) canvas.style.display = 'none'; // Hide canvas if no images
            document.body.innerHTML += '<h1>No images to display. Please add images to your project.</h1>';
            return;
        }
        // --- END NEW ---

        init(fetchedImagePaths); // Pass the fetched paths to init()
        animate();
    } catch(e) {
        console.error("Error during Three.js initialization or animation start:", e);
        canvas = document.getElementById('threeJsCanvas');
        if (canvas) canvas.style.display = 'none'; // Hide canvas on error
        document.body.innerHTML += `<h1>Error loading images: ${e.message}. Check console for details.</h1>`;
    }
});
