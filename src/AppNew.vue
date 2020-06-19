<template lang="pug">
  div#app
    div.success(v-show="isSaved")
      div.info 录像保存成功
      div.btn
        Button(size="small" @click="openFolder") 浏览录像
        Button(size="small" style="margin-left:5px" @click="hideSuccess") 继续录像
    preview.preview(:stream="stream" :mute="!volumeStatus" ref="preview" v-show="!isSaved")
    div.foot
      Select.source(v-model="source" placement="top" size="small" @on-change="sourceSelected")
        Option(v-for="item in inputSources" :value="item.id" :key="item.id") {{ item.name }}
      div.btn_icon
        Icon(
          :type="volumeStatus ? 'md-volume-up' : 'md-volume-off'" 
          size="20" 
          color="#2db7f5" 
          @click="volume"
        )
        Icon(
          :type="micStatus? 'md-mic' : 'md-mic-off'" 
          size="20" 
          color="#2db7f5" 
          @click="mic"
        )
      div.line
      recorder(:stream="stream" :mic="micStatus" @on-saved="mediaSaved" @on-screenshot="screenshot")
</template>
<style lang="less" scoped>
#app {
  position: relative;
  width: 100vw;
  height: 100vh;
  padding-bottom: 50px;
}
.success {
  width: 100%;
  height: 243px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
}
.preview {
  width: 100%;
  height: 243px;
}
.foot {
  position:absolute;
  width: 100%;
  height: 50px;
  background-color: #efefef;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 0 15px;
  .source {
    width: 150px;
  }
  .btn_icon {
    display: flex;
    justify-content: space-around;
    width: 60px;
    padding: 0 5px;
  }
  .line {
    height: 20px;
    border-left: 1px solid #ccc;
  }
}
</style>
<script>
import Preview from './components/Preview'
import Recorder from './components/Recorder'
import { MediaService } from "./service/media.service";
import { merge } from 'rxjs';
const { shell } = window.require("electron");
export default {
  name: "App",
  components: {
    Preview, Recorder
  },
  data() {
    return {
      mediaService: new MediaService(),
      inputSources: [],
      source: "",
      stream: null,
      savedFilePath: null,
      isSaved: false,
      volumeStatus: true,
      micStatus: true,
    };
  },
  mounted() {
    this.initSource();
  },
  methods: {
    initSource() {
      this.inputSources = []
      merge(
        this.mediaService.getWindows('screen'),
      ).subscribe(sources => {
        this.inputSources = [...this.inputSources, ...sources];
        for(const s of sources) {
          if(s.name.match(/screen/i)) {
            this.source = s.id
            this.sourceSelected()
            return
          }
        }
      })
    },
    mediaSaved(filePath) {
      this.savedFilePath = filePath
      this.isSaved = true
    },
    hideSuccess() {
      this.isSaved = false
    },
    volume() {
      this.volumeStatus = !this.volumeStatus
    },
    mic() {
      this.micStatus = !this.micStatus
      if(this.micStatus) {
        this.mediaService.mixAudio(this.stream).subscribe()
      } else {
        this.mediaService.removeAudio(this.stream)
      }
    },
    openFolder() {
      shell.showItemInFolder(this.savedFilePath);
    },
    sourceSelected() {
      const selectedSource = this.getSelectedSource()
      if (this.stream) {
        this.stopTracks();
      }
      if (selectedSource) {
        this.mediaService.getStream(selectedSource, this.micStatus).subscribe((stream) => {
          this.stream = stream;
        })
      }
    },
    getSelectedSource() {
      return this.inputSources.find(
        item => item.id === this.source
      )
    },
    stopTracks() {
      for (const t of this.stream.getTracks()) {
        t.stop();
      }
    },
    screenshot() {
      this.$refs.preview.screenshot()
    }
  }
}
</script>