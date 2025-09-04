// Add this code to your JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    // Select all elements with the custom data attribute
    const swiperInnerElements = document.querySelectorAll('[data-bgimage]');

    // Loop through each element and set the background image style
    swiperInnerElements.forEach(element => {
        const imagePath = element.getAttribute('data-bgimage');
        if (imagePath) {
            element.style.backgroundImage = imagePath;
        }
    });

    // The Swiper initialization code can be placed here,
    // as it now has the background images applied.
    const swiper = new Swiper('.swiper', {
        // Your existing Swiper configuration
        autoplay: {
            delay: 3000,
            disableOnInteraction: false
        },
        spaceBetween: 30,
        effect: "fade",
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        pagination: {
            el: false,
            clickable: false,
        },
    });
});