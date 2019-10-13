Vue.config.ignoredElements = [];

const vm = new Vue({
  el: '#app',
  data() {
    return {
      saveFile: {},
      colors: [],
      users: [],
      customLevels: []
    }
  },
  methods: {
    handleFileChange(evt) {
      const file = evt.target.files[0];

      if (file) {
        const reader = new FileReader();

        reader.onload = evt => {
          this.saveFile = JSON.parse(evt.target.result);
          this.parseSaveFile();
        };

        reader.readAsText(file, 'UTF-8');
      }
    },
    parseSaveFile() {
      // Colors
      this.colors = this.saveFile.items
        .filter(obj => obj._key.indexOf('color_') == 0)
        .map(obj => {
          const name = obj._key.replace('color_', '')[0].toUpperCase() + obj._key.replace('color_', '').substring(1);
          const unlocked = obj._value == "1";
          return { name, unlocked, _raw: obj };
        });

      // Users
      this.users = this.saveFile.items
        .find(obj => obj._key === 'UserAccounts')
        ._value.split(';')
        .map(user => {
          const parts = user.split(',');
          const name = parts[0];
          const wins = parts[2];
          const losses = parts[3];
          const goals = parts[4];
          const oopsies = parts[5];
          const checks = parts[6];
          const deaths = parts[7];
          const holdTime = parts[8];
          return { name, wins, losses, goals, oopsies, checks, deaths, holdTime, _raw: user };
        });

      // Custom Levels
      this.customLevels = this.saveFile.items
        .filter(obj => obj._key.indexOf('CustomLevel') === 0)
        .map(level => {
          const parts = level._value.split(';')
          const name = parts[1];
          const tagline = parts[2];
          const plays = parts[3];
          const minPlayers = parts[4];
          const maxPlayers = parts[5];
          const difficulty = parts[7];
          return { name, tagline, plays, minPlayers, maxPlayers, difficulty, _raw: level };
        })
    },
    holdTime(time) {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time - minutes * 60);
      return `${minutes}min ${seconds}sec`;
    }
  }
});
