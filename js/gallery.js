let imageModal, modalImage, modalImageTitle, modalImageDescription, modalDownloadButton, closeButton;


async function loadGalleryImages() {
    try {
        // Dynamically construct the base path for GitHub Pages project sites
        const basePath = window.location.pathname.includes('/VistaVignettes/') 
            ? '/VistaVignettes/' 
            : '/'; // Use '/' for local development if not in subpath
            const response = await fetch(`${basePath}gallery_data.json`); // Corrected dynamic path // Fetch from gallery_data.json
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const allImagePaths = data.imagePaths;

        const galleryGrid = document.getElementById('gallery-grid');
        if (!galleryGrid) {
            console.error("Error: Gallery grid element with ID 'gallery-grid' not found!");
            return;
        }

        galleryGrid.innerHTML = ''; // Clear existing content

        if (allImagePaths.length === 0) {
            galleryGrid.innerHTML = '<p>No images available in the gallery.</p>';
            return;
        }

        allImagePaths.forEach(path => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';

            const img = document.createElement('img');
            img.src = path;
            img.alt = path.split('/').pop().split('.')[0]; // Basic alt text
            img.loading = 'lazy'; // Improve performance by lazy loading images

            const downloadButton = document.createElement('a');
            downloadButton.href = path;
            downloadButton.download = path.split('/').pop();
            downloadButton.className = 'download-button';
            downloadButton.textContent = 'Download';

            galleryItem.appendChild(img);
            galleryItem.appendChild(downloadButton);
            img.addEventListener('click', () => openModal(path, img.alt, "A beautiful shot captured by VistaVignettes.")); 
            galleryGrid.appendChild(galleryItem);
        });

    } catch (e) {
        console.error("Error loading gallery images:", e);
        const galleryGrid = document.getElementById('gallery-grid');
        if (galleryGrid) {
            galleryGrid.innerHTML = `<p>Error loading images: ${e.message}.</p>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', loadGalleryImages);
// ======================================
// Modal Functions
// ======================================

// Function to open the image modal
function openModal(imageSrc, title, description) {
    // Ensure modal elements are initialized
    if (!imageModal || !modalImage) {
        console.error("Modal elements not found. Ensure HTML IDs are correct.");
        return;
    }

    modalImage.src = imageSrc;
    modalImage.alt = title;
    modalImageTitle.textContent = title;
    modalImageDescription.textContent = description; // Set description
    modalDownloadButton.href = imageSrc; // Set download link
    modalDownloadButton.download = imageSrc.split('/').pop(); // Set download filename

    imageModal.style.display = 'flex'; // Show the modal
    document.body.style.overflow = 'hidden'; // Prevent scrolling on the body
}

// Function to close the image modal
function closeModal() {
    if (imageModal) {
        imageModal.style.display = 'none'; // Hide the modal
        document.body.style.overflow = 'auto'; // Re-enable scrolling on the body
    }
}

// Event listener to initialize modal elements and attach close handlers
document.addEventListener('DOMContentLoaded', () => {
    imageModal = document.getElementById('image-modal');
    modalImage = document.getElementById('modal-image');
    modalImageTitle = document.getElementById('modal-image-title');
    modalImageDescription = document.getElementById('modal-image-description');
    modalDownloadButton = document.getElementById('modal-download-button');
    closeButton = document.querySelector('.close-button');

    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }
    // Close modal if clicking outside the modal-content
    if (imageModal) {
        imageModal.addEventListener('click', (event) => {
            if (event.target === imageModal) { // Only close if clicked on the backdrop
                closeModal();
            }
        });
    }
});
