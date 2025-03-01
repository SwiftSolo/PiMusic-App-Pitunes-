const audioPlayer = document.getElementById('audio-player');
const stopButton = document.getElementById('stop-btn');
const prevButton = document.getElementById('prev-btn');
const nextButton = document.getElementById('next-btn');
const shuffleButton = document.getElementById('shuffle-btn');
const repeatButton = document.getElementById('repeat-btn');
const themeToggle = document.getElementById('theme-toggle');
const modeToggle = document.getElementById('mode-toggle');
const currentSongDisplay = document.getElementById('current-song');
const lyricsDisplay = document.getElementById('lyrics-display');
const albumArtDisplay = document.getElementById('album-art-display');
const volumeSlider = document.getElementById('volume-slider');
const bassSlider = document.getElementById('bass-slider');
const trebleSlider = document.getElementById('treble-slider');
const progressBar = document.getElementById('progress-bar');
const currentTimeSpan = document.getElementById('current-time');
const durationSpan = document.getElementById('duration');
const songList = document.querySelector('.song-list');
const addSongButton = document.getElementById('add-song-btn');
const songUrlInput = document.getElementById('song-url');
const songNameInput = document.getElementById('song-name');
const albumArtInput = document.getElementById('album-art');
const songLyricsInput = document.getElementById('song-lyrics');
const loginButton = document.getElementById('pi-login-btn');
const userInfo = document.getElementById('user-info');
const usernameSpan = document.getElementById('username');
let songItems = document.querySelectorAll('.song-list li');
let currentButton = null;
let currentIndex = -1;
let shuffleMode = false;
let repeatMode = 0;
let lastIndex = -1;
let singleSongMode = false;
let audioContext, source, bassFilter, trebleFilter;

// Load saved volume
const savedVolume = localStorage.getItem('volume');
if (savedVolume !== null) {
    volumeSlider.value = savedVolume;
    audioPlayer.volume = savedVolume;
}

function initializeAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        source = audioContext.createMediaElementSource(audioPlayer);
        bassFilter = audioContext.createBiquadFilter();
        trebleFilter = audioContext.createBiquadFilter();

        bassFilter.type = 'lowshelf';
        bassFilter.frequency.value = 200;
        trebleFilter.type = 'highshelf';
        trebleFilter.frequency.value = 2000;

        source.connect(bassFilter);
        bassFilter.connect(trebleFilter);
        trebleFilter.connect(audioContext.destination);

        bassSlider.disabled = false;
        trebleSlider.disabled = false;
        bassSlider.addEventListener('input', function() {
            bassFilter.gain.value = this.value;
        });
        trebleSlider.addEventListener('input', function() {
            trebleFilter.gain.value = this.value;
        });
    }
}

function attachPlayButtonListeners() {
    const playButtons = document.getElementsByClassName('play-btn');
    for (let i = 0; i < playButtons.length; i++) {
        playButtons[i].addEventListener('click', function() {
            const songItem = this.parentElement;
            const songSrc = songItem.getAttribute('data-src');
            currentIndex = Array.from(songItems).indexOf(songItem);

            if (songSrc) {
                if (currentButton && currentButton !== this) {
                    currentButton.textContent = 'Play';
                    currentButton.parentElement.classList.remove('active');
                }

                if (audioPlayer.src !== songSrc) {
                    audioPlayer.src = songSrc;
                    audioPlayer.play().catch(error => console.error('Playback failed:', error));
                    initializeAudioContext(); // Start AudioContext on user gesture
                    this.textContent = 'Pause';
                    songItem.classList.add('active');
                    currentButton = this;
                    updateSongDisplay(songItem);
                } else if (audioPlayer.paused) {
                    audioPlayer.play().catch(error => console.error('Playback failed:', error));
                    initializeAudioContext(); // Ensure AudioContext starts
                    this.textContent = 'Pause';
                    songItem.classList.add('active');
                    currentButton = this;
                    updateSongDisplay(songItem);
                } else {
                    audioPlayer.pause();
                    this.textContent = 'Play';
                    songItem.classList.remove('active');
                }
            }
        });
    }
}

function attachRemoveButtonListeners() {
    const removeButtons = document.getElementsByClassName('remove-btn');
    for (let i = 0; i < removeButtons.length; i++) {
        removeButtons[i].addEventListener('click', function() {
            const songItem = this.parentElement;
            const itemIndex = Array.from(songItems).indexOf(songItem);

            if (itemIndex === currentIndex) {
                stopButton.click();
            }

            if (itemIndex < currentIndex) {
                currentIndex--;
            } else if (itemIndex === currentIndex && currentIndex === songItems.length - 1) {
                currentIndex = -1;
            }

            songItem.remove();
            songItems = document.querySelectorAll('.song-list li');
        });
    }
}

attachPlayButtonListeners();
attachRemoveButtonListeners();

stopButton.addEventListener('click', function() {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    progressBar.value = 0;
    currentTimeSpan.textContent = '0:00';
    if (currentButton) {
        currentButton.textContent = 'Play';
        currentButton.parentElement.classList.remove('active');
    }
    currentSongDisplay.textContent = 'Now Playing: None';
    lyricsDisplay.textContent = 'Lyrics will appear here when a song is playing.';
    albumArtDisplay.src = 'https://via.placeholder.com/150';
});

prevButton.addEventListener('click', function() {
    if (singleSongMode) return;
    if (shuffleMode) {
        currentIndex = getRandomIndex();
        playSongAtIndex(currentIndex);
    } else if (currentIndex > 0) {
        currentIndex--;
        playSongAtIndex(currentIndex);
    }
});

nextButton.addEventListener('click', function() {
    if (singleSongMode) return;
    if (shuffleMode) {
        currentIndex = getRandomIndex();
        playSongAtIndex(currentIndex);
    } else if (currentIndex < songItems.length - 1) {
        currentIndex++;
        playSongAtIndex(currentIndex);
    }
});

audioPlayer.addEventListener('ended', function() {
    if (singleSongMode) {
        if (repeatMode === 2) {
            audioPlayer.currentTime = 0;
            audioPlayer.play().catch(error => console.error('Playback failed:', error));
        } else {
            stopButton.click();
        }
    } else if (repeatMode === 2) {
        audioPlayer.currentTime = 0;
        audioPlayer.play().catch(error => console.error('Playback failed:', error));
    } else if (shuffleMode) {
        currentIndex = getRandomIndex();
        playSongAtIndex(currentIndex);
    } else if (currentIndex < songItems.length - 1) {
        currentIndex++;
        playSongAtIndex(currentIndex);
    } else if (repeatMode === 1) {
        currentIndex = 0;
        playSongAtIndex(currentIndex);
    } else {
        stopButton.click();
    }
});

shuffleButton.addEventListener('click', function() {
    if (singleSongMode) return;
    shuffleMode = !shuffleMode;
    if (shuffleMode) {
        this.textContent = 'Shuffle On';
        this.classList.add('active');
    } else {
        this.textContent = 'Shuffle Off';
        this.classList.remove('active');
    }
});

repeatButton.addEventListener('click', function() {
    repeatMode = (repeatMode + 1) % 3;
    switch (repeatMode) {
        case 0:
            this.textContent = 'Repeat Off';
            this.classList.remove('active');
            break;
        case 1:
            this.textContent = singleSongMode ? 'Repeat Song' : 'Repeat Playlist';
            this.classList.add('active');
            break;
        case 2:
            this.textContent = 'Repeat Song';
            this.classList.add('active');
            break;
    }
});

themeToggle.addEventListener('click', function() {
    const body = document.body;
    if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        this.textContent = 'Dark Mode';
    } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        this.textContent = 'Light Mode';
    }
});

modeToggle.addEventListener('click', function() {
    const body = document.body;
    singleSongMode = !singleSongMode;
    if (singleSongMode) {
        body.classList.add('single-song-mode');
        this.textContent = 'Playlist Mode';
        shuffleButton.disabled = true;
        prevButton.disabled = true;
        nextButton.disabled = true;
        shuffleMode = false;
        shuffleButton.textContent = 'Shuffle Off';
        shuffleButton.classList.remove('active');
        repeatButton.textContent = repeatMode === 1 ? 'Repeat Song' : repeatButton.textContent;
    } else {
        body.classList.remove('single-song-mode');
        this.textContent = 'Single Song Mode';
        shuffleButton.disabled = false;
        prevButton.disabled = false;
        nextButton.disabled = false;
        repeatButton.textContent = repeatMode === 1 ? 'Repeat Playlist' : repeatButton.textContent;
    }
});

addSongButton.addEventListener('click', function() {
    const url = songUrlInput.value.trim();
    const name = songNameInput.value.trim() || 'Unnamed Song';
    const album = albumArtInput.value.trim() || 'https://via.placeholder.com/150';
    const lyrics = songLyricsInput.value.trim();
    if (url) {
        const newSongItem = document.createElement('li');
        newSongItem.setAttribute('data-src', url);
        newSongItem.setAttribute('data-lyrics', lyrics || 'No lyrics available.');
        newSongItem.setAttribute('data-album', album);
        newSongItem.innerHTML = `${name} <button class="play-btn">Play</button> <button class="remove-btn">Remove</button>`;
        songList.appendChild(newSongItem);

        songItems = document.querySelectorAll('.song-list li');
        attachPlayButtonListeners();
        attachRemoveButtonListeners();

        if (singleSongMode && songItems.length === 1) {
            playSongAtIndex(0);
        }

        songUrlInput.value = '';
        songNameInput.value = '';
        albumArtInput.value = '';
        songLyricsInput.value = '';
    } else {
        alert('Please enter a valid song URL!');
    }
});

if (window.location.protocol !== 'file:') {
    loginButton.style.display = 'block';
    loginButton.addEventListener('click', function() {
        Pi.authenticate(['username'], onIncompleteLogin).then(function(auth) {
            usernameSpan.textContent = auth.user.username;
            userInfo.style.display = 'block';
            loginButton.style.display = 'none';
        }).catch(function(error) {
            console.error('Login failed:', error);
            alert('Login failed. Please try again.');
        });
    });
}

function onIncompleteLogin() {
    alert('Login incomplete. Please complete the process in the Pi Browser.');
}

function playSongAtIndex(index) {
    if (currentButton) {
        currentButton.textContent = 'Play';
        currentButton.parentElement.classList.remove('active');
    }

    const songItem = songItems[index];
    const songSrc = songItem.getAttribute('data-src');
    const playButton = songItem.querySelector('.play-btn');

    audioPlayer.src = songSrc;
    audioPlayer.play().catch(error => console.error('Playback failed:', error));
    playButton.textContent = 'Pause';
    songItem.classList.add('active');
    currentButton = playButton;
    currentIndex = index;
    lastIndex = index;
    updateSongDisplay(songItem);
}

function updateSongDisplay(songItem) {
    currentSongDisplay.textContent = `Now Playing: ${songItem.textContent.trim().split('Play')[0].trim()}`;
    albumArtDisplay.src = songItem.getAttribute('data-album') || 'https://via.placeholder.com/150';
    lyricsDisplay.textContent = songItem.getAttribute('data-lyrics') || 'No lyrics available.';
    autoScrollLyrics();
}

function getRandomIndex() {
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * songItems.length);
    } while (newIndex === lastIndex && songItems.length > 1);
    return newIndex;
}

function autoScrollLyrics() {
    if (currentIndex < 0) return;
    const lyrics = songItems[currentIndex].getAttribute('data-lyrics');
    if (!lyrics || lyrics === 'No lyrics available.') return;

    const lines = lyrics.split('\n');
    const currentTime = audioPlayer.currentTime;

    let scrollPosition = 0;
    for (let i = 0; i < lines.length; i++) {
        const [timeStr] = lines[i].split(' - ');
        const timeParts = timeStr.split(':');
        const time = parseInt(timeParts[0]) * 60 + parseFloat(timeParts[1] || 0);
        if (currentTime >= time) {
            scrollPosition = (i / (lines.length - 1)) * (lyricsDisplay.scrollHeight - lyricsDisplay.clientHeight);
        } else {
            break;
        }
    }
    lyricsDisplay.scrollTop = scrollPosition;
}

volumeSlider.addEventListener('input', function() {
    audioPlayer.volume = this.value;
    localStorage.setItem('volume', this.value);
});

audioPlayer.addEventListener('loadedmetadata', function() {
    progressBar.max = audioPlayer.duration;
    durationSpan.textContent = formatTime(audioPlayer.duration);
});

audioPlayer.addEventListener('timeupdate', function() {
    progressBar.value = audioPlayer.currentTime;
    currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
    autoScrollLyrics();
});

progressBar.addEventListener('input', function() {
    audioPlayer.currentTime = this.value;
    autoScrollLyrics();
});

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
}