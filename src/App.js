import { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';
import qs from 'qs';

function App() {
  const CLIENT_ID = "bff30eecd6274d27a966edb890fc9f57";
  const ENDPOINT = "https://accounts.spotify.com/authorize";
  const REDIRECT_URI = "http://localhost:3000";
  const SCOPES = ['user-top-read','user-read-private','user-read-email','playlist-modify-private', 'playlist-modify-public', 'playlist-read-private'];
  const SCOPES_PARAMETER = SCOPES.join("%20");

  const [shortData, setShortData] = useState({});
  const [mediumData, setMediumData] = useState({});
  const [longData, setLongData] = useState({});

  const getReturnparameters = (search) => {
    const url = search.substring(1);
    const parametersInUrl = url.split("&")
    const splitParameters = parametersInUrl.reduce((accumulater, currValue) => {
      const [key, value] = currValue.split("=");
      accumulater[key] = value;
      return accumulater;
    }, {});
    return splitParameters;
  }

  useEffect(() => {
    if(window.location.search) {

      const {code} = getReturnparameters(window.location.search);
      
      localStorage.clear();
      localStorage.setItem("authCode", code);
      if(localStorage.getItem("authCode") !== "undefined") {
        axios({
          method: "post", 
          url: "https://accounts.spotify.com/api/token", 
          data: qs.stringify({grant_type: "authorization_code", code: localStorage.getItem("authCode"), redirect_uri: REDIRECT_URI}), 
          headers: {
            "Content-Type": "application/x-www-form-urlencoded", 
            Authorization: `Basic YmZmMzBlZWNkNjI3NGQyN2E5NjZlZGI4OTBmYzlmNTc6YjllNTlmZDg0MWNkNDRhMWE1NDNjYTQ0MTRlZmRlMjc=`},
          }).then(response => {
              localStorage.setItem("authToken",response.data.access_token);
              axios({
                method: "get",
                url: "https://api.spotify.com/v1/me",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                }
            }).then(response => {
                localStorage.setItem("userID", response.data.id);
            }).catch((err) => {
                //console.log(err);
            });
              axios({
                method: "get",
                url: "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                }
            }).then(response => {
                setShortData(response.data);
            }).catch((err) => {
                console.log(err);
            });
            axios({
              method: "get",
              url: "https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              }
            }).then(response => {
                setMediumData(response.data);
            }).catch((err) => {
                console.log(err);
            });
          axios({
            method: "get",
            url: "https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            }
        }).then(response => {
          setLongData(response.data);
        }).catch((err) => {
            console.log(err);
        });
          }).catch((err) => {
              //console.log(err);
          });
      }
    }
  },[]);

  
  const handleLogin = () => {
    window.location = `${ENDPOINT}?response_type=code&client_id=${CLIENT_ID}&scope=${SCOPES_PARAMETER}&redirect_uri=${REDIRECT_URI}`;
  };

  const makeShortPlaylist = () => {
    axios({ // get users playlists
      method: "get",
      url: "https://api.spotify.com/v1/me/playlists?limit=50",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      }
    }).then(response => {
      let i=0;
      let foundID = false;
      while(!foundID && i < response.data.total ){
        if(response.data.items[i].name === "Top 50 of the Month"){ // checks if playlist already exists, if it does, delete tracks in playlist and add new tracks
          let playlistID = response.data.items[i].id;
          axios({ // get the specific playlist
            method: "get", 
            url: `https://api.spotify.com/v1/playlists/${playlistID}`,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`},
            }).then(response => { // delete tracks
              let playlistTracks = [];
              for(let j=0; j < response.data.tracks.total; j++){
                playlistTracks.push({"uri": response.data.tracks.items[j].track.uri});
              }
              axios({ 
                method: "delete",
                url: `https://api.spotify.com/v1/playlists/${playlistID}/tracks`,
                data: {
                  tracks: playlistTracks
                },
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                }
              }).then(response => {
                axios({ // add tracks
                  method: "post", 
                  url: `https://api.spotify.com/v1/playlists/${playlistID}/tracks?uris=${shortData?.items ? shortData.items.map((item) => (`${item.uri}`)) : null}`, 
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`},
                  }).catch((err) => {
                      console.log(err);
                  });
              }).catch((err) => {
                  console.log(err);
              });
            }).catch((err) => {
                console.log(err);
            });
            foundID = true;
        }
        i++
      }
      if(!foundID) // if playlist doesn't exist, make the playlist
        {
          axios({
            method: "post", 
            url: `https://api.spotify.com/v1/users/${localStorage.getItem("userID")}/playlists`, 
            data: {
              name: "Top 50 of the Month", 
              description: "Your Top 50 of the Month !", 
              public: false}, 
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`},
            }).then(response => {
              axios({
                method: "post", 
                url: `https://api.spotify.com/v1/playlists/${response.data.id}/tracks?uris=${shortData?.items ? shortData.items.map((item) => (`${item.uri}`)) : null}`, 
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`},
                }).catch((err) => {
                    console.log(err);
                });
            }).catch((err) => {
                console.log(err);
            });
        }
    }).catch((err) => {
        console.log(err);
    });
  };

  const makeMediumPlaylist = () => {
    axios({ // get users playlists
      method: "get",
      url: "https://api.spotify.com/v1/me/playlists?limit=50",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      }
    }).then(response => {
      let i=0;
      let foundID = false;
      while(!foundID && i < response.data.total ){
        if(response.data.items[i].name === "Top 50 of 6 Months"){ // checks if playlist already exists, if it does, delete tracks in playlist and add new tracks
          let playlistID = response.data.items[i].id;
          axios({ // get the specific playlist
            method: "get", 
            url: `https://api.spotify.com/v1/playlists/${playlistID}`,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`},
            }).then(response => { // delete tracks
              let playlistTracks = [];
              for(let j=0; j < response.data.tracks.total; j++){
                playlistTracks.push({"uri": response.data.tracks.items[j].track.uri});
              }
              axios({ 
                method: "delete",
                url: `https://api.spotify.com/v1/playlists/${playlistID}/tracks`,
                data: {
                  tracks: playlistTracks
                },
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                }
              }).then(response => {
                axios({ // add tracks
                  method: "post", 
                  url: `https://api.spotify.com/v1/playlists/${playlistID}/tracks?uris=${mediumData?.items ? mediumData.items.map((item) => (`${item.uri}`)) : null}`, 
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`},
                  }).catch((err) => {
                      console.log(err);
                  });
              }).catch((err) => {
                  console.log(err);
              });
            }).catch((err) => {
                console.log(err);
            });
            foundID = true;
        }
        i++
      }
      if(!foundID) // if playlist doesn't exist, make the playlist
        {
          axios({
            method: "post", 
            url: `https://api.spotify.com/v1/users/${localStorage.getItem("userID")}/playlists`, 
            data: {
              name: "Top 50 of 6 Months", 
              description: "Your Top 50 of 6 Months !", 
              public: false}, 
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`},
            }).then(response => {
              axios({
                method: "post", 
                url: `https://api.spotify.com/v1/playlists/${response.data.id}/tracks?uris=${mediumData?.items ? mediumData.items.map((item) => (`${item.uri}`)) : null}`, 
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`},
                }).catch((err) => {
                    console.log(err);
                });
            }).catch((err) => {
                console.log(err);
            });
        }
    }).catch((err) => {
        console.log(err);
    });
  };

  // make playlist of the users all-time 50 songs
  const makeLongPlaylist = () => {
    axios({ // get users playlists
      method: "get",
      url: "https://api.spotify.com/v1/me/playlists?limit=50",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      }
    }).then(response => {
      let i=0;
      let foundID = false;
      while(!foundID && i < response.data.total ){
        if(response.data.items[i].name === "Top 50 of All-time"){ // checks if playlist already exists, if it does, delete tracks in playlist and add new tracks
          let playlistID = response.data.items[i].id;
          axios({ // get the specific playlist
            method: "get", 
            url: `https://api.spotify.com/v1/playlists/${playlistID}`,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`},
            }).then(response => { // delete tracks
              let playlistTracks = [];
              for(let j=0; j < response.data.tracks.total; j++){
                playlistTracks.push({"uri": response.data.tracks.items[j].track.uri});
              }
              axios({ 
                method: "delete",
                url: `https://api.spotify.com/v1/playlists/${playlistID}/tracks`,
                data: {
                  tracks: playlistTracks
                },
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                }
              }).then(response => {
                axios({ // add tracks
                  method: "post", 
                  url: `https://api.spotify.com/v1/playlists/${playlistID}/tracks?uris=${longData?.items ? longData.items.map((item) => (`${item.uri}`)) : null}`, 
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`},
                  }).catch((err) => {
                      console.log(err);
                  });
              }).catch((err) => {
                  console.log(err);
              });
            }).catch((err) => {
                console.log(err);
            });
            foundID = true;
        }
        i++
      }
      if(!foundID) // if playlist doesn't exist, make the playlist
        {
          axios({
            method: "post", 
            url: `https://api.spotify.com/v1/users/${localStorage.getItem("userID")}/playlists`, 
            data: {
              name: "Top 50 of All-time", 
              description: "Your Top 50 of All-time !", 
              public: false}, 
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`},
            }).then(response => {
              axios({
                method: "post", 
                url: `https://api.spotify.com/v1/playlists/${response.data.id}/tracks?uris=${longData?.items ? longData.items.map((item) => (`${item.uri}`)) : null}`, 
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`},
                }).catch((err) => {
                    console.log(err);
                });
            }).catch((err) => {
                console.log(err);
            });
        }
    }).catch((err) => {
        console.log(err);
    });
  };

  const displayPlaylists = (type) => {
    let playlistType;
    switch(type){
      case "short":
        playlistType = shortData;
        break;
      case "medium":
        playlistType = mediumData;
        break;
      case "long":
        playlistType = longData;
        break;
      default:
        return null;
    }
    return(
      <>
        <div className='Playlist-list'>
          {playlistType?.items ? playlistType.items.map((item,i) => 
          <>
            <div className="track" key={i}>
              <img src={item.album.images[2].url}/>
              <a style={{fontSize: '23px'}}>{item.name}
                <br/>
                {item?.artists ? item.artists.map((names,j) => <><span style={{fontSize: '15px'}}>{names.name}</span>
                {Object.keys(item.artists).length > 1 && j < Object.keys(item.artists).length-1 ? (<span style={{fontSize: '15px'}}>, </span>) : null}
                </>) : null}
              </a>
            </div>
          </>) : null}
        </div>
      </>
    )
  }

  const showPlaylists = () => {
    if(longData.items !== undefined){
      return(
        <>
          <div className="three-inline-buttons">
            <p>
              <a className="button" onClick={() => {makeShortPlaylist()}}>Curate Top 50 of the Month</a>
              <a className="button" onClick={() => {makeMediumPlaylist()}}>Curate Top 50 of 6 Months</a>
              <a className="button" onClick={() => {makeLongPlaylist()}}>Curate Top 50 of All-Time</a>
            </p>
          </div>
          
          <div className='Playlist'>
            {displayPlaylists('short')}
            {displayPlaylists('medium')}
            {displayPlaylists('long')}
          </div>
        </>
      )
    }
    return null;
  }

  
  return (
    <div className="App">
      <header className="App-header">
        <h1 style={{color: "rgb(30, 215, 96)"}}>Spotify Top Songs Playlist Curator</h1>
        {showPlaylists()}
        <p className='button' onClick={() => {handleLogin()}}>Login to Spotify</p>
      </header>
    </div>
  );
}

export default App;
