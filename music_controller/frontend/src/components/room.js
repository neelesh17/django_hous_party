import React, { Component } from "react";
import { Grid, Button, Typography } from "@material-ui/core";
import CreateRoomPage from './createRoomPage';
import MusicPlayer from "./musicPlayer";

export default class Room extends Component {
  constructor(props) {
    super(props);
    this.state = {
      votesToSkip: 2,
      guestCanPause: false,
      isHost: false,
      showSetting:false,
      spotifyAuthenticated: false,
      song: {}
    };
    this.roomCode = this.props.match.params.roomCode;
    this.getRoomDetails = this.getRoomDetails.bind(this);
    this.leaveButtonPressed = this.leaveButtonPressed.bind(this);
    this.updateShowSetting = this.updateShowSetting.bind(this);
    this.renderSettingButton = this.renderSettingButton.bind(this);
    this.renderSettings = this.renderSettings.bind(this);
    this.authenticateSpotify = this.authenticateSpotify.bind(this);
    this.getCurrentSong = this.getCurrentSong.bind(this);
    this.getRoomDetails();
  }
  componentDidMount(){
    this.interval = setInterval(this.getCurrentSong, 1000);
  }
  componentWillUnmount(){
    clearInterval(this.interval);
  }

  getRoomDetails() {
    return fetch("/api/get-room" + "?code=" + this.roomCode)
      .then((response) => {
        if (!response.ok) {
          this.props.leaveRoomCallback();
          this.props.history.push("/");
        }
        return response.json();
      })
      .then((data) => {
        this.setState({
          votesToSkip: data.votes_to_skip,
          guestCanPause: data.guest_can_pause,
          isHost: data.is_host,
        });
        this.state.isHost ? this.authenticateSpotify(): null;
      });
  }

  authenticateSpotify(){
    fetch('/spotify/is-authenticated').then(res =>  res.json()).then(data => {
      this.setState({spotifyAuthenticated: data.status});
      if(!data.status){
        fetch('/spotify/get-auth-url').then(res => res.json()).then(data => {
          window.location.replace(data.url)
        })
      }
    })
  }

  getCurrentSong() {
    fetch('/spotify/current-song').then(res => {
      if(!res.ok) return {}
      else return res.json();
    }).then((data) => {
      this.setState({ song: data });
    });
  }

  leaveButtonPressed() {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/api/leave-room", requestOptions).then((_response) => {
      this.props.leaveRoomCallback();
      this.props.history.push("/");
    });
  }

  updateShowSetting(v){
    this.setState({
      showSetting:v,
    });
  }

  renderSettings() {
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <CreateRoomPage
            update={true}
            votesToSkip={this.state.votesToSkip}
            guestCanPause={this.state.guestCanPause}
            roomCode={this.roomCode}
            updateCallback={this.getRoomDetails}
          />
        </Grid>
        <Grid item xs={12} align="center">
          <Button
            variant="contained"
            color="secondary"
            onClick={() => this.updateShowSetting(false)}
          >
            Close
          </Button>
        </Grid>
      </Grid>
    );
  }

  renderSettingButton(){
    return (
      <Grid item xs={12} align="center">
        <Button variant="contained" color="primary" onClick={() => this.updateShowSetting(true)}>Settings</Button>
      </Grid>
    );
  }

  render() {
    if (this.state.showSetting) {
      return this.renderSettings();
    }
    return (
      
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography variant="h4" component="h4">
            Code: {this.roomCode}
          </Typography>
        </Grid>
        <MusicPlayer {...this.state.song}/>
        
        {
          this.state.isHost  ? this.renderSettingButton() : null
        }
        <Grid item xs={12} align="center">
          <Button
            variant="contained"
            color="secondary"
            onClick={this.leaveButtonPressed}
          >
            Leave Room
          </Button>
        </Grid>
      </Grid>
    );
  }
}