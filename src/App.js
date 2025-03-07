import { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';
import qs from 'qs';
import logo from './asset/pagelogo.png';

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

const makePlaylist = (type) => {
  let playlistType, playlistName, playlistDescription;
  switch(type){
    case "short":
        playlistType = shortData;
        playlistName = "Top 50 of the Month";
        playlistDescription = "Your Top 50 of the Month !";
        break;
      case "medium":
        playlistType = mediumData;
        playlistName = "Top 50 of 6 Months";
        playlistDescription = "Your Top 50 of 6 Months !";
        break;
      case "long":
        playlistType = longData;
        playlistName =  "Top 50 of All-time";
        playlistDescription = "Your Top 50 of All-time !";
        break;
      default:
        return null;
    }
    
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
        if(response.data.items[i].name === playlistName){ // checks if playlist already exists, if it does, delete tracks in playlist and add new tracks
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
                  url: `https://api.spotify.com/v1/playlists/${playlistID}/tracks?uris=${playlistType?.items ? playlistType.items.map((item) => (`${item.uri}`)) : null}`, 
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
              name: playlistName, 
              description: playlistDescription, 
              public: false}, 
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`},
            }).then(response => {
              axios({
                method: "post", 
                url: `https://api.spotify.com/v1/playlists/${response.data.id}/tracks?uris=${playlistType?.items ? playlistType.items.map((item) => (`${item.uri}`)) : null}`, 
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
 
}

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
            <div className="track" key={i} onClick={() => {window.open(item.uri,"_self")}}>
              <a style={{fontSize: '22px', fontWeight: 'lighter', position: 'relative', top: '32%', paddingRight: '30px'}}>{i+1}</a>
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
        <header>
          <img src={logo} alt='Spotify' width={500} style={{paddingTop: '20px', paddingBottom: '3px'}}/>
        </header>
        <body>
          
          
          <div className='Playlist'>
            {displayPlaylists('short')}
            {displayPlaylists('medium')}
            {displayPlaylists('long')}
          </div>

          <div className="three-inline-buttons">
            <p>
              <a className="button" onClick={() => {makePlaylist("short")}}>Curate Top 50 of the Month</a>
              <a className="button" onClick={() => {makePlaylist("medium")}}>Curate Top 50 of 6 Months</a>
              <a className="button" onClick={() => {makePlaylist("long")}}>Curate Top 50 of All-Time</a>
            </p>
          </div>
        </body> 
        </>
      )
    }
    return (
    
      <>
        <div className='App-header'>
          <img src={logo} alt='Spotify' width={1000} />
          <p className='button' onClick={() => {handleLogin()}}>Login to Spotify</p>
        </div>
      </>
    
    );
  }

  
  return showPlaylists();
}

export default App;
