import { useEffect } from "react";
import './App.css';
import axios from 'axios';

const SpotifyMakePlaylists = () => {
    const [token, setToken] = useState('');
    const [data, setData] = usState({});

    useEffect(() => {
        if(localStorage.getItem("accessToken")) {
            setToken(localStorage.getItem("accessToken"));
        }
    }, []);

    const handleGetSongs = () => {
        axios.get("https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50", {
            headers: {
                Authorization: "Bearer " + token,
            },
        })
        .then((response) => {
            setData(response.data);
        })
        .catch((err) => {
            console.log(err);
        });
    };

    return <button onClick={handleGetSongs}>Get Songs</button>
};

export default SpotifyMakePlaylists;