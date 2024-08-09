$(document).ready(function() {
    const images = [
        { src: "https://i.imgur.com/GrSR2P3.jpg", alt: "Project 1" },
        { src: "https://i.imgur.com/mdGzXb3.jpg", alt: "Project 2" },
        { src: "https://i.imgur.com/OdUJHVR.jpg", alt: "Project 3" },
        { src: "https://i.imgur.com/e3IRcxb.jpg", alt: "Project 4" },
        { src: "https://i.imgur.com/WPooLnt.jpg", alt: "Project 5" },
        { src: "https://i.imgur.com/NqXYAbP.jpg", alt: "Project 6" },
        { src: "https://i.imgur.com/TE2PWEp.jpg", alt: "Project 7" },
        { src: "https://i.imgur.com/moHMski.jpg", alt: "Project 8" },
        { src: "https://i.imgur.com/VbHZa7U.jpg", alt: "Project 9" },
        { src: "https://i.imgur.com/LSSwze0.jpg", alt: "Project 10" },
        { src: "https://i.imgur.com/W9nhJ2d.jpg", alt: "Project 11" },
        { src: "https://i.imgur.com/wrg9fYJ.jpg", alt: "Project 12" },
        { src: "https://i.imgur.com/yFc0tWV.jpg", alt: "Project 13" },
        { src: "https://i.imgur.com/KS6bBK7.jpg", alt: "Project 14" },
        { src: "https://i.imgur.com/D6rxZru.jpg", alt: "Project 15" },
        { src: "https://i.imgur.com/DTqYGxQ.jpg", alt: "Project 16" },
        { src: "https://i.imgur.com/sTuhL0G.jpg", alt: "Project 17" },
        { src: "https://i.imgur.com/zGAhyJX.jpg", alt: "Project 18" },
        { src: "https://i.imgur.com/YxKWBrT.jpg", alt: "Project 19" },
        { src: "https://i.imgur.com/EuNlgGo.jpg", alt: "Project 20" },
        { src: "https://i.imgur.com/gI7Ci08.jpg", alt: "Project 21" },
        { src: "https://i.imgur.com/cesis0R.jpg", alt: "Project 22" },
        { src: "https://i.imgur.com/YLDeWhY.jpg", alt: "Project 23" },
        { src: "https://i.imgur.com/w9sWj5s.jpg", alt: "Project 24" },
        { src: "https://i.imgur.com/81j9IPb.jpg", alt: "Project 25" },
        { src: "https://i.imgur.com/57nQ7UK.jpg", alt: "Project 26" },
        { src: "https://i.imgur.com/zrS317B.jpg", alt: "Project 27" },
        { src: "https://i.imgur.com/UjVIT6o.jpg", alt: "Project 28" },
        { src: "https://i.imgur.com/FFOeJRN.jpg", alt: "Project 29" },
        { src: "https://i.imgur.com/w4OsEZt.jpg", alt: "Project 30" },
        { src: "https://i.imgur.com/EZg3FSt.jpg", alt: "Project 31" },
        { src: "https://i.imgur.com/jutXyj1.jpg", alt: "Project 32" },        
    ];

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
                    <div class="btn-box">View</div>
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
                gutter: 10
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