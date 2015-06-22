// $('#index-banner').on('scrollSpy:enter', function() {
//     $("#navcolor").attr('class', 'transparent');
// });

// $('#index-banner').on('scrollSpy:exit', function() {
//     $("#navcolor").attr('class', 'white');
// });

// $('#index-banner').scrollSpy();

$('#top').on('scrollSpy:enter', function() {
	$('body').scrollTo('#content3blocks');
});


$('#top').on('scrollSpy:exit', function() {
    $('body').scrollTo('#content3blocks');
});

$('#top').scrollSpy();