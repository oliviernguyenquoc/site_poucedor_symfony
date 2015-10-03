$( document ).ready(function(){
	$('#city').autocompleter({url_list: '/city_search', url_get: '/city_get/' });
	$('.ui-autocomplete').addClass('dropdown-content');
	$('.dropdown-button').dropdown({
      inDuration: 300,
      outDuration: 225,
      constrain_width: false, // Does not change width of dropdown to that of the activator
      hover: true, // Activate on hover
      gutter: 0, // Spacing from edge
      belowOrigin: true // Displays dropdown below the button
    });
    $('.ui-autocomplete').on("click", "li.ui-menu-item", function(){
    	var cityName = $(this).text();
    	var url_get_country = '/country_get/';
        $.ajax({
            url:     url_get_country + cityName,
            success: function (country) {
                $('input#pays').attr('value',country);
            }
        });
    });
});