$( document ).ready(function(){
	$('#fullpage').fullpage(
	{
		afterLoad: function(anchorLink, index){
		    var leavingSlide = $(this);

            if(index == 1){
                $("#navcolor").attr('class', 'transparent');
            }
            if(index != 1){
            	$("#navcolor").attr('class', 'white');
            }
        },
        
        onLeave: function(index, nextIndex, direction){
            if(index == 2 && direction=='up'){
                $("#navcolor").attr('class', 'transparent');
            }
        },

        //Accessibility
        keyboardScrolling: true,
        scrollBar: false,
        verticalCentered: true,

        responsiveWidth : 800,


        //Design
        controlArrows: true,
        navigation: true,
        navigationPosition: 'right',

        // fixedElements: '#header, .footer',

        //Custom selectors
        sectionSelector: '.section',
        slideSelector: '.slide',

        // responsiveWidth: 800,
    });

    var wi = $(window).width();
    if (wi <= 800)
    {
        $("#FAB").hide();        
    };
 
    $(window).resize(function() {
        var wi = $(window).width();
 
        if (wi <= 800)
        {
            $("#FAB").hide();        
        } else
        {
            $("#FAB").show();   
        }
     });  
});



//adding the action to the button
$(document).on('click', '#FAB', function(){
  $.fn.fullpage.moveSectionDown();
});

$('#index-banner').on('scrollSpy:enter', function() {
    $("#navcolor").attr('class', 'transparent');
});

$('#index-banner').scrollSpy();
