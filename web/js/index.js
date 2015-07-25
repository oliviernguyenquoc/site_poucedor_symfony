$( document ).ready(function(){
	$('#fullpage').fullpage(
	{
		afterLoad: function(anchorLink, index){
		    var leavingSlide = $(this);

            if(index != 1){
            	$("#navcolor").attr('class', 'white');
            }
            if(index == 1){
            	$("#navcolor").attr('class', 'transparent');
            }
        },
        
        onLeave: function(index, nextIndex, direction){
            if(index == 2 && direction=='up'){
                $("#navcolor").attr('class', 'transparent');
            }
        },

        //Accessibility
        keyboardScrolling: true,
        scrollBar: true,
        verticalCentered: true,

        //Design
        controlArrows: true,
        navigation: true,
        navigationPosition: 'right',

        // fixedElements: '#header, .footer',

        //Custom selectors
        sectionSelector: '.section',
        slideSelector: '.slide',

        responsiveWidth: 800,
    });
});

$('#index-banner').on('scrollSpy:enter', function() {
    $("#navcolor").attr('class', 'transparent');
});

$('#index-banner').scrollSpy();
