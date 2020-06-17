<template>
  <div id="app">
    <div class="control">
      <label>视频源:</label>
      <Select v-model="source" @on-change="sourceSelected" style="width:300px;">
        <Option v-for="item in inputSources" :value="item.id" :key="item.id">{{ item.name }}</Option>
      </Select>
      <recorder :stream="stream" @on-saved="mediaSaved" />
      <Button
        type="warning"
        shape="circle"
        icon="md-folder-open"
        @click="openDir"
        style="margin-left:5px;"
      ></Button>
    </div>
    <preview ref="preview" :stream="stream" />
  </div>
</template>

<script>
import { MediaService } from "./service/media.service";
import { merge } from 'rxjs';
import Recorder from './components/Recorder'
import Preview from './components/Preview'
const { shell } = window.require("electron");
export default {
  name: "App",
  components: {
    Recorder, Preview
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
    mediaSaved(filePath) {
      console.log('saved')
      this.savedFilePath = filePath
      this.reflashSource()
      this.stopTracks()
    },
    reflashSource() {
      this.inputSources = [];
      this.source = "";
      this.initSource()
      this.$refs.preview.clear();
    },
    stopTracks() {
      for (const t of this.stream.getTracks()) {
        t.stop();
      }
    },
    openDir() {
      if (this.savedFilePath) {
        shell.showItemInFolder(this.savedFilePath);
      }
    },
    initSource() {
      this.inputSources = []
      merge(
        this.mediaService.getCamaras(),
        this.mediaService.getWindows(),
      ).subscribe(sources => {
        this.inputSources = [...this.inputSources, ...sources];
      })
    },
    getSelectedSource() {
      return this.inputSources.find(
        item => item.id === this.source
      )
    },
    sourceSelected() {
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
    
  }
};
</script>

<style lang="less">
#app {
  padding: 10px;
}
.recordTime {
  margin: 0 5px;
}
.control {
  display: flex;
  align-items: center;
}
</style>