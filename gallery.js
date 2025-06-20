$(document).ready(function() {
    // Generate images array from local files (assuming all are .JPG or .jpg)
    const images = [];
    for (let i = 1; i <= 100; i++) {
        const paddedNumber = i.toString().padStart(5, '0');
        images.push({
            src: `images/image${paddedNumber}.JPG`,
            alt: `Project ${i}`
        });
    }

    // Shuffle images array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Create gallery items
    function createGalleryItems() {
        shuffleArray(images);
        const container = $('#gallery-container');
        container.empty();

        images.forEach((image, index) => {
            const item = `
                <div class="grid-item" data-index="${index}">
                    <img src="${image.src}" alt="${image.alt}">
                    <div class="btn-box">view</div>
                </div>
            `;
            container.append(item);
        });

        // Initialize Masonry
        initMasonry();
    }

    // Initialize Masonry layout
    function initMasonry() {
        const grid = document.querySelector('.grid');
        imagesLoaded(grid, function() {
            new Masonry(grid, {
                itemSelector: '.grid-item',
                columnWidth: '.grid-item',
                percentPosition: true,
                gutter: 0 // 사진 열 사이의 간격. 원래 10이었음
            });
        });
    }

    // Initialize gallery
    createGalleryItems();

    // Open lightbox
    $(document).on('click', '.grid-item', function() {
        const index = $(this).data('index');
        const image = images[index];
        const lightbox = `
            <div class="lightbox">
                <img src="${image.src}" alt="${image.alt}" class="lightbox-img">
                <div class="lightbox-close">&times;</div>
            </div>
        `;
        $('body').append(lightbox);
    });

    // Close lightbox
    $(document).on('click', '.lightbox-close, .lightbox', function(e) {
        if (e.target !== this) return;
        $('.lightbox').remove();
    });

    // Keyboard navigation
    $(document).keydown(function(e) {
        if (e.key === "Escape" && $('.lightbox').length) {
            $('.lightbox').remove();
        }
    });

    // Resize event to re-arrange gallery
    let resizeTimer;
    $(window).resize(function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            initMasonry();
        }, 250);
    });
});