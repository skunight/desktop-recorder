<template lang="pug">
  div
    label.recordTime {{m|number}}:{{s|number}}
    Button(
      type="info"
      icon="md-videocam"
      size="small"
      @click="startRecord"
      style="margin-left:5px;"
    ) 录制
    Button(
      type="success"
      icon="md-camera"
      size="small"
      @click="stopRecord"
      style="margin-left:5px;"
    ) 截图
</template>
<style lang="less" scoped>
.recordTime {
  margin: 0 5px;
}
</style>
<script>
import * as dayjs from "dayjs";
const { ipcRenderer } = window.require("electron");
const fs = window.require("fs");
const path = window.require("path");
export default {
  name: "Recorder",
  props: {
    stream: MediaStream
  },
  watch: {
    stream() {
      if (this.stream) {
        this.createRecorder();
      }
    }
  },
  data() {
    return {
      btnStartDisable: true,
      btnStopDisable: true,
      recorder: null,
      interval: null,
      fileReader: null,
      filename: null,
      m: 0,
      s: 0
    };
  },
  mounted() {
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
    initFileReader() {
      this.fileReader = new FileReader();
      this.fileReader.onload = () => {
        const buffer = new Buffer(this.fileReader.result);
        console.log("save media", buffer.length);
        fs.writeFileSync(this.filename, buffer, { flag: "a+" });
        if (!this.recorder || this.recorder.state === "inactive") {
          this.$emit("on-saved", this.filename);
        }
      };
      this.fileReader.onerror = err => console.error(err);
    },
    createRecorder() {
      this.recorder = new MediaRecorder(this.stream);
      this.recorder.ondataavailable = event => {
        console.log("ondataavailable");
        let blob = new Blob([event.data], {
          type: event.data.type
        });
        this.fileReader.readAsArrayBuffer(blob);
      };
      this.recorder.onerror = err => {
        console.error(err);
      };
      this.btnStartDisable = false;
    },
    initFile() {
      const userpath = ipcRenderer.sendSync("getPath");
      this.filename = path.join(
        userpath,
        `${dayjs().format("YYYYMMDDTHHmmss")}.mkv`
      );
      console.log("this.filename: ", this.filename);
    },
    startRecord() {
      if (this.recorder) {
        console.log("start record");
        this.initFile();
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
        this.recorder = null;
        // this.stopTracks();
        this.stopRecordTime();
      }
    },
    stopRecordTime() {
      clearInterval(this.interval);
      this.s = 0;
      this.m = 0;
    }
  }
};
</script>