<template>
  <div id="app">
    <div class="main">
      <label>视频源:</label>
      <Select v-model="source" @on-change="sourceSelected" style="width:300px;">
        <Option v-for="item in inputSources" :value="item.id" :key="item.id">{{ item.name }}</Option>
      </Select>
      <label class="recordTime">{{m|number}}:{{s|number}}</label>
      <Button
        type="success"
        shape="circle"
        icon="ios-play"
        @click="startRecord"
        style="margin-left:5px;"
        :disabled="btnStartDisable"
      ></Button>
      <Button
        type="error"
        shape="circle"
        icon="ios-square"
        @click="stopRecord"
        style="margin-left:5px;"
        :disabled="btnStopDisable"
      ></Button>
      <Button
        type="warning"
        shape="circle"
        icon="md-folder-open"
        @click="openDir"
        style="margin-left:5px;"
      ></Button>
      <div class="preview">
        <div>
          <Checkbox v-model="showPreview" @on-change="showPreviewChange">显示预览</Checkbox>
        </div>
        <video ref="video" autoplay style="max-width:400px;" v-if="showPreview"></video>
      </div>
    </div>
  </div>
</template>

<script>
import { SourceType } from "./app.constants";
import * as dayjs from "dayjs";
const { desktopCapturer, ipcRenderer, shell } = window.require("electron");
const fs = window.require("fs");
const path = window.require("path");
export default {
  name: "App",
  components: {},
  data() {
    return {
      inputSources: [],
      source: "",
      recorder: null,
      filename: null,
      fileReader: null,
      stream: null,
      btnStartDisable: true,
      btnStopDisable: true,
      showPreview: true,
      m: 0,
      s: 0,
      interval: null
    };
  },
  mounted() {
    this.getSources();
    this.getCamaras();
    this.initFileReader();
  },
  filters: {
    number: function(val) {
      if (!val) return "00";
      if (parseInt(val, 0) < 10) {
        return `0${val}`;
      } else {
        return +val;
      }
    }
  },
  methods: {
    showPreviewChange() {
      if(this.showPreview) {
        this.preview()
      } 
    },
    initFileReader() {
      this.fileReader = new FileReader();
      this.fileReader.onload = () => {
        const buffer = new Buffer(this.fileReader.result);
        console.log("save media", buffer.length);
        fs.writeFileSync(this.filename, buffer, { flag: "a+" });
      };
      this.fileReader.onerror = err => console.error(err);
    },
    reflashSource() {
      this.inputSources = [];
      this.source = "";
      this.recorder = null;
      this.getSources();
      this.getCamaras();
      this.$refs.video.srcObject = null;
    },
    startRecord() {
      if (this.recorder) {
        console.log("start record");
        this.startRecordTime();
        this.recorder.start(5000);
        this.btnStartDisable = true;
        this.btnStopDisable = false;
      }
    },
    startRecordTime() {
      this.interval = setInterval(() => {
        this.s++;
        if (this.s > 59) {
          this.s = 0;
          this.m++;
        }
      }, 1000);
    },
    stopRecord() {
      if (this.recorder && this.recorder.state !== "inactive") {
        console.log("stop record");
        this.recorder.stop();
        this.btnStopDisable = true;
        this.btnStartDisable = true;
        this.reflashSource();
        this.stopTracks();
        this.stopRecordTime()
      }
    },
    stopRecordTime() {
      clearInterval(this.interval)
      this.s = 0
      this.m = 0
    },
    stopTracks() {
      for (const t of this.stream.getTracks()) {
        t.stop();
      }
    },
    openDir() {
      if (this.filename) {
        shell.showItemInFolder(this.filename);
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
      if (this.stream) {
        this.stopTracks();
      }
      if (selectedSource) {
        this.stream = await this.getStream(selectedSource);
        this.preview();
        this.btnStartDisable = false;
        this.createRecorder(this.stream);
      }
    },
    preview() {
      if(this.showPreview) {
        this.$nextTick(() => {
          this.$refs.video.srcObject = this.stream
        })
      }
    },
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
        console.log("ondataavailable");
        let blob = new Blob([event.data], {
          type: event.data.type
        });
        this.fileReader.readAsArrayBuffer(blob);
        // this.saveMedia(blob);
      };
      this.recorder.onerror = err => {
        console.error(err);
      };
      this.recorder.onstart = () => {
        const userpath = ipcRenderer.sendSync("getPath");
        this.filename = path.join(
          userpath,
          `${dayjs().format("YYYYMMDDTHHmmss")}.mkv`
        );
        console.log("this.filename: ", this.filename);
      };
    }
  }
};
</script>

<style lang="less">
#app {
  padding: 10px;
}
.preview {
  margin-top: 10px;
}
.recordTime {
  margin: 0 5px;
}
</style>