Vue.config.ignoredElements = [];

const vm = new Vue({
  el: '#app',
  data() {
    return {
      saveFile: {},
      colors: [],
      users: [],
      customLevels: [],
      mapShown: false
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
    handleLevelImport(evt) {
      const file = evt.target.files[0];

      if (file) {
        const reader = new FileReader();

        reader.onload = evt => {
          const level = evt.target.result;
          const parts = level.split(';')
          const name = parts[1];
          const tagline = parts[2];
          const plays = parts[3];
          const minPlayers = parts[4];
          const maxPlayers = parts[5];
          const levelID = this.customLevels.length; // Make sure we don't clash
          const difficulty = parts[7];
          const includeInList = parts[8];
          const levelData = parts.slice(9);
          const toRaw = function() {
            const level = this;
            return ['70', level.name, level.tagline, level.plays, level.minPlayers, level.maxPlayers, level.levelID, level.difficulty, level.includeInList, ...level.levelData].join(';')
          }
          this.customLevels.push({ name, tagline, plays, minPlayers, maxPlayers, levelID, difficulty, includeInList, levelData, toRaw });
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
          const unknown = parts[1]
          const wins = parts[2];
          const losses = parts[3];
          const goals = parts[4];
          const oopsies = parts[5];
          const checks = parts[6];
          const deaths = parts[7];
          const holdTime = parts[8];
          const toRaw = function() {
            const user = this;
            return [user.name.toUpperCase(), user.unknown, user.wins, user.losses, user.goals, user.oopsies, user.checks, user.deaths, user.holdTime, ...user._raw.split(',').slice(9)].join(',');
          }
          return { name, unknown, wins, losses, goals, oopsies, checks, deaths, holdTime, toRaw, _raw: user };
        });

      // Custom Levels
      this.customLevels = this.saveFile.items
        .filter(obj => obj._key.indexOf('CustomLevel') === 0)
        .map(level => {
          const parts = level._value.split(';')
          const name = parts[1];
          const tagline = parts[2];
          const backgroundColour = parts[3];
          const minPlayers = parts[4];
          const maxPlayers = parts[5];
          const levelID = parts[6];
          const difficulty = parts[7];
          const includeInList = parts[8];
          const levelData = parts.slice(9);
          const toRaw = function() {
            const level = this;
            return ['70', level.name, level.tagline, level.backgroundColour, level.minPlayers, level.maxPlayers, level.levelID, level.difficulty, level.includeInList, ...level.levelData].join(';')
          }
          return { name, tagline, backgroundColour, minPlayers, maxPlayers, levelID, difficulty, includeInList, levelData, toRaw };
        })
    },
    holdTime(time) {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time - minutes * 60);
      return `${minutes}min ${seconds}sec`;
    },
    download() {
      this.colors.forEach(color => {
        this.saveFile.items.find(obj => obj._key === color._raw._key)._value = color.unlocked ? '1' : '0';
      });

      this.saveFile.items.find(obj => obj._key === "UserAccounts")._value = this.users.map(user => user.toRaw()).join(';')

      this.customLevels.forEach(level => {
        this.saveFile.items.find(obj => obj._key === 'CustomLevel' + level.levelID)._value = level.toRaw();
      });

      downloadFile('Clusterpuck99Save', JSON.stringify(this.saveFile));
    },
    exportLevel(levelID) {
      const level = this.customLevels.find(level => level.levelID === levelID);
      if (level) {
        downloadFile(level.name, level.toRaw());
      }
    },
    hideMap() {
      this.mapShown = false;
      const mapModal = document.querySelector('#mapModal');
      mapModal.innerHTML = "";
      const cell = document.createElement('div');
      cell.classList.add('cell');
      for (let i=0; i < (61 * 61); i++) {
        mapModal.appendChild(cell.cloneNode(false));
      }
    },
    showMap(parts, backgroundColour) {
      let layout = parts[0].substring(355).split('');
      let colours = parts[1].substring(346).split('');
      let rotations = parts[2].substring(346).split('')

      const MAP_WIDTH = 61;
      const MAP_HEIGHT = 61;
      const ROW_BUFFER = 9;
      const ROW_TOTAL=MAP_WIDTH + ROW_BUFFER;
      const MAP_CONTAINER='#mapModal';

      document.querySelector(MAP_CONTAINER).style.backgroundColor = toBackgroundColour(backgroundColour);

      for (let rowIndex = 0; rowIndex < MAP_HEIGHT; rowIndex++) {
        let row = layout.splice(0, ROW_TOTAL)
        row.forEach((cell, columnIndex) => {
          let position = (rowIndex * MAP_WIDTH) + columnIndex + 1; // +1 because CSS starts arrays at 1
          const colour = colours[(ROW_TOTAL * rowIndex) + ROW_TOTAL - 1 - columnIndex];
          const rotation = rotations[(ROW_TOTAL * rowIndex) + ROW_TOTAL - 1 - columnIndex];
          const cellElement = document.querySelector(MAP_CONTAINER + ' .cell:nth-of-type(' + position + ')');
          if (cellElement) {
            cellElement.dataset.row = rowIndex;
            cellElement.dataset.columns = columnIndex;
            cellElement.dataset.colourSymbol = colour;
            cellElement.dataset.colour = toColour(colour);

            cellElement.style.transform = "rotate(" + toDegs(rotation) + ")"

            switch (cell) {
              case '"':
                cellElement.style.background = toColour(colour);
                cellElement.style.border = "1px solid black";
                break;
              case "#":
                cellElement.style.background = "repeating-linear-gradient(45deg, brown, brown 1px, grey 1px, grey 2px)";
                break;
              case "*":
                cellElement.style.background = "red";
                cellElement.style.borderRadius = "100%";
                cellElement.innerText = "g"
                break;
              case "+":
                cellElement.style.background = "blue";
                cellElement.style.borderRadius = "100%";
                cellElement.innerText = "g"
                break;
              case ",":
                cellElement.style.background = "red";
                cellElement.style.borderRadius = "100%";
                cellElement.innerText = "s"
                break;
              case "-":
                cellElement.style.background = "blue";
                cellElement.style.borderRadius = "100%";
                cellElement.innerText = "s"
                break;
              case "$":
                cellElement.style.background = toColour(colour);
                cellElement.style.border = "1px solid black";
                cellElement.style.clipPath = "polygon(0% 0%, 100% 0%, 100% 100%)";
                break;
              case ")":
                cellElement.style.background = "limegreen";
                cellElement.style.borderRadius = "100%";
                cellElement.innerText = "b"
                break;
              case "(":
                cellElement.style.background = "orange";
                cellElement.style.borderRadius = "100%";
                cellElement.style.borderColor = "yello";
                cellElement.innerText = "s"
                break;
              case "'":
                cellElement.style.background = toColour(colour);
                cellElement.style.border = "1px solid black";
                cellElement.innerText = "*"
                cellElement.style.fontSize = "25px";
                cellElement.style.lineHeight = "22px";
                break;
            }
          }
        })
      }

      function toColour(colour) {
        switch (colour) {
          case '!': return "white"
          case '"': return "gray"
          case '#': return "darkgrey"
          case '$': return "black"
          case '%': return "red"
          case '&': return "orange"
          case "'": return "yellow"
          case '(': return "green"
          case ')': return "teal"
          case '*': return "blue"
          case '+': return "purple"
          case ',': return "brown"
          default: return "white"
        }
      }

      function toBackgroundColour(colour) {
        switch (colour) {
          case '0': return "grey"
          case '1': return "skyblue"
          case '2': return "orange"
          case '3': return "purple"
          case '4': return "blue"
          case '5': return "black"
          case "6": return "green"
          case '7': return "hotpink"
          case '8': return "darkgreen"
          case '9': return "beige"
          case '10': return "red"
          default: return "#424040"
        }
      }

      function toDegs(rotation) {
        switch (rotation) {
          case '#': return "180deg";
          case '"': return "90deg";
          case '$': return "-90deg";
          default: return "0deg";
        }
      }

      this.mapShown = true;

    }
  },
  created() {
    this.hideMap();
  }
});

function downloadFile(filename, contents) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(contents));
  element.setAttribute('download', filename);
  const e = document.createEvent('MouseEvents');
  e.initEvent('click', true, true);
  element.dispatchEvent(e);
}
