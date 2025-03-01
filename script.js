// Music Playback
const audioPlayer = document.getElementById('audio-player');
const playButtons = document.getElementsByClassName('play-btn');

for (let i = 0; i < playButtons.length; i++) {
    playButtons[i].addEventListener('click', function() {
        const songItem = this.parentElement;
        const songSrc = songItem.getAttribute('data-src');

        if (songSrc) {
            audioPlayer.src = songSrc;
            audioPlayer.play();
            this.textContent = 'Pause';
            this.addEventListener('click', togglePlayPause);
            this.removeEventListener('click', arguments.callee);
        }
    });
}

function togglePlayPause() {
    if (audioPlayer.paused) {
        audioPlayer.play();
        this.textContent = 'Pause';
    } else {
        audioPlayer.pause();
        this.textContent = 'Play';
    }
}

// Pi Network Login
const loginButton = document.getElementById('pi-login-btn');
const userInfo = document.getElementById('user-info');
const usernameSpan = document.getElementById('username');

loginButton.addEventListener('click', function() {
    Pi.authenticate(['username'], onIncompleteLogin).then(function(auth) {
        // Successful login
        usernameSpan.textContent = auth.user.username;
        userInfo.style.display = 'block';
        loginButton.style.display = 'none';
    }).catch(function(error) {
        console.error('Login failed:', error);
        alert('Login failed. Please try again.');
    });
});

function onIncompleteLogin() {
    alert('Login incomplete. Please complete the process in the Pi Browser.');
}