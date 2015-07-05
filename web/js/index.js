$( document ).ready(function(){
	$('#fullpage').fullpage(
	{
		onLeave: function(index, nextIndex, direction){
		    var leavingSlide = $(this);

            if(index == 1 && direction == 'down'){
            	$("#navcolor").attr('class', 'white');
            }
            if(index == 2 && direction == 'up'){
            	$("#navcolor").attr('class', 'transparent');
            }
        },
        //Scrolling

        //Accessibility
        keyboardScrolling: true,
        scrollBar: true,

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
