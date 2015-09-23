function escapeTags( str ) {
  return String( str )
           .replace( /&/g, '&amp;' )
           .replace( /"/g, '&quot;' )
           .replace( /'/g, '&#39;' )
           .replace( /</g, '&lt;' )
           .replace( />/g, '&gt;' );
}
window.onload = function() {
  var btn = document.getElementById('uploadBtn'),
      progressBar = document.getElementById('progressBar'),
      progressOuter = document.getElementById('progressOuter'),
      msgBox = document.getElementById('msgBox');
  var uploader = new ss.SimpleUpload({
        button: btn,
        url: '{{ path("pouce_user_uploadImageProfil") }}',
        name: 'uploadfile',
        hoverClass: 'hover',
        focusClass: 'focus',
        responseType: 'json',
        multipart: true,
        startXHR: function() {
            progressOuter.style.display = 'block'; // make progress bar visible
            this.setProgressBar( progressBar );
        },
        onSubmit: function() {
            msgBox.innerHTML = ''; // empty the message box
            btn.innerHTML = 'Téléchargement...'; // change button text to "Uploading..."
          },
        onComplete: function( filename, response ) {
            btn.innerHTML = 'Changer';
            progressOuter.style.display = 'none'; // hide progress bar when upload is completed
            if ( !response ) {
                msgBox.innerHTML = 'Impossible de télécharger le fichier';
                return;
            }
            if ( response.success === true ) {
                msgBox.innerHTML = '<strong>' + escapeTags( filename ) + '</strong>' + ' Téléchargement réussie';
                var urlImage = '{{ asset("images/profil/file")}}';
                urlImage = urlImage.replace("file", response.file);
                $( "#picBox" ).attr('src',urlImage);
            } else {
                if ( response.msg )  {
                    msgBox.innerHTML = escapeTags( response.msg );
                } else {
                    msgBox.innerHTML = 'Une erreur s\'est produite et le téléchargement a échoué';
                }
            }
          },
        onError: function() {
            progressOuter.style.display = 'none';
            msgBox.innerHTML = 'Impossible de télécharger le fichier';
          }
    });
};