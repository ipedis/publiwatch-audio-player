package
{
	import flash.display.Sprite;
	import flash.external.ExternalInterface;
	import flash.net.URLRequest;
	import flash.media.Sound;
	import flash.media.SoundChannel;
	import flash.media.SoundTransform;
	import flash.events.Event;
	import flash.system.Security;
	import flash.events.ProgressEvent;

	public class pwaudio extends Sprite
	{
		private var channel:SoundChannel;
		private var sound:Sound;
  		private var pausePoint:Number = 0;
		private var playing:Boolean = false;
		private var ended:Boolean = false;
  		private var volume:Number = 1;

  		/*CONSTRUCT*/
		public function pwaudio():void
		{
			Security.allowDomain("*");

			this.sound = new Sound();
			this.channel = new SoundChannel();
			this.sound.load(new URLRequest(stage.loaderInfo.parameters["audioUrl"]));
			this.channel.addEventListener(Event.SOUND_COMPLETE,soundEndedHandler);

			/*Adding ExternalInterface callbaks*/
		    ExternalInterface.addCallback('fplay', play);
		    ExternalInterface.addCallback('fpause', pause);
		    ExternalInterface.addCallback('fsetVolume', setVolume);
		    ExternalInterface.addCallback('fplaying', isPlaying);
		    ExternalInterface.addCallback('freset', resetSound);
		    ExternalInterface.addCallback('fended', isEnded);
		    ExternalInterface.addCallback('fduration', getDuration);
		    ExternalInterface.addCallback('fcurrentTime', getCurrentTime);
		    ExternalInterface.addCallback('fsetTime', setCurrentTime);
		}

		/*HANDLE SOUND EVENTS*/
		private function soundEndedHandler(e:Event):void{
			this.ended = true;
		}

		/*PUBLIC METHODS*/
		public function getDuration():Number
		{
			return this.sound.length/1000;
		}

		public function getCurrentTime():Number
		{
			return this.channel.position/1000;
		}

		public function setCurrentTime(seconds:Number):void
		{
			var flag:Boolean = false;
			if(this.playing) flag = true;

			this.channel.stop();
			this.channel = this.sound.play(seconds*1000);
			this.channel.addEventListener(Event.SOUND_COMPLETE,soundEndedHandler);
			this.setVolume(this.volume);
			if(!flag) pause();
		}

		private function setVolume(vol:Number):void
		{
		    this.volume = vol;
		    var transform:SoundTransform = this.channel.soundTransform;
		    if (vol < 0) vol = 0;
		    if (vol > 1) vol = 1;
		    transform.volume = vol;
		    channel.soundTransform = transform;
		}

		public function isPlaying():Boolean
		{
			return this.playing;
		}

		public function isEnded():Boolean
		{
			return this.ended;
		}

		/*PRIVATE METHODS*/
		private function play():void 
		{
			this.channel = this.sound.play(this.pausePoint);
			this.setVolume(this.volume);
			this.playing = true;
		}

		private function pause():void 
		{
		    this.pausePoint = this.channel.position;
		    this.channel.stop();
		    this.playing = false;
		}

		private function resetSound():void
		{
			this.pausePoint = 0;
			this.ended = false;
		}
	}
}