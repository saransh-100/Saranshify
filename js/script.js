let currentSong = null;
let lastVolume = 100;
let isMuted = false;

function formatTime(seconds) {
  if (isNaN(seconds)) return "00:00";
  let min = Math.floor(seconds / 60);
  let sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}
const rangeInput = document.querySelector(".range-input");
const volumeIcon = document.querySelector(".volume img");

function updateVolumeSliderFill(volume) {
  rangeInput.style.background = `linear-gradient(to right, white ${volume * 100}%, black ${volume * 100}%)`;
}

function updateSongListUI(currentSongSrc) {
  let currentSongFilename = decodeURIComponent(currentSongSrc.split("/").pop().trim());

  document.querySelectorAll(".song-list li").forEach((li) => {
      let liFilename = decodeURIComponent(li.getAttribute("data-filename")).trim();
      let playNowElement = li.querySelector(".play-now");
      let textSpan = playNowElement.querySelector("span");
      let playIcon = playNowElement.querySelector("img");
      if (!textSpan) {
        textSpan = document.createElement("span");
        playNowElement.prepend(textSpan);
    }
    
      if (liFilename === currentSongFilename && currentSong instanceof Audio && !currentSong.paused) {
          playNowElement.innerHTML = `Now Playing`;
      } else {
          playNowElement.innerHTML = `Play Now <img src="logos/play2.svg" alt="play icon">`;
      }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".range").style.opacity = "0";
  document.querySelector(".range").style.pointerEvents = "none";
  document.querySelector(".volume img").style.transition =
    "left 0.3s ease-in-out";
  let initialVolume = lastVolume / 100 || 1;
  rangeInput.value = initialVolume * 40;
  updateVolumeSliderFill(initialVolume);
  adjustIconPosition();
});

async function getSongs(folder) {
  let a = await fetch(`http://127.0.0.1:5500/${folder}/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let links = div.getElementsByTagName("a");
  let songs = [];
  for (let link of links) {
    let href = link.href;
    if (href.endsWith(".mp3")) {
        songs.push(href);
    }
}
  return songs;
}

const playSong = (song, pause = false) => {
  let decodedSong = decodeURIComponent(song);
  let songPath = decodedSong.startsWith("http") ? song : decodedSong;
  let songName = decodedSong.split("/").pop().split(".").shift();

  document.querySelector(".song-info").innerHTML = `${songName}`;
  document.querySelector(".song-time").innerHTML =
    formatTime(0) + " / " + formatTime(0);

  if (currentSong instanceof Audio) {
    currentSong.pause();
    currentSong.currentTime = 0;
  }
  currentSong = new Audio(songPath);

  if (!pause) {
    currentSong.play();
    document.querySelector("#play").src = "logos/pause.svg";
  } else {
    document.querySelector("#play").src = "logos/play.svg";
  }
  setTimeout(() => updateSongListUI(songPath), 300);

  const seekbar = document.querySelector(".seekbar");
  const circle = document.querySelector(".circle");

  currentSong.addEventListener("timeupdate", () => {
    let currentTime = formatTime(currentSong.currentTime);
    let duration = formatTime(currentSong.duration);
    let progress = (currentSong.currentTime / currentSong.duration) * 100;
    circle.style.left = `${progress}%`;
    seekbar.style.setProperty("--progress-width", `${progress}%`);
    document.querySelector(
      ".song-time"
    ).innerHTML = `${currentTime} / ${duration}`;
  });
  
  seekbar.addEventListener("click", (e) => {
    let seekTime = e.offsetX / e.target.getBoundingClientRect().width;
    circle.style.left = `${seekTime * 100}%`;
    currentSong.currentTime = currentSong.duration * seekTime;
    circle.style.transition = "left 0.5s";
    seekbar.style.setProperty("--progress-width", `${seekTime * 100}%`);
  });
};

async function loadSongs(folder) {
  let songs = await getSongs(folder);
  let ul = document.querySelector(".song-list ul");
  ul.innerHTML = "";

  if (songs.length > 0) {
    songs.forEach((song) => {
      let songName = song.split("/").pop();
      ul.innerHTML += `
                <li data-filename="${songName}">
                    <img src="logos/music.svg" alt="music" />
                    <div class="info">
                        <div class="song-name">${decodeURIComponent(
                          songName.split(".").shift()
                        )}</div>
                        <div class="artist-name">Nash</div>
                    </div>
                    <div class="play-now">
                        <span>Play Now</span>
                        <img src="logos/play2.svg" alt="play" />
                    </div>
                </li>`;
    });

    document.querySelectorAll(".song-list li").forEach((e) => {
      e.addEventListener("click", () => {
        let songFilename = e.getAttribute("data-filename");
        let songPath = `${folder}/${songFilename}`;
        // playSong(songPath);
        if (currentSong instanceof Audio && decodeURIComponent(currentSong.src.split("/").pop()) === songFilename) {
          if (currentSong.paused) {
            currentSong.play();
            document.querySelector("#play").src = "logos/pause.svg";
          } else {
            currentSong.pause();
            document.querySelector("#play").src = "logos/play.svg";
          }
        } else {
        document.querySelectorAll(".play-now").forEach((playNow) => {
          playNow.innerHTML = `Play Now <img src="logos/play2.svg" alt="play icon">`;
          playNow.style.width = "200px";
          playNow.style.display = "flex";
          playNow.style.gap = "15px";
        });

        let playNowElement = e.querySelector(".play-now");
    playNowElement.innerText = "Now Playing";

        let playIcon = playNowElement.querySelector("img");
        if (playIcon) playIcon.remove();
        
        playSong(songPath);
      }
      });
    });
    playSong(songs[0], true);
  } else {
    ul.innerHTML = `No songs found in this folder.`;
  }
}

function adjustIconPosition() {
  let volumeImg = document.querySelector(".volume img");
  if (window.innerWidth < 700) {
    volumeImg.style.left = "50%";
  } else {
    volumeImg.style.left = "93.25%";
  }
  volumeImg.style.transform = "translateX(-50%)";
}

async function displayAlbums() {
  let albums = await fetch("http://127.0.0.1:5500/songs/");
  let response = await albums.text();
  let div = document.createElement("div");
  let cardContainer = document.querySelector(".card-container");
  div.innerHTML = response;
  let anchors = div.getElementsByTagName("a");
  cardContainer.innerHTML = "";
  let array = Array.from(anchors);
  cardContainer.innerHTML = "";
  for (let i = 0; i < array.length; i++) {
    let e = array[i];
    let hrefParts = e.href.split("/");
    let albumFolder =
      hrefParts[hrefParts.length - 1] || hrefParts[hrefParts.length - 2];
    if (
      albumFolder &&
      albumFolder !== "songs" &&
      !albumFolder.includes(".") &&
      albumFolder !== ""
    ) {
      let albumData = await fetch(
        `http://127.0.0.1:5500/songs/${albumFolder}/info.json`
      );
      let response = await albumData.json();
      cardContainer.innerHTML =
        cardContainer.innerHTML +
        `
                <div class="card" data-folder="${albumFolder}">
                    <svg class="play" width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="12" />
                        <polygon points="9,6 18,12 9,18" />
                    </svg>                                     
                      <img src="/songs/${albumFolder}/cover.jpg" alt="card" />
                    <h2 class="hover-underline">${response.title}</h2>
                    <p class="hover-underline">${response.description}</p>
                </div>`;
    }
  } 
  
}

async function main() {
  let defaultFolder = "songs/rock";
  await loadSongs(defaultFolder);
  await displayAlbums();

  let songList = document.querySelector(".song-list");
  let spaceIcon = document.querySelector(".space");
  let isHidden = false;
  songList.style.display = "none";
    document.querySelectorAll(".card").forEach((e) => {
    e.addEventListener("click", async (item) => {
      let folder = `songs/${item.currentTarget.dataset.folder}`;
      let songs = await loadSongs(folder);
      if (songs.length > 0) {
        playSong(songs[0]);
      }
    });
  });

  document.querySelector("#play").addEventListener("click", () => {
    if (!(currentSong instanceof Audio)) return;
    let playButton = document.querySelector("#play");
    if (currentSong.paused) {
      currentSong.play();
      playButton.src = "logos/pause.svg";
    } else {
      currentSong.pause();
      playButton.src = "logos/play.svg";
    }
    let currentSongFilename = decodeURIComponent(currentSong.src.split("/").pop().trim());
    document.querySelectorAll(".song-list li").forEach((li) => {
      let liFilename = decodeURIComponent(li.getAttribute("data-filename")).trim();
      let playNowElement = li.querySelector(".play-now");
      if (liFilename === currentSongFilename && !currentSong.paused) {
        playNowElement.innerHTML = `Now Playing`;
      } else {
        playNowElement.innerHTML = `Play Now <img src="logos/play2.svg" alt="play icon">`;
        playNowElement.style.width = "200px";
        playNowElement.style.display = "flex";
        playNowElement.style.gap = "15px";
      }
    });
  });
  
  
  document.querySelector("#prev").addEventListener("click", async () => {
    if (!(currentSong instanceof Audio)) return;
    let folder = currentSong.src.split("/").slice(-2, -1)[0];
    let songs = await getSongs(`songs/${folder}`);
    let currentIndex = songs.findIndex(song => decodeURIComponent(song) === decodeURIComponent(currentSong.src));

    if (currentIndex > 0) {
        let prevIndex = currentIndex - 1;
        playSong(songs[prevIndex]);     
      }
});

document.querySelector("#next").addEventListener("click", async () => {
  if (!(currentSong instanceof Audio)) return;
    let folder = currentSong.src.split("/").slice(-2, -1)[0];
    let songs = await getSongs(`songs/${folder}`);
    let currentIndex = songs.findIndex(song => decodeURIComponent(song) === decodeURIComponent(currentSong.src));

    if (currentIndex < songs.length - 1) {
        let nextIndex = currentIndex + 1;
        playSong(songs[nextIndex]);
      }
});


  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").classList.add("active");
  });

  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").classList.remove("active");
  });

  document.querySelector(".volume").addEventListener("mouseenter", () => {
     let volumeContainer = document.querySelector(".volume");
    let rangeContainer = document.querySelector(".range");
    let rangeInput = document.querySelector(".range-input");
    let currentVolume = rangeInput.value / 100;
    updateVolumeSliderFill(currentVolume);
    volumeContainer.style.display = "flex";
    volumeContainer.style.alignItems = "center"; 
    volumeContainer.style.justifyContent = "center"; 
    volumeContainer.style.width = "150px";
    rangeContainer.style.opacity = "1";
    rangeContainer.style.pointerEvents = "auto";
    rangeContainer.style.transition =
      "opacity 0.3s ease-in-out";
    rangeContainer.style.zIndex = "1";
    rangeContainer.style.flexGrow = "1";
    rangeContainer.style.width = "100px";
    rangeInput.style.width = "100px";
  });

  document.querySelector(".volume").addEventListener("mouseleave", () => {
    setTimeout(() => {
      if (!document.querySelector(".range-input").matches(":hover")) {
        document.querySelector(".range").style.opacity = "0";
        document.querySelector(".range").style.pointerEvents = "none";
        document.querySelector(".range").style.zIndex = "-1";
        adjustIconPosition();
      }
    }, 300);
  });

  document.querySelector(".volume img").addEventListener("click", (e) => {
    e.stopPropagation();
    if (isMuted) {
      currentSong.volume = lastVolume / 100;
      document.querySelector(".range-input").value = lastVolume;
      document.querySelector(".volume img").src = "logos/volume.svg";
      isMuted = false;
    } else {
      lastVolume = document.querySelector(".range-input").value;
      currentSong.volume = 0;
      document.querySelector(".range-input").value = 0;
      document.querySelector(".volume img").src = "logos/mute.svg";
      isMuted = true;
    }
  });

  songList.style.display = "block";

  spaceIcon.addEventListener("click", () => {
    isHidden = !isHidden;
    songList.style.display = isHidden ? "none" : "block";
    spaceIcon.src = isHidden ? "logos/plus.svg": "logos/minus.svg";
  });
  
  rangeInput.addEventListener("input", (e) => {
    const volume = e.target.value / 100;
    currentSong.volume = volume;
    if (volume === 0) {
      document.querySelector(".volume img").src = "logos/mute.svg";
      isMuted = true;
    } else {
      document.querySelector(".volume img").src = "logos/volume.svg";
      lastVolume = volume * 100;
      isMuted = false;
    }
    
    updateVolumeSliderFill(volume);
  });

  window.addEventListener("resize", adjustIconPosition);
}

window.addEventListener("load", main);
