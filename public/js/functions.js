$(document).ready(function() {
    activeLinkControl();
    toggler();
});

function activeLinkControl() {
    $(".nav-item").on("click" , function() {
        $(".nav-item").removeClass("li-active");
    
        $(this).addClass("li-active");
    }); 
    $(".nav-link").on("click" , function() {
        $(".nav-link").removeClass("active");
    
        $(this).addClass("active");
    }); 
}

function toggler() {
    $(".fa-bars").on("click" , function() {
        $(".nav").toggleClass("mobile-menu");
    });
}