const btns = document.querySelectorAll('.change');
const inputs = document.querySelectorAll('.changeInput');

btns.forEach((btn)=>{
    btn.addEventListener('click',(e) => {
        inputs.forEach((input) => {
            const inputId = document.getElementById(input.id)
            
            if(btn.value === input.id){

                inputId.classList.toggle("visible")
                inputId.value = '';
            }
        
        })
    });
});