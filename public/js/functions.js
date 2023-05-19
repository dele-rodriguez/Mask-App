$(document).ready(function() {
    activeLinkControl();
    toggler();
    passwordtoText();
    copyToClipboard();
    shareProfile();
    disableLink();
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
function copyToClipboard() {
    $('.fa-copy').on('click', () => {
        var linkText = $('.special-link').attr('href');
        
        navigator.clipboard.writeText(linkText)
          .then(() => {
            alert("Copied link to clipboard!");
            // You can add additional feedback or notification here
          })
          .catch(function(error) {
            console.error('Failed to copy link:', error);
        });
    });   
}
function shareProfile() {
    $('.share-btn').click(() => {
        // Get the unique URL and brief information
        const uniqueLink = $('.share-profile').attr('href');
        const url = encodeURIComponent(uniqueLink);
        const info = "Write a secret anonymous message for me.. 😉 I won't know who wrote it.. 😂❤👉  ";
  
        // Construct the WhatsApp message
        const message = `${info} ${url}`;
  
        // Open WhatsApp with the pre-populated message
        window.open(`https://wa.me/?text=${message}`);
    });
}
function disableLink() {
    $('.share-profile').click((event) => {
        event.preventDefault(); // Prevent the default behavior of the link
        // Your custom logic here
      });
}