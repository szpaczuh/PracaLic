"use strict"
var hidden = true;


$(document).ready(function(){
    $('#autenticator').submit(function(event){
        if(hidden){
            
        $('#pwd').show();
        $('#lbl').show();
        event.preventDefault();
        hidden = false;
        } else {
        $('#pwd').hide();
        $('#lbl').hide();
        hidden = true;
        }
    });
    
    $('#uploader').submit(function(event){
        if($('#upload').val() == ""){
            event.preventDefault();
            $('#problem').html('Error Loading File');
        } else
        {
            $('#problem').html('');
        }
    });
    
});