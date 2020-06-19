<template lang="pug">
  div.content
    label.recordTime {{m|number}}:{{s|number}}
    Button(
      :type="recording ? 'error': 'info'"
      :icon="recording ? 'md-square': 'md-videocam'"
      size="small"
      @click="record"
      style="margin-left:5px;"
    ) {{ recording ? '停止' : '录制' }}
    Button(
      type="success"
      icon="md-camera"
      size="small"
      @click="screenshot"
      style="margin-left:5px;"
    ) 截图
</template>
<style lang="less" scoped>
.content {
  display: flex;
  align-items: center;
}
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
      recording: false,
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
    screenshot() {
      this.$emit("on-screenshot");
    },
    initFile() {
      const userpath = ipcRenderer.sendSync("getPath");
      this.filename = path.join(
        userpath,
        `${dayjs().format("YYYYMMDDTHHmmss")}.mkv`
      );
      console.log("this.filename: ", this.filename);
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
    stopRecordTime() {
      clearInterval(this.interval);
      this.s = 0;
      this.m = 0;
    },
    record() {
      if (this.recorder) {
        if(this.recording) {
          console.log("stop record");
          this.recording = false
          this.recorder.stop();
          this.recorder = null;
          this.stopRecordTime();
        } else {
          console.log("start record");
          this.recording = true
          this.initFile();
          this.startRecordTime();
          this.recorder.start(5000);
        }
      }
    }
  }
};
</script>