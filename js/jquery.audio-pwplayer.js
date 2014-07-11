// jQuery PubliWatch Audio Player, accessible and responsive
// version 1.2, November 6th, 2013
// by Ipedis
// Licence: Creative Common 3.0 BY-SA
pwTranslate = false;

(function($, App) {
    $.audiopwplayer = function(sound, options) {
        var defaults = {
            callback : {
                onPlayAudio         : function(){},
                onStopAudio         : function(){},
                onVolumeChange      : function(volume){},
                onSeekUpdate        : function(pos){},
                onDisplayHelp       : function(){},
                onHideHelp          : function(){},
                onTranscriptOpen    : function(){},
                onDownloadAudio     : function(){}
            },
            width : 500,
            autoplay : false,
            uriTranslate: "translate/fr.json",
            uriTranscript: null,
            uriFlashFallbackFolder : "",
            prefixCss : ""
        };
        
        // A audiopwplayer object attibute (global for all the method, but local for each instance of the player)
        var plugin = this;
        plugin.settings = {};
        
        var $sound = $(sound), // reference to the jQuery version of DOM sound
             sound = sound;    // reference to the actual DOM sound

        var $soundWrapper;
        var $soundControls;
        var $soundHelp;
        var $soundToolTip;
        var $soundContainer; 
        var $soundControlBar;
        var $soundPlayPauseBtn;
        var $soundTimebar;
        var $soundElapsedTime;
        var $soundTime;
        var $soundaudioDuration;
        var $soundMuteBtn;
        var $soundVolumeContainer;
        var $soundVolume;
        var $soundHelpBtn;
        var $soundTranscriptBtn;
        var $soundDownloadBtn;
        var $soundFallback;

        var inFallbackMode = false;
        
        var el = document.createElement('div');
        el.setAttribute('ongesturestart', 'return;');
        var is_touch_device = typeof el.ongesturestart === "function";

        var hasPdf = false;
        var hasHelp = true;

        var prx; // CSS selectors prefix

        plugin.construct = function(){ 
            plugin.settings = $.extend({}, defaults, options);
            if(typeof options["callback"] != "undefined")
                plugin.settings["callback"] = $.extend({}, defaults["callback"], options["callback"]);

            if(typeof plugin.settings["uriTranslate"] == null){
                return false;
            }

            if(pwTranslate == false){
                $.get(plugin.settings["uriTranslate"], function(rep){

                    if(pwTranslate == false){
                        pwTranslate = rep;
                    }
                    plugin.init();
                }).fail(function() {});
            }
            else{
                plugin.init();
            }

        };

        plugin.init = function() {
            prx = plugin.settings["prefixCss"];
            createHtmlStructure();

            if(!audioTagIsSupported()) initFallback();
            
            $soundTime.progressbar();
            $soundVolume.progressbar({value: 100});

            if(plugin.settings["width"] < 500) plugin.settings["width"] = 500;
            setControlBar(plugin.settings["width"],true);

            createHelpWindow();
            setBindingEvents();
            autoPlayHandler();

            $soundHelp.addClass("outScreen");
            if(!inFallbackMode)$sound.bind('timeupdate', updateaudioCurrentTime);  
        };//End init

        var audioTagIsSupported = function () {
            var a = document.createElement('audio');
            var supported = !!(a.canPlayType);
            return supported;
        };

        var initFallback = function (){

            inFallbackMode = true;

        	var path = plugin.settings['uriFlashFallbackFolder'];
        	var flashAlternativeIdAttribute = $sound.attr("id") + "Flash";
            var soundSource = $sound.find("source")[0].getAttribute("src");

            $sound.after("<div id=\""+flashAlternativeIdAttribute+"\">"+pwTranslate["interface"]["flashAlternative"]+"</div>");

            var flashvars = {audioUrl : soundSource};

            var params = { //Do not change these parameters
                allowScriptAccess : 'always',
                allowFullScreen : 'true',
                scale : 'noscale',
                bgcolor : '#ffffff',
                wmode : 'transparent',
                salign : 'lt'
            };

            var attributes = {
                id : flashAlternativeIdAttribute,
                name : flashAlternativeIdAttribute
            };

            swfobject.embedSWF(path+"/pwaudio.swf", flashAlternativeIdAttribute, 1, 1, "9.0.0", path + "/expressInstall.swf", flashvars, params, attributes);
            $soundFallback = getFallbackobject(flashAlternativeIdAttribute);
        }

        var getFallbackobject = function(name) {
            var swf = document[name] || window[name];
            return swf.length > 1 ? swf[swf.length - 1] : swf;
        }

        var setControlBar = function(ctrlbarWidth, setTooltip){
            var oneButtonWidth = $('.'+prx+'soundControlBar button').outerWidth(); 
            var muteButtonWidth;
            var volumeWidth;

            if(!is_touch_device){
                muteButtonWidth = $soundMuteBtn.outerWidth();
                volumeWidth = $soundVolumeContainer.outerWidth();
            }
            else{
                muteButtonWidth = 0;
                volumeWidth = 0;
            }

            var buttonCount = 2;
            if(hasPdf) buttonCount ++;
            if(hasHelp) buttonCount ++;

            var allButtonsWidth = muteButtonWidth + buttonCount * oneButtonWidth;
            var timeBarWidth = (ctrlbarWidth - volumeWidth) - allButtonsWidth;
            var progressbarWidth = timeBarWidth - 100 - 14;

            $soundTimebar.outerWidth(timeBarWidth);
            $soundTime.outerWidth(progressbarWidth);

            $soundPlayPauseBtn.css('left',0);
            $soundTimebar.css('left', oneButtonWidth);
            
            if(!is_touch_device){
                $soundMuteBtn.css('left', oneButtonWidth + timeBarWidth);
            }else{
                $soundMuteBtn.addClass("displayNone");
            }

            if(!is_touch_device){
                $soundVolumeContainer.css('left', oneButtonWidth + timeBarWidth + muteButtonWidth);
            }else{
                $soundVolumeContainer.addClass("displayNone");
            }

            $soundDownloadBtn.css('left',  oneButtonWidth + timeBarWidth + muteButtonWidth + volumeWidth);
            if(hasHelp) $soundHelpBtn.css('left',oneButtonWidth*(buttonCount-1) + timeBarWidth + muteButtonWidth + volumeWidth);
            if(hasPdf) $soundTranscriptBtn.css('left', oneButtonWidth*2 + timeBarWidth + muteButtonWidth + volumeWidth);

            if(setTooltip) setTooltipPosition();
            $('.'+prx+'time').removeAttr('role');
            $('.'+prx+'time').removeAttr('aria-valuemin');
            $('.'+prx+'time').removeAttr('aria-valuemax');
        }

        var setTooltipPosition = function()
        {
            //Position the toolTip above the control bar
            var toolTipTopPosition = $soundControls.offset().top - 29;
            $soundToolTip.css('top', toolTipTopPosition);
        }

        var autoPlayHandler = function(){
            //Hide the play button (except when autoplay)
            if (plugin.settings['autoplay'] == false || plugin.settings['autoplay'] == undefined) {
                $soundPlayPauseBtn.removeClass(prx+"btnPause").addClass(prx+"btnPlay");
            } else{
                $soundPlayPauseBtn.removeClass(prx+"btnPlay").addClass(prx+"btnPause");
            }
            if (plugin.settings['autoplay'] == true){
               playaudio();
            }
        }

        var createHtmlStructure = function(){
            if(plugin.settings['uriTranscript'] != null) {
                if(!is_touch_device){
                    hasPdf = true;
                }
            }

            if(is_touch_device){
              hasPdf = false;
              hasHelp = false;
            }


            $soundControls = $("<div class='"+prx+"soundControlBar'><button class='"+prx+"btnPlayPause "+prx+"btnPlay' type='button'><span class='"+prx+"btnLinkTitle'>"+pwTranslate["interface"]["playSound"]+"</span></button><div class='"+prx+"timeBar'><span class='"+prx+"soundTimeInfo "+prx+"soundElapsedTime'>00:00</span><div class='"+prx+"time'></div><span class='"+prx+"soundTimeInfo soundDuration'>--:--</span></div><button class='"+prx+"btnMute "+prx+"btnVolumeOff' type='button'><span class='"+prx+"btnLinkTitle'>"+pwTranslate["interface"]["cutSound"]+"</span></button><span class='"+prx+"volumeWrapper'><span class='"+prx+"volume'></span></span><button class='"+prx+"btnDl "+prx+"btnDlOn' type='button'><span class='"+prx+"btnLinkTitle'>"+pwTranslate["interface"]["downloadAudio"]+"</span></button><button class='"+prx+"btnTranscript "+prx+"btnTranscriptOn' type='button'><span class='"+prx+"btnLinkTitle'>"+pwTranslate["interface"]["showTranscript"]+"</span></button><button class='"+prx+"btnHelp btnHelpOn' type='button'><span class='"+prx+"btnLinkTitle'>"+pwTranslate["interface"]["soundHelp"]+"</span></button></div>");
            // Ipad Hack //

            var $container = $("<div style='width : "+plugin.settings["width"]+"px;' class='"+prx+"soundWrapper'></div>");
            $sound.after($container);
            var plg = $sound.data("audiopwplayer");
            var tmpaudio = $sound[0].cloneNode(true);

            $sound.remove();
            $container[0].appendChild(tmpaudio);
            
            $sound = $container.find("audio");
            sound = $sound[0];
            $sound.data("audiopwplayer",plg);
            $soundWrapper = $sound.parent('.soundWrapper');
            $sound.after($soundControls);

            // Fin hack Ipad //

            $soundToolTip = $("<span class='"+prx+"toolTip'></span>");
            $sound.after($soundToolTip);
            hideToolTips();

            $soundHelp = $("<div aria-live='polite' class='"+prx+"helpsound'></div>");
            $sound.after($soundHelp);

            $soundContainer = $sound.parent('.'+prx+'soundWrapper');
            $soundControlBar = $('.'+prx+'soundControlBar', $soundContainer);

            $soundPlayPauseBtn = $('.'+prx+'btnPlayPause', $soundContainer);

            $soundTimebar = $('.'+prx+'timeBar', $soundContainer);
            $soundElapsedTime = $('.'+prx+'soundElapsedTime', $soundContainer);
            $soundTime = $('.'+prx+'time', $soundContainer);
            $soundaudioDuration = $('.'+prx+'soundDuration', $soundContainer);
            $soundMuteBtn = $('.'+prx+'btnMute', $soundContainer);
            $soundVolumeContainer = $('.'+prx+'volumeWrapper', $soundContainer);
            $soundVolume = $('.'+prx+'volume', $soundContainer);
            $soundHelpBtn = $('.'+prx+'btnHelp', $soundContainer);
            $soundTranscriptBtn = $('.'+prx+'btnTranscript', $soundContainer);
            $soundDownloadBtn = $('.'+prx+'btnDl', $soundContainer);

            //The unnecessary buttons have to be removed
            if(hasPdf != true) {
               $soundTranscriptBtn.removeClass("displayBlock").addClass("displayNone");
            }
            if(hasHelp != true) {
               $soundHelpBtn.removeClass("displayBlock").addClass("displayNone");
            }
        };

        var setImagePreview = function(){
            if(plugin.settings['poster'] != null){
              $sound.attr('poster', plugin.settings['poster']);
            }
        };

        var setBindingEvents = function(){
            $soundPlayPauseBtn.bind((is_touch_device) ? 'touchstart' : 'click',switchPlayPauseBtnState);
            $soundPlayPauseBtn.bind('mouseover focusin',overPlayPauseBtn);
            $soundPlayPauseBtn.bind('mouseout focusout',outPlayPauseBtn);

            $soundTime.bind((is_touch_device) ? 'touchstart' : 'click',setAndPlayCurrentTimeOnClick);
            $soundTime.bind('mouseover',displayToolTipaudioTimeOnOver);
            $soundTime.bind('mousemove',displayToolTipaudioTimeOnMove);
            $soundTime.bind('mouseout',hideToolTips);

            $soundMuteBtn.bind((is_touch_device) ? 'touchstart' : 'click', switchVolumeBtnState);
            $soundMuteBtn.bind('mouseover focusin', overVolumeBtn);
            $soundMuteBtn.bind('mouseout focusout', hideToolTips);

            $soundVolume.bind((is_touch_device) ? 'touchstart' : 'click',setVolumeOnClick);
            $soundVolume.bind('mouseover',displayToolTipVolumeOnOver);
            $soundVolume.bind('mousemove',displayToolTipVolumeOnOver);
            $soundVolume.bind('mouseout',hideToolTips);

            $soundHelpBtn.bind((is_touch_device) ? 'touchstart' : 'click',switchDisplayHelpWindow);
            $soundHelpBtn.bind('mouseover focusin', function(){
                displayToolTips(pwTranslate["toolTip"]["aide"], $(this).offset().left);
            });
            $soundHelpBtn.bind('mouseout focusout',hideToolTips);

            $soundHelp.bind((is_touch_device) ? 'touchstart' : 'click',hideHelpWindow);

            $soundTranscriptBtn.bind((is_touch_device) ? 'touchstart' : 'click',displayaudioTranscript);
            $soundTranscriptBtn.bind('mouseover focusin', function(){
                displayToolTips(pwTranslate["toolTip"]["pdf"], $(this).offset().left);
            });
            $soundTranscriptBtn.bind('mouseout focusout',hideToolTips);

           
            $soundDownloadBtn.bind('mouseover focusin', function(){
                displayToolTips(pwTranslate["toolTip"]["downloadOn"], $(this).offset().left);
            });
            $soundDownloadBtn.bind('mouseout focusout',hideToolTips);
            $soundDownloadBtn.bind((is_touch_device) ? 'touchstart' : 'click',downloadAudioFile);
            
            $(window).keydown(playerMappingHotkey);

        };

        var setVolumeOnClick = function(e){
            var ev = e || window.event;
            var pos = findPos(this);      
            var diffx = ev.clientX - pos.x;      
            $soundVolume.progressbar({ value: diffx*100/$(this).width() });
            var newVolume = diffx/$(this).width();
            setaudioVolume(newVolume);  
        };

        var displayToolTipVolumeOnOver = function(e){
            var ev = e || window.event;
            var pos = findPos(this);      
            var diffx = ev.clientX - pos.x;      
            var newVolume = diffx*100/$(this).width();
            displayToolTips(pwTranslate["toolTip"]["volumeBar"] + " : " + newVolume + "%", ev.clientX-20);
        };

        var displayToolTipaudioTimeOnMove = function(e){
            var ev = e || window.event;
            var pos = findPos(this);      
            var diffx = ev.clientX - pos.x;  
            var newVolume = diffx*100/$(this).width();    
            displayToolTips(pwTranslate["toolTip"]["volumeBar"] + " : " + newVolume + "%", ev.clientX-20);
        };

        var setAndPlayCurrentTimeOnClick = function(e){
            var ev = e || window.event;
            var pos = findPos(this);      
            var diffx = ev.clientX - pos.x;      
            $soundTime.progressbar({ value: diffx*100/$(this).width() });
            var duration = getSoundDuration();
            if(!inFallbackMode){$sound[0].currentTime = diffx*duration/$(this).width();}
            else{$soundFallback.fsetTime(diffx*duration/$(this).width());}
            plugin.settings["callback"]["onSeekUpdate"]();
        }

        var displayToolTipaudioTimeOnOver = function(e){
            var ev = e || window.event;
            var pos = findPos(this);      
            var diffx = ev.clientX - pos.x;    
            var currentPercentageaudioPlaying = diffx*100/$(this).width();
            var audioDuration = getSoundDuration();
            var timeOverValue = (currentPercentageaudioPlaying*audioDuration)/100;
            displayToolTips(gTimeFormat(timeOverValue), e.pageX - $soundToolTip.width());
        };

        var displayToolTipaudioTimeOnMove = function(e){
            var ev = e || window.event;
            var pos = findPos(this);      
            var diffx = ev.clientX - pos.x;    
            var currentPercentageaudioPlaying = diffx*100/$(this).width();
            var audioDuration = getSoundDuration();
            var timeOverValue = (currentPercentageaudioPlaying*audioDuration)/100;
            displayToolTips(gTimeFormat(timeOverValue), e.pageX - $soundToolTip.width()/2);
        };

        var moveForwardFiveSec = function (){
        	if(!inFallbackMode)
        	{
	            $sound[0].currentTime += 5;
	            $soundTime.progressbar({ value: $sound[0].currentTime*100/getSoundDuration() });
	        }
	        else
	        {
	        	var newTime = $soundFallback.fcurrentTime()+5;
	        	$soundFallback.fsetTime(newTime);
	        	$soundTime.progressbar({ value: $soundFallback.fcurrentTime()*100/getSoundDuration() });
	        }
        };

        var moveBackwardFiveSec = function(){
        	if(!inFallbackMode)
        	{
	            $sound[0].currentTime -= 5;
	            $soundTime.progressbar({ value: $sound[0].currentTime*100/getSoundDuration() });
	        }
	        else
	        {
	        	var newTime = $soundFallback.fcurrentTime()-5;
	        	$soundFallback.fsetTime(newTime);
	        	$soundTime.progressbar({ value: $soundFallback.fcurrentTime()*100/getSoundDuration() });
	        }
        };

        function findPos(el) {
            var x = y = 0;    
            if(el.offsetParent) {    
                x = el.offsetLeft;    
                y = el.offsetTop;    
                while(el = el.offsetParent) {    
                    x += el.offsetLeft;    
                    y += el.offsetTop;    
                }    
            }    
            return {'x':x, 'y':y};    
        }

        var displayToolTips  = function(textToolTip, leftPosition){
            $soundToolTip.text(textToolTip);
            $soundToolTip.removeClass("displayNone").addClass("displayBlock");

            var toolTipTopPosition = $soundControls.offset().top - 29;
            $soundToolTip.css('top', toolTipTopPosition);

            $soundToolTip.css('left', leftPosition);

            $soundToolTip.removeClass("displayBlock").addClass("displayNone");
            $soundToolTip.removeClass("displayNone").addClass("displayBlock");
        };

        var hideToolTips = function(){
            $soundToolTip.removeClass("displayBlock").addClass("displayNone");
        };

        var progressBarMappingHotkey = function(e){
            if (!isPaused()){
                if (e.keyCode == 37){
                  moveBackwardFiveSec();
                }
                if (e.keyCode == 39){
                  moveForwardFiveSec();
                }

                if (e.shiftKey == true && e.keyCode == 226){
                  moveBackwardFiveSec();
                }

                if (e.shiftKey == false && e.keyCode == 226){
                  moveForwardFiveSec();
                }
            }
        };

        var updateaudioCurrentTime = function(){
            var currenttime = getSoundPosition();
            $soundElapsedTime.text(gTimeFormat(currenttime));
            var audioDuration = getSoundDuration();
            $soundaudioDuration.text(gTimeFormat(audioDuration));
            $('.'+prx+'time').removeAttr('aria-valuenow');

          if(isNaN(audioDuration) == true){
            $("."+prx+"soundTimeInfo").css("margin-left", 0);
            $("."+prx+"soundTimeInfo").css("margin-right", 0);
          }else{
            $("."+prx+"soundTimeInfo").css("margin-left", "3px");
            $("."+prx+"soundTimeInfo").css("margin-right", "3px");
          }

          if(getSoundFinishedStatus()){
            $soundTime.progressbar({ value: 0 });
            $soundElapsedTime.text(gTimeFormat(0));
            pauseaudio();
            if(inFallbackMode)$soundFallback.freset();
          }

        };

        var progressBarAutoUpdate = function(){
            $soundTime.progressbar({ value: $sound[0].currentTime*100/getSoundDuration() });
        };

        var findEventPositionXY = function(el){
            var x = y = 0;    
            if(el.offsetParent) {    
                x = el.offsetLeft;    
                y = el.offsetTop;    
                while(el = el.offsetParent) {    
                    x += el.offsetLeft;    
                    y += el.offsetTop;    
                }    
            }    
            return {'x':x, 'y':y};
        };

        var setaudioVolume = function(value){
           if(value == 0){
              $soundMuteBtn.removeClass(prx+"btnVolumeOff").addClass(prx+"btnVolumeOn");
              $soundMuteBtn.find("span").text(pwTranslate["interface"]["enableVolume"]);
            }
            else{
              $soundMuteBtn.removeClass(prx+"btnVolumeOn").addClass(prx+"btnVolumeOff");
              $soundMuteBtn.find("span").text(pwTranslate["interface"]["disableVolume"]);
            }

           $soundVolume.progressbar("option", "value", value*100);
           if(!inFallbackMode){$sound[0].volume = value;}
           else{$soundFallback.fsetVolume(value)}
           plugin.settings["callback"]["onVolumeChange"](value);
        };

        var isPaused = function(){
        	var r;
        	if(inFallbackMode){
        		r = !$soundFallback.fplaying();	
        	}
        	else{
        		r = $sound[0].paused;
        	}
        	return r;
        }

        var getSoundDuration = function()
        {
        	var r;
        	if(!inFallbackMode){
        		r = $sound[0].duration;
        	}
        	else{
        		r = $soundFallback.fduration();	
        	}
        	return r;
        }

        var getSoundPosition = function()
        {
        	var r;
        	if(inFallbackMode){
        		r = $soundFallback.fcurrentTime();
        	}
        	else{
        		r = $sound[0].currentTime;
        	}
        	return r;
        }

        var getSoundFinishedStatus = function()
        {
        	var r;
        	if(!inFallbackMode){
        		r = $sound[0].ended;
        	}
        	else{
        		r = $soundFallback.fended();
        	}
        	return r;
        }

        var playaudio = function(){
            if(!inFallbackMode)
            {
	            $sound[0].play();
        	}
        	else
        	{
        		$soundFallback.fplay();
        	}

        	timer = setInterval(function(){
	            $soundTime.progressbar({ value: getSoundPosition()*100/getSoundDuration() });
	            if(inFallbackMode)updateaudioCurrentTime();
	        }, 1000);

            $soundHelp.removeClass("inScreen").addClass("outScreen");
            $soundPlayPauseBtn.removeClass(prx+"btnPlay").addClass(prx+"btnPause");
            $soundPlayPauseBtn.first().html("<span class=\"btnLinkTitle\">"+pwTranslate["interface"]["stopSound"]+"</span>");

            hideToolTips();
            plugin.settings["callback"]["onPlayAudio"]();
        };

        var pauseaudio = function(){
              if(!inFallbackMode)
              {
	              $sound[0].pause();
	          }
	          else
	          {
	          	$soundFallback.fpause();
	          }

	            if(typeof timer != "undefined"){
	                clearInterval(timer);
	           }

              $soundPlayPauseBtn.removeClass(prx+"btnPause").addClass(prx+"btnPlay");
              $soundPlayPauseBtn.first().html("<span class=\"btnLinkTitle\">"+pwTranslate["interface"]["playSound"]+"</span>");

              hideToolTips();
              plugin.settings["callback"]["onStopAudio"]();
        };

        var switchPlayPauseBtnState = function(e){
    		if (isPaused()) {
                playaudio();
            } else {
                pauseaudio();
            }
        };

        var overPlayPauseBtn = function(){
            if (isPaused()){
              displayToolTips(pwTranslate["toolTip"]["play"], $(this).offset().left);
            }else{
              displayToolTips(pwTranslate["toolTip"]["pause"], $(this).offset().left);
            }
        };

        var outPlayPauseBtn = function(){
            hideToolTips();
        };

        var gTimeFormat = function(seconds) {
                var h = Math.floor(seconds / 3600);
                var m = Math.floor(seconds / 60) < 10 ? "0"+ Math.floor(seconds / 60) : Math.floor(seconds / 60);
                var s = Math.floor(seconds - (m * 60)) < 10 ? "0" + Math.floor(seconds - (m * 60)) : Math.floor(seconds - (m * 60));

                if(h>0){
                    m = m-60;
                    return h + ":" + m + ":" + s;
                }else{
                    return m + ":" + s;
                }
        };

        var switchVolumeBtnState = function(e){
            hideToolTips();
            //If the sound is greater than 0
            var volume = $soundVolume.progressbar("option", "value");
            if(volume > 0){
              setaudioVolume(0);
              $soundMuteBtn.removeClass(prx+"btnVolumeOff").addClass(prx+"btnVolumeOn");
              $soundMuteBtn.find('span').text(pwTranslate["interface"]["enableSound"]);
            }else{
              setaudioVolume(1);
              $soundMuteBtn.removeClass(prx+"btnVolumeOn").addClass(prx+"btnVolumeOff");
              $soundMuteBtn.find('span').text(pwTranslate["interface"]["disableSound"]);
            }   
        };

        var overVolumeBtn = function(){
            var volume = $soundVolume.progressbar("option", "value");
            if(volume > 0){
              displayToolTips(pwTranslate["toolTip"]["muteOff"], $(this).offset().left);
            }else{
              displayToolTips(pwTranslate["toolTip"]["muteOn"], $(this).offset().left);
            }
        };

        var outVolumeBtn = function(){
            hideToolTips();
        };


        var volumeUpKeyCode = function(){
            hideToolTips();
            var volume = $soundVolume.progressbar("option", "value");
            var newVolume = volume/100 + 0.1;
            if (newVolume <= 1) {setaudioVolume(volume/100 + 0.1);}
        };

        var volumeDownKeyCode = function(){
            var volume = $soundVolume.progressbar("option", "value");
            var newVolume = volume/100 - 0.1;
            if (newVolume > 0) {setaudioVolume(volume/100 - 0.1);}
            if (newVolume <= 0) {setaudioVolume(0);}
        }

        var displayaudioTranscript = function(){
            plugin.settings["callback"]["onTranscriptOpen"]();
            window.open(plugin.settings['uriTranscript']);

            pauseaudio();
            hideToolTips();

        };

        var downloadAudioFile = function()
        {
            hideToolTips();
            pauseaudio();
            plugin.settings["callback"]["onDownloadAudio"]();

            //Always get file from the first source
            var audioUrl = $sound.find("source")[0].getAttribute("src");
            var cleaner = new RegExp("(\\w|[-.])+$","g");
            var cleanFileName = cleaner.exec(audioUrl);

            if("download" in document.createElement("a"))
            {
                saveToDisk(audioUrl,cleanFileName[0]);
                window.open(audioUrl);
            }
            else
            {
                window.open(audioUrl);
            }
        }


        var  saveToDisk = function(fileURL, fileName) 
        {
            if (!window.ActiveXObject)
            {
                var save = document.createElement('a');
                save.href = fileURL;
                save.target = '_blank';
                save.download = fileName || 'unknown';
                $sound.append(save);

                var event = document.createEvent('Event');
                event.initEvent('click', true, true);
                save.dispatchEvent(event);
                (window.URL || window.webkitURL || window.mozURL).revokeObjectURL(save.href);
            }
            else if (window.ActiveXObject && document.execCommand)
            {
                var _window = window.open(fileURL, '_blank');
                _window.document.execCommand('SaveAs', true, fileName || fileURL);
            }
        }

        var switchDisplayHelpWindow = function(){
            if($soundHelp.css("width") != "1px"){
              hideHelpWindow();
              if (getSoundPosition() > 1){
                playaudio();
              }
            }else{
              displayHelpWindow();
              $(".helpsoundTitle").focus();
              pauseaudio();
            }
        }

        var displayHelpWindow = function(){
            $soundHelp.removeClass("outScreen").addClass("inScreen");
            plugin.settings["callback"]["onDisplayHelp"]();
        };

        var hideHelpWindow = function(){
            $soundHelp.removeClass("inScreen").addClass("outScreen");
            plugin.settings["callback"]["onHideHelp"]();
        };

        var createHelpWindow = function(){
            $soundHelp.append("<p class='"+prx+"helpsoundTitle'>"+pwTranslate["interface"]["help"]+"</p>");
            var pdfHelp = "<p aria-hidden='true'><img src='img/aide/pdf.png' alt=''/> "+pwTranslate["interface"]["showTranscriptOnSound"]+"</p>";
            var downloadHelp = "<p aria-hidden='true'><img src='img/aide/dl.png' alt=''/> "+pwTranslate["interface"]["downloadAudio"]+"</p>";
            $soundHelp.append(downloadHelp);

            if(hasPdf){
               $soundHelp.append(pdfHelp);
            }

            var shortcutHelp = "<br/><p><b>"+pwTranslate["interface"]["shortcutTitle"]+"</b></p>";
            var shortcuts = "<ul><li>"+pwTranslate["interface"]["shortcut1"]+"</li><li>"+pwTranslate["interface"]["shortcut2"]+"</li><li>"+pwTranslate["interface"]["shortcut3"]+"</li><li>"+pwTranslate["interface"]["shortcut4"]+"</li></ul>";

            $soundHelp.append(shortcutHelp);
            $soundHelp.append(shortcuts);

            var bottomTextHelp1 = "<p>"+pwTranslate["interface"]["audioPlayerAccessible"]+"</p>";
            var bottomTextHelp2 = "<p>"+pwTranslate["interface"]["poweredBy"]+" <a href='http://www.ipedis.com' target='_blank'>Ipedis</a>, "+pwTranslate["interface"]["ForCompany"]+"</p>";
            
            $soundHelp.append("<br/>");
            $soundHelp.append(bottomTextHelp1);
            $soundHelp.append(bottomTextHelp2);

            var totalw = plugin.settings["width"];
            var spanw = (totalw - 300)/2;
            $soundHelp.css('margin-left', spanw);
        };


        //Intercept the keyboard events
        var playerMappingHotkey = function(e){
            //Escape key : help
            if(e.keyCode == 27 ) {
                if($soundHelp.css("width") != "1px"){
                    hideHelpWindow();
                }
            }

            //Arrows or lower than : progress bar
            if (!isPaused()){
                if (e.keyCode == 37){
                  moveBackwardFiveSec();
                }
                if (e.keyCode == 39){
                  moveForwardFiveSec();
                }

                if (e.shiftKey == true && e.keyCode == 226){
                  moveBackwardFiveSec();
                }

                if (e.shiftKey == false && e.keyCode == 226){
                  moveForwardFiveSec();
                }


                //Ctrl + shift + page Up/down : Volume control
                if (e.ctrlKey && e.shiftKey && e.keyCode == 33){
                   volumeUpKeyCode();
                  
                }
                if (e.ctrlKey && e.shiftKey && e.keyCode == 34) {
                  volumeDownKeyCode();
                };

            };

        };

        /*** EXTERNAL API ***/
        plugin.play = function(el,params) {
            playaudio();
        };

        plugin.pause = function(el,params){
            pauseaudio();
        };

        plugin.setVolume =  function(el, params){
            if(typeof params["volume"] == "undefined"){
                return false;
            }
            if(params["volume"] > 100 || params["volume"] < 0){
                return false;
            }
            params["volume"] = params["volume"] / 100;
            setaudioVolume(params["volume"]);
        };

        plugin.displayHelp = function(el,params){
            displayHelpWindow();
        };

        plugin.hideHelp = function(el,params){
            hideHelpWindow();
        };
        
        plugin.openTranscript = function(el,params){
            displayaudioTranscript();
        };

        plugin.downloadAudio = function(el,params){
            downloadAudioFile();
        };

        plugin.construct();
    }

    $.fn.audiopwplayer = function(options, customParams) {
         return $(this).each(function() {
            if (undefined == $(this).data('audiopwplayer')) {
                if(typeof options == "undefined")
                    options = {};
                var plugin = new $.audiopwplayer(this, options);
                $(this).data('audiopwplayer', plugin);
            }

            if (typeof options === 'string') { 
                $(this).data('audiopwplayer')[options].call($(this),$(this),customParams);
            }

        });
    }
})(jQuery, window.App);