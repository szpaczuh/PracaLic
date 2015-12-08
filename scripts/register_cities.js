"use strict"

$(document).ready(function(){
    var $registerForm = $("form");
    var $provinceSelection = $registerForm.find('select[name=province]');
    var $citySelection = $registerForm.find('select[name=city]');

    $provinceSelection.on("change", function () {
        $citySelection.load('./cities/' + $(this).children(":selected").attr("id"));
    });
});



