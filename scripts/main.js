$(document).ready(function(){
    if($('#logged').text().search('nie')){
    $('#register').css({
        display : 'none'
    });
    $('#login').css({
        display : 'none'
    });
    } else {
        $('#register').css({
        display : ''
    });
    $('#login').css({
        display : ''
    });
    }
});