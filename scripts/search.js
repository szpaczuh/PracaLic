"use strict";

$(document).ready(function () {
    var $searchForm = $("form");
    var $provinceSelection = $searchForm.find('select[name=province]');
    var $citySelection = $searchForm.find('select[name=city]');
    var $subjectSelection = $searchForm.find('select[name=subject]');
    var $levelSelection = $searchForm.find('select[name=level]');
    var $minimum = $searchForm.find('input[name=minimum]');
    var $maximum = $searchForm.find('input[name=maximum]');

    $provinceSelection.load('./cities/provinces');
    $subjectSelection.load('./cities/subjects');
    $levelSelection.load('./cities/levels');

    $minimum.on("change", function () {
       $maximum.attr('min', $minimum.val());
    });

    $maximum.on("change", function() {
       $minimum.attr('max', $maximum.val());
    });

    $provinceSelection.on("change", function () {
        $citySelection.load('./cities/' + $(this).children(":selected").attr("id"));
    });
});