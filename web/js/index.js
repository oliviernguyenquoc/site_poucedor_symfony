$('#index-banner').on('scrollSpy:enter', function() {
    $("#navcolor").attr('class', 'transparent');
});

$('#index-banner').on('scrollSpy:exit', function() {
    $("#navcolor").attr('class', 'white');
});

$('#index-banner').scrollSpy();