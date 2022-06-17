const hamwrap = document.getElementById('ham-wrap');
const hamburger = document.getElementById('hamburger');
const ulNav = document.getElementById('ul-nav');
const header = document.getElementById('header');

hamwrap.addEventListener('click', function() {
    ulNav.classList.toggle('show');
});

hamwrap.addEventListener('click', function() {
    hamburger.classList.toggle('animation');
});

window.addEventListener("scroll", () => {
    if(window.scrollY > 0){
        header.style.position = "fixed";
    } else {
        header.style.position = "relative";
    }
})