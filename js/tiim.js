

var tim = document.getElementById("navbar")
var timbis = document.getElementById("webviews")
var tim1 =document.getElementById("tim-header")
var topbarAfficher = false
var topbarAfficher1 = false
var posTopbar = 0
document.onmousemove = function(e){
    
   
    
    var tempX = e.pageY;
    

    if (topbarAfficher == true){
        tim.style.transform = 'translateY(36px)'
        timbis.style.height = 'calc( 100vh - 35px )'
    } else if (topbarAfficher1 == true ){
        tim.style.transform = 'translateY(36px)'
        timbis.style.height = 'calc( 100vh - 35px )'
        if (tempX >= 172){
            topbarAfficher1 = false
        }
    } else if (tempX <= 15){ 
        tim.style.transition = '.2s ease-in-out'
        timbis.style.transition = '.2s ease-in-out'
        tim.style.transform = 'translateY(36px)'
        timbis.style.height = 'calc( 100vh - 35px )'
        topbarAfficher1 =true
    } else {
        tim.style.transition = '.2s ease-in-out'
        timbis.style.transition = '.2s ease-in-out'
        topbarAfficher1 = false
        posTopbar =0
        tim.style.transform = 'translateY(0)';
        timbis.style.height = '100vh'
    }
};

document.onmouseleave = function(e){

        if (topbarAfficher == false){
            tim.style.transform = 'translateY(0px)'
            timbis.style.height = 'calc( 100vh )'
        }
   
    
}



