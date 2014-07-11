# PubliWatch Audio Player

#### Player audio accessible

## Exemple d'intégration

Intégrer la balise `<audio>` de manière habituelle, en lui définissant un ID.
Définir les chemins des fichiers audio avec la balise `<source>`.

Les format de fichier compatibles sont identiques à ceux de la spécification
de la balise `<audio>` [En savoir plus.](https://developer.mozilla.org/en-
US/docs/HTML/Supported_media_formats)

L'utilisation de ce plugin requiert : Jquery, Jquery-ui, swfobject.js et
[html5 Shiv](http://html5shiv.googlecode.com/svn/trunk/html5.js).

Initialiser le plugin en appellant la méthode `audiopwplayer()` à partir de
l'ID de la balise audio.

#### Code HTML :
```
<audio id="player1" >
	<source type="audio/mp3" src="audio.mp3"></source>
	<source type="audio/wav" src="audio.wav"></source>
</audio>
```

#### Code javascript :
```
<script type="text/javascript">
	$(function() {
		//Instancier le player sur la balise audio "player1"
		$("#player1").audiopwplayer();
	
		//Pour appeller toutes les balises audio en un seul appel
		$('audio').audiopwplayer();

		//Instancier le player avec toutes les options
		$("#player1").audiopwplayer({
			"width":"900",
			"prefixCss":"pref",
			"uriTranscript":"transcript.pdf",
			"autoplay":true,
			"uriFlashFallbackFolder":"fallback/flash",
			callback:{ 
				onPlayAudio : function(el){console.log("Callback : play audio");},
				onStopAudio : function(el){console.log("Callback : stop audio");},
				onVolumeChange : function(el){console.log("Callback : volume change");},
				onSeekUpdate : function(el){console.log("Callback : seek update");},
				onDisplayHelp : function(el){console.log("Callback : display help");},
				onHideHelp  : function(el){console.log("Callback : hide help");},
				onTranscriptOpen : function(el){console.log("Callback : transcript open");},
				onDownloadAudio : function(el){console.log("Callback : audio download");},
			}
		});
	});
</script>
```

#### Paramètres disponibles :

  * `width` permet de définir la largeur du player (valeur par défaut et minimale : `500` )
  * `uriTranslate` fichier json regroupant les éléments textuels du Player (valeur par défaut : `"translate/fr.json"`) 
  * `uriTranscript` chemin du fichier de transcription du fichier audio (valeur par défaut : `null`)
  * `uriFlashFallbackFolder` chemin du dossier contenent l'alternative Flash du Player (valeur par défaut : `""`)
  * `autoplay` lecture automatique du fichier audio (valeur par défaut : `false`)
  * `prefixCss` permet de définir un préfixe s'ajoutant aux classes CSS (valeur par défaut : `""`)   
Il faut par la suite modifier manuellement l'ensemble des classes CSS dans
audio.pwplayer.css

## API Externe

Le Player est pilotable depuis l'extérieur du plugin via plusieurs fonctions clé

Liste exhaustive des appels de fonctions internes depuis l'extérieur du Player

  * `play()` lire le fichier audio
  * `pause()` interrompre le fichier audio
  * `setVolume(volume)` modifier le volume, le paramètre doit être passé sous la forme : `{ volume : n }`, n étant compris entre 0 et 100
  * `displayHelp()` afficher l'aide
  * `hideHelp()` masquer l'aide
  * `openTranscript()` ouvrir le transcript
  * `downloadAudio()` Télécharger le fichier audio

#### Exemple :
```
<script type="text/javascript">
	$("#externalApiPlay").bind("click",function(){
			$("#player2").audiopwplayer("play");
	});

	$("#externalApiSetVolume").bind("click",function(){
			$("#player2").audiopwplayer("setVolume",{volume:50});
	});
</script>
```

## Callbacks

Liste exhaustives des fonctions de callback :

  * `onPlayAudio` est appelé à la lecture du fichier audio
  * `onStopAudio` est appelé à l'interruption du fichier audio
  * `onVolumeChange` est appelé lorsque le volume est modifié
  * `onSeekUpdate` est appelé lorsque l'on navigue dans la barre de progression
  * `onDisplayHelp` est appelé lorsque l'aide s'affiche
  * `onHideHelp` est appelé lorsque l'aide se masque
  * `onTranscriptOpen` est appelé lorsque le transcript est ouvert
  * `onDownloadAudio` est appelé lorsque le fichier audio est téléchargé

#### Exemple :
```
<script type="text/javascript">
$("#player2").audiopwplayer({
	callback : { 
		onPlayAudio : function(el){console.log("Callback : La lecture a ete lancee");}
	}
});
</script>
```

## Information supplémentaire

#### Fallback Flash

Le player prends en charge automatiquement les navigateurs ne supportant pas
HTML5. Une alternative flash est disponible grâce au fichier player.swf.

**Important :** le fichier audio utilisé dans l'alternative Flash est le premier dans la liste des sources de la balise `<audio>`.

  

#### Téléchargement du fichier audio

Le fichier audio téléchargé est toujours le premier dans la liste des sources
de la balise `<audio>`.

**Important :**Certains navigateurs n'accèpent pas le téléchargement du fichier audio. Dans tous les cas le player ouvrira une fenêtre permettant de récupérer le fichier via la fonction Enregistrer du navigateur.

## Licence

PubliWatch Audio Player est mis à disposition sous licence Attribution - Partage dans les Mêmes Conditions 3.0 France (CC-BY-SA). Pour voir une copie de cette licence, visitez https://creativecommons.org/licenses/by-sa/3.0/fr/legalcode ou écrivez à Creative Commons, 444 Castro Street, Suite 900, Mountain View, California, 94041, USA.
