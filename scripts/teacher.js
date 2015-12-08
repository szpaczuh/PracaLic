$(document).ready(function () {
    $('.toggle').click(function () {
        var collapse_content_selector = $(this).attr('href');

        var toggle_switch = $(this);
        $(collapse_content_selector).toggle(function () {
            if ($(this).css('display') == 'none') {

                toggle_switch.html('Zmien hasło');
            } else {
                toggle_switch.html('Nie zmieniaj hasła');
            }
        });
    });

    $('.toggleCities').click(function() {
        var $editForm = $("form");
        var $divCities = $("#changeCities");
        var $provinceSelection = $editForm.find('select[name=province]');
        var $citySelection = $editForm.find('#citiesCheck');

        $divCities.toggle();

        $provinceSelection.load('./cities/provinces');

        $provinceSelection.on("change", function () {
            $citySelection.load('./citiesCheck/' + $(this).children(":selected").attr("id"));
        });
    });



  
$('.guzik').alert();








});


