$(document).ready(function () {

    var data = [];
    var json = {
        name: "name",
        ndName: "nazwisko"
    }
    data.push(json);

    $.post("someting.json", data, function (returnedData) {
        cosole.log("sth went wrong");
    });
});