window.onload = function() {
  init.songDb(init.artistList);
  init.preloadImage();
  init.searching();
};
var init = {
  songDb: function(callback) {
    jukebox.init(callback);
  },
  artistList: function() {
    window.artistList = songDb.filter(function(item) {
      return item.length === 2;
    }).map(function(item) {
      return item[0];
    });
  },
  preloadImage: function() {
    var srcs = [
      "http://downloads.munin-monitoring.org/assets/glyphicons_free/glyphicons/png/glyphicons-18-music.png",
      "http://downloads.munin-monitoring.org/assets/glyphicons_free/glyphicons/png/glyphicons-4-user.png"
    ];
    srcs.forEach(function(url) {
      var img = new Image();
      img.src = url;
    });
  },
  searching: function() {
    searchBox.init();
  }
};

var jukebox = {
  init: function(callback) {
    var that = this;
    this.load(function(data) {
      data = that.transform(data);
      window.songDb = data;
      callback();
      util.hideSpinner();
    });
  },
  load: function(callback) {
    var r = new XMLHttpRequest(); 
    r.open("GET", "songdb.js", true);
    r.onreadystatechange = function () {
      if (r.readyState != 4 || r.status != 200) {
        return; 
      }
      callback(r.responseText);
    };
    r.send();
    
    //workaround
    // callback(songdbtxt);
  },
  transform: function(data) {
    var output = [];
    data.split('\n').forEach(function(line) {
      var array = line.split(',');
      output.push(array);
    });
    return output;
  },
  findSongByArtist: function(id) {
    return songDb.filter(function(item) {
      return item[1] == id && item.length === 3;
    });
  }
};
var searchBox = {
  init: function() {
    window.suggestBox = document.getElementById('suggest-box');
    this.element().onkeyup = function() {
      if(searchBox.val().length < 1) {
        suggestBox.style.display = 'none';
      } else {
        suggestBox.style.display = 'block';
        suggestion.suggestWith(searchBox.val());
      }
    };
    this.element().onfocus = function() {
      searchBox.gotoTop();
    };
  },
  element: function() {
    return document.getElementById('search-box');
  },
  val: function() {
    return this.element().value;
  },
  gotoTop: function() {
    var top = document.getElementById('search').offsetTop;
    util.scrollTo(top, 150);
  },
};
var suggestion = {
  suggestWith: function(str) {
    var items = this.indexOfSearch(str);
    var suggestItems = this.createSuggestItem(items, str);
    
    var suggestBox = document.getElementById('suggest-box');
    suggestBox.innerHTML = suggestItems.join('');
  },
  indexOfSearch: function(str) {
    str = str.toLowerCase();
    // return songDb.filter(function(item) {
      // return item[0].toLowerCase().indexOf(str) >= 0;
    // });
    var len = str.length;
    return songDb.reduce(function(output, item) {
      var index = item[0].toLowerCase().indexOf(str);
      if(index >= 0) {
        output.push({item: item, index: index, len: len});
      }
      return output;
    }, []);
  },
  createSuggestItem: function(sugestList, str) {
    return sugestList.map(function(suggest) {
      var item = suggest.item,
        index = suggest.index,
        len = suggest.len;
      if(item.length === 2) {
        return suggestion.createArtistItem(item[1], item[0], index, len);
      } else {
        var artist = window.artistList[item[1]];
        return suggestion.createSongItem(item[2], item[0], item[1], artist, index, len);
      }
    });
  },
  createArtistItem: function(id, artist, index, len) {
    return '<div class="item search-song-item" artist-id="' + id + '" onclick="onClickSuggestItem(this)">' + 
      '<img src="http://downloads.munin-monitoring.org/assets/glyphicons_free/glyphicons/png/glyphicons-4-user.png" /><a href="#">' + 
      this.highlight(artist, index, len) + 
      '</a></div>';
  },
  createSongItem: function(songId, song, artistId, artist, index, len) {
    return '<div class="item search-song-item" artist-id="' + artistId + '" song-id="' + songId + '" onclick="onClickSuggestItem(this)">' + 
      '<img src="ttp://downloads.munin-monitoring.org/assets/glyphicons_free/glyphicons/png/glyphicons-18-music.png" />' + 
      '<span class="song-id">' + songId + ' - </span>' +
      this.highlight(song, index, len) + 
      '<span class="artist"><a href="#">' + artist + '</a></span>' +
      '</div>';
  },
  highlight: function(str, index, len) {
    return str.substring(0, index) +
      '<strong>' + str.substring(index, index + len) + '</strong>' +
      str.substring(index + len);
  }
};
function onClickSuggestItem(ele) {
  suggestBox.style.display = 'none';
  var songId = ele.getAttribute('song-id');
  var artistId = parseInt(ele.getAttribute('artist-id'), 10);
  var songs = jukebox.findSongByArtist(artistId);
  playlist.setArtistName(artistList[artistId]);
  playlist.setSongList(songs);
}
var playlist = {
  setArtistName: function(artistName) {
    document.getElementById('artist-name').innerHTML = artistName;  
  },
  setSongList: function(songs) {
    songs = this.createSongList(songs);
    document.getElementById('song-list').innerHTML = songs;
  },
  createSongList: function(songs) {
    return songs.map(function(song) {
      return '<tr>' +
        '<td>' + song[2] + '</td>' +
        '<td>' + song[0] + '</td>' +
        '</tr>';
    }).join('');
  }
};

var util = {
  scrollTo: function(y, scrollDuration) {
    var scrollHeight = window.scrollY - y,
          scrollStep = Math.PI / ( scrollDuration / 15 ),
          cosParameter = scrollHeight / 2,
          scrollY = window.scrollY;
    var   scrollCount = 0,
          scrollMargin;
    requestAnimationFrame(step);        
    function step () {
      setTimeout(function() {
        if ( window.scrollY < y - 1 || window.scrollY > y + 1 ) {
          scrollCount = scrollCount + 1;  
          scrollMargin = cosParameter - cosParameter * Math.cos( scrollCount * scrollStep );
          window.scrollTo( 0, ( scrollY - scrollMargin ) );
          requestAnimationFrame(step);
        }
      }, 15 );
    }
  },
  hideSpinner: function() {
    document.getElementById('fade').style.display = 'none';
    document.getElementById('spinner').style.display = 'none';
  }
};

var feedback = {
  element: function() {
    return document.getElementById('feedback');
  },
  backdropElement: function() {
    return document.getElementById('feedback-backdrop');
  },
  openModal: function() {
    this.backdropElement().style.display = 'block';
    this.element().style.display = 'block';
  },
  closeModal: function() {
    this.backdropElement().style.display = 'none';
    this.element().style.display = 'none';
  }
};
var songdbtxt = "ลาบานูน,0\nGetsunova,1\nเชือกวิเศษ,0,27822\nเท่าเดิม,0,22829\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912\nไกลแค่ไหนคือใกล้,1,12912";