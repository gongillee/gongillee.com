$(document).ready(function() {
    const images = [
        { src: "https://i.imgur.com/GrSR2P3.jpg", alt: "night sky and tree" },
        { src: "https://i.imgur.com/mdGzXb3.jpg", alt: "night sky and tree" },
        { src: "https://i.imgur.com/OdUJHVR.jpg", alt: "a man lying on beach" },
        { src: "https://i.imgur.com/e3IRcxb.jpg", alt: "night forest" },
        { src: "https://i.imgur.com/WPooLnt.jpg", alt: "desert" },
        { src: "https://i.imgur.com/NqXYAbP.jpg", alt: "conference hall" },
        { src: "https://i.imgur.com/TE2PWEp.jpg", alt: "me on the bench" },
        { src: "https://i.imgur.com/moHMski.jpg", alt: "skateboarding in a square" },
        { src: "https://i.imgur.com/VbHZa7U.jpg", alt: "room on the top of the hill" },
        { src: "https://i.imgur.com/LSSwze0.jpg", alt: "hard wax enterance" },
        { src: "https://i.imgur.com/W9nhJ2d.jpg", alt: "fall tree" },
        { src: "https://i.imgur.com/wrg9fYJ.jpg", alt: "Gyeongbokgung" },
        { src: "https://i.imgur.com/yFc0tWV.jpg", alt: "me with sunglasses" },
        { src: "https://i.imgur.com/KS6bBK7.jpg", alt: "a tree" },
        { src: "https://i.imgur.com/D6rxZru.jpg", alt: "me in the forest" },
        { src: "https://i.imgur.com/DTqYGxQ.jpg", alt: "broken windows" },
        { src: "https://i.imgur.com/sTuhL0G.jpg", alt: "trucks and sky" },
        { src: "https://i.imgur.com/zGAhyJX.jpg", alt: "me yelling freedom" },
        { src: "https://i.imgur.com/YxKWBrT.jpg", alt: "berlin highway" },
        { src: "https://i.imgur.com/EuNlgGo.jpg", alt: "love and human items" },
        { src: "https://i.imgur.com/gI7Ci08.jpg", alt: "me putting eye drops" },
        { src: "https://i.imgur.com/cesis0R.jpg", alt: "me in the old house" },
        { src: "https://i.imgur.com/YLDeWhY.jpg", alt: "berlin restroom" },
        { src: "https://i.imgur.com/w9sWj5s.jpg", alt: "old vurt bar" },
        { src: "https://i.imgur.com/81j9IPb.jpg", alt: "old vurt dj booth" },
        { src: "https://i.imgur.com/57nQ7UK.jpg", alt: "beautiful sky in the highway" },
        { src: "https://i.imgur.com/zrS317B.jpg", alt: "museum san" },
        { src: "https://i.imgur.com/UjVIT6o.jpg", alt: "nature b&h" },
        { src: "https://i.imgur.com/FFOeJRN.jpg", alt: "jeju oreum" },
        { src: "https://i.imgur.com/w4OsEZt.jpg", alt: "me on the jeju oreum" },
        { src: "https://i.imgur.com/EZg3FSt.jpg", alt: "me shooting camera" },
        { src: "https://i.imgur.com/jutXyj1.jpg", alt: "cliff and sea" },
        { src: "https://i.imgur.com/u4ceNu9.jpg", alt: "rounded stones under the water" },
        { src: "https://i.imgur.com/xXVObCG.jpg", alt: "a giant tree in skku campus" },
        { src: "https://i.imgur.com/H4HCIsK.jpg", alt: "three display in the exhibition" },
        { src: "https://i.imgur.com/cWnh1f6.jpg", alt: "seoul scene" },
        { src: "https://i.imgur.com/6UQ5qJS.jpg", alt: "seoul buildings" },
        { src: "https://i.imgur.com/4ckvoHW.jpg", alt: "namsan tower and buildings" },
        { src: "https://i.imgur.com/7MsouKf.jpg", alt: "me in soo noraebang" },
        { src: "https://i.imgur.com/G6nfSCH.jpg", alt: "mirror ball" },
        { src: "https://i.imgur.com/nYoTIX1.jpg", alt: "frankfurt station" },
        { src: "https://i.imgur.com/UHtLBtN.jpg", alt: "two guys on the roof" },
        { src: "https://i.imgur.com/GkFq3pC.jpg", alt: "him and car" },
        { src: "https://i.imgur.com/5J0EOkM.jpg", alt: "a smiling kid on the beach" },
        { src: "https://i.imgur.com/Gq5hHFj.jpg", alt: "berlin airbnb" },
        { src: "https://i.imgur.com/VqM16yx.jpg", alt: "a lake" },
        { src: "https://i.imgur.com/8nLywjx.jpg", alt: "an island in seoul" },
        { src: "https://i.imgur.com/oyuNuye.jpg", alt: "my father taking a picture of me" },
        { src: "https://i.imgur.com/tuolLhW.jpg", alt: "mystik" },
        { src: "https://i.imgur.com/Sk1SVqj.jpg", alt: "a mountain from a point of view of a temple" },
        { src: "https://i.imgur.com/jEKEzOY.jpg", alt: "a temple and a mountain" },
        { src: "https://i.imgur.com/X9OXXwy.jpg", alt: "lego figures on the desk" },
        { src: "https://i.imgur.com/ZIfBU3J.jpg", alt: "flowers" },
        { src: "https://i.imgur.com/3VTH1Ue.jpg", alt: "buddism lamps" },
        { src: "https://i.imgur.com/YMyrNHN.jpg", alt: "wishes" },
        { src: "https://i.imgur.com/iFgFGMy.jpg", alt: "budda statue" },
        { src: "https://i.imgur.com/zfM3mRc.jpg", alt: "Gwanghwamun" },
        { src: "https://i.imgur.com/pqi7piZ.jpg", alt: "Sea waves" },
        { src: "https://i.imgur.com/tJKcXjs.jpg", alt: "Sea and sky" },
        { src: "https://i.imgur.com/9qND9XO.jpg", alt: "Sea and sun" },
        { src: "https://i.imgur.com/Q6J8bsB.jpg", alt: "me on the beach" },
        { src: "https://i.imgur.com/TjStANa.jpg", alt: "Sea" }, 
        { src: "https://i.imgur.com/7tfnzZR.jpg", alt: "me in the namsan tour at night" }, 
        { src: "https://i.imgur.com/tcPIj8s.jpg", alt: "my sillouette on the beach"},
        { src: "https://i.imgur.com/cGAhFAk.jpg", alt: "swan on the lake"},
        { src: "https://i.imgur.com/DCDe3DO.jpg", alt: "me holding a yashica camera"}, 
        { src: "https://i.imgur.com/3JKX48j.jpg", alt: "me posing like a batman"},
        { src: "https://i.imgur.com/gu6FmCv.jpg", alt: "Golmok vinyl & pup enterance"},
        { src: "https://i.imgur.com/FMFaukB.jpg", alt: "me on the stairs"},
        { src: "https://i.imgur.com/fJ6jPKK.jpg", alt: "an excavator in nature"},
        { src: "https://i.imgur.com/lB3Py97.jpg", alt: "a lighthouse"},
        { src: "https://i.imgur.com/4siLAbk.jpg", alt: "sunset in the city"},
        { src: "https://i.imgur.com/W4foBhk.jpg", alt: "bright sea"},
        { src: "https://i.imgur.com/Qcu62X0.jpg", alt: "gas station in the highway"},
        { src: "https://i.imgur.com/DrQg6d4.jpg", alt: "grapheitti wall in berlin"},
        { src: "https://i.imgur.com/O4JCTqG.jpg", alt: "grapheitti truck in berlin"},
        { src: "https://i.imgur.com/9ms6Pft.jpg", alt: "house of silence"},
        { src: "https://i.imgur.com/lPlVnTC.jpg", alt: "beautiful fine tree"},
        { src: "https://i.imgur.com/BKTGHzQ.jpg", alt: "a wooden bench in forest"},
        { src: "https://i.imgur.com/Rw11o9t.jpg", alt: "sunshine behind the tree"},
        { src: "https://i.imgur.com/wrjBDvM.jpg", alt: "me in the forest at night"},
        { src: "https://i.imgur.com/3U9cM8o.jpg", alt: "silent sea"},
        { src: "https://i.imgur.com/G8lSlVv.jpg", alt: "way to the end"},
        { src: "https://i.imgur.com/nbI717w.jpg", alt: "desert and trees"},
        { src: "https://i.imgur.com/e6vEioI.jpg", alt: "strong trees"},
        { src: "https://i.imgur.com/bXMwPX2.jpg", alt: "sun and trees"},
        { src: "https://i.imgur.com/J5QwE2q.jpg", alt: "intangled trees"},
        { src: "https://i.imgur.com/KrFdfpg.jpg", alt: "shine on you"},
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

    // 메뉴 토글 기능 업데이트
    $('.menu-toggle').on('click', function() {
        $('.nav-links').toggleClass('active');
        
        // 토글 버튼 애니메이션 (햄버거 -> X)
        $(this).toggleClass('active');
        if ($(this).hasClass('active')) {
            $(this).find('span:nth-child(1)').css({
                'transform': 'rotate(45deg) translate(5px, 5px)'
            });
            $(this).find('span:nth-child(2)').css({
                'opacity': '0'
            });
            $(this).find('span:nth-child(3)').css({
                'transform': 'rotate(-45deg) translate(7px, -6px)'
            });
            
            // 활성화된 메뉴 항목에 포커스 효과
            setTimeout(function() {
                $('.nav-links li').each(function(index) {
                    $(this).css({
                        'opacity': '1',
                        'transform': 'translateX(0)'
                    });
                });
            }, 100);
        } else {
            $(this).find('span').css({
                'transform': 'none',
                'opacity': '1'
            });
            
            // 메뉴 닫을 때 항목 초기화
            $('.nav-links li').css({
                'opacity': '0',
                'transform': 'translateX(40px)'
            });
        }
    });
    
    // 메뉴 항목 클릭시 메뉴 닫기
    $('.nav-links a').on('click', function() {
        $('.nav-links').removeClass('active');
        $('.menu-toggle').removeClass('active').find('span').css({
            'transform': 'none',
            'opacity': '1'
        });
    });
    
    // 화면 밖 클릭시 메뉴 닫기
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.nav-container').length) {
            $('.nav-links').removeClass('active');
            $('.menu-toggle').removeClass('active').find('span').css({
                'transform': 'none',
                'opacity': '1'
            });
        }
    });
});