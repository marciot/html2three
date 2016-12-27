class Soundscape {
    constructor(scene) {
        this.listener = new THREE.AudioListener();
        
        this.touchSound = new THREE.PositionalAudio( this.listener );
        
        var audioLoader = new THREE.AudioLoader();
        
        var me = this;
        audioLoader.load( 'sounds/click.wav', function( buffer ) {
            me.touchSound.setBuffer( buffer );
            me.touchSound.setRefDistance( 20 );
        });
    }
    
    playTouchSound(position) {
        this.touchSound.position.copy(position);
        this.touchSound.play();
    }
}