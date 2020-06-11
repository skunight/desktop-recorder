<template>
  <div id="app">
    <div class="main">
      <label>视频源:</label>
      <Select v-model="source" @on-change="sourceSelected" style="width:200px;">
        <Option v-for="item in inputSources" :value="item.id" :key="item.id">{{ item.name }}</Option>
      </Select>
      <Button
        type="success"
        shape="circle"
        icon="ios-play"
        @click="startRecord"
        style="margin-left:5px;"
        :disabled="disabled"
      ></Button>
      <Button
        type="error"
        shape="circle"
        icon="ios-square"
        @click="stopRecord"
        style="margin-left:5px;"
      ></Button>
      <Button
        type="warning"
        shape="circle"
        icon="md-folder-open"
        @click="openDir"
        style="margin-left:5px;"
        :disabled="disabled"
      ></Button>
      <!-- <div class="preview">
        <video ref="video" @loadedmetadata="mediaLoaded" style="width:640px;height:480px;"></video>
      </div> -->
    </div>
  </div>
</template>

<script>
import { SourceType } from "./app.constants";
import * as dayjs from "dayjs";
const { desktopCapturer, ipcRenderer, shell } = window.import("electron");
const fs = window.import("fs");
const path = window.import("path");
export default {
  name: "App",
  components: {},
  data() {
    return {
      inputSources: [],
      source: "",
      recorder: null,
      disabled: true,
      filename: null
    };
  },
  mounted() {
    this.getSources();
    this.getCamaras();
  },
  methods: {
    reflashSource() {
      this.inputSources = []
      this.source = ""
      this.recorder = null
      this.getSources();
      this.getCamaras();
    },
    mediaLoaded() {
      this.$refs.video.play();
    },
    startRecord() {
      if (this.recorder) {
        console.log("start record")
        this.recorder.start(5000)
        this.disabled = true;
      }
    },
    
    stopRecord() {
      if (this.recorder && this.recorder.state !== 'inactive') {
        console.log("stop record");
        this.recorder.stop()
        this.disabled = false
        this.reflashSource()
      }
    },
    stopTracks(stream) {
      for (const t of stream.getTracks()) {
        t.stop();
      }
    },
    openDir() {
      if(this.filename) {
        const {dir} = path.parse(this.filename)
        shell.openExternal(dir)
      }
    },
    async getCamaras() {
      const camaras = await navigator.mediaDevices
        .enumerateDevices()
        .then(devices => devices.filter(d => d.kind === "videoinput"));
      for (const c of camaras) {
        this.inputSources.push({
          type: 1,
          id: c.deviceId,
          name: c.label
        });
      }
    },
    async getSources() {
      const sources = await desktopCapturer.getSources({
        types: ["window", "screen"]
      });
      for (const s of sources) {
        this.inputSources.push({
          type: 0,
          id: s.id,
          name: s.name
        });
      }
    },
    async sourceSelected() {
      const selectedSource = this.inputSources.find(
        item => item.id === this.source
      );
      if (selectedSource) {
        const stream = await this.getStream(selectedSource);
        // this.preview(stream)
        this.disabled = false;
        this.createRecorder(stream);
      }
    },
    // preview(stream) {
    //   this.$refs.video.srcObject = stream;
    // },
    async getStream(source) {
      let opt;
      if (source.type === SourceType.SCREEN) {
        opt = {
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: source.id,
              maxWidth: window.screen.width,
              maxHeight: window.screen.height
            }
          }
        };
      } else {
        const video = await navigator.mediaDevices
          .enumerateDevices()
          .then(device =>
            device.find(
              d => d.kind === "videoinput" && d.deviceId === source.id
            )
          );
        opt = { video };
      }
      const stream = await navigator.mediaDevices.getUserMedia(opt);
      if (stream) {
        await this.mixAudio(stream);
      }
      return stream;
    },
    async mixAudio(stream) {
      let [audioTrack] = await navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then(mediaStream => mediaStream.getAudioTracks());
      stream.addTrack(audioTrack);
    },
    createRecorder(stream) {
      this.recorder = new MediaRecorder(stream);
      this.recorder.ondataavailable = event => {
        console.log('ondataavailable')
        let blob = new Blob([event.data], {
          type: event.data.type
        });
        this.saveMedia(blob);
      };
      this.recorder.onerror = err => {
        console.error(err);
      };
      this.recorder.onstart = () => {
        const userpath = ipcRenderer.sendSync('getPath')
        this.filename = `${userpath}${dayjs().format("YYYYMMDDTHHmmss")}.mkv`;
        console.log('this.filename: ', this.filename)
      }
    },
    saveMedia(blob) {
      let reader = new FileReader();
      reader.onload = () => {
        let buffer = new Buffer(reader.result);
        console.log('save media', buffer.length)
        fs.writeFile(this.filename, buffer, { flag: "a+" }, (err, res) => {
          if (err) {
            return console.log(err);
          }
          console.log("res: ", res);
        });
      };
      // this.$Modal.success({content: `文件${this.filename}保存成功`})
      reader.onerror = err => console.error(err);
      reader.readAsArrayBuffer(blob);
    }
  }
};
</script>

<style lang="less">
#app {
  padding: 10px;
}
// .preview {
//   margin-top: 10px;
// }
</style>