<template lang="pug">
  div#app
    preview(:stream="stream")
    div.foot
      Select.source(v-model="source" placement="top" size="small" @on-change="sourceSelected")
        Option(v-for="item in inputSources" :value="item.id" :key="item.id") {{ item.name }}
      div.btn_icon
        Icon(type="md-volume-up" size="20" color="#2db7f5")
        Icon(type="ios-mic" size="20" color="#2db7f5")
      div.line
      recorder(:stream="stream" @on-saved="mediaSaved")
</template>
<style lang="less" scoped>
#app {
  position: relative;
  width: 100vw;
  height: 100vh;
  padding-bottom: 50px;
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
    };
  },
  mounted() {
    this.initSource();
  },
  methods: {
    initSource() {
      this.inputSources = []
      merge(
        this.mediaService.getCamaras(),
        this.mediaService.getWindows(),
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
      // this.reflashSource()
      this.stopTracks()
    },
    sourceSelected() {
      console.log('111')
      const selectedSource = this.getSelectedSource()
      if (this.stream) {
        this.stopTracks();
      }
      if (selectedSource) {
        this.mediaService.getStream(selectedSource).subscribe((stream) => {
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
  }
}
</script>