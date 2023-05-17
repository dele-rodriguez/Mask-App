$(document).ready(function() {
    activeLinkControl();
    toggler();
    passwordtoText();
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
function passwordtoText() {
    const passwordInput = $('#passwordInput');
    const togglePassword = $('#togglePassword');
  
    togglePassword.on('click', function() {
      if (passwordInput.attr('type') === 'password') {
        passwordInput.attr('type', 'text');
        togglePassword.addClass('show-password');
      } else {
        passwordInput.attr('type', 'password');
        togglePassword.removeClass('show-password');
      }
    });
}