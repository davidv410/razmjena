const razlog = document.getElementById('razlog');
const cijenaDiv = document.getElementById('cijenaDiv');
const cijena = document.getElementById('cijena');

razlog.addEventListener('change', () => {
    if(razlog.value === 'prodaja' || razlog.value === 'prodaja/razmjena'){
        razlog.classList.add('short')
        cijenaDiv.style.display = "block";
    } else if (razlog.value === 'razmjena'){
        razlog.classList.remove('short')
        cijenaDiv.style.display = "none";
        cijena.value = '';
    } 
})