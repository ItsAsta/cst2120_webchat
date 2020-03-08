$( document ).ready(function() {
    console.log( "ready!" );

    // $("#loginContainer").hide();
    // $("#registerContainer").hide();

    // $('#chatNav').click(function () {
    //     alert("Clicked");
    // });


    var $divs = $('#loginContainer'),
        $buttons = $('#chatNav'),
        $hb = $('html, body');

    $buttons.click(function ()
    {
        $("#loginContainer").show();
        var $this = $(this),
            index = $buttons.index(this);

        $hb.animate({scrollTop: $divs.eq(index).offset().top + 'px'}, 1000);
    });
});

