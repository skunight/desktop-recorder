<template>
  <div class="preview">
    <div>
      <Checkbox v-model="showPreview" @on-change="showPreviewChange">显示预览</Checkbox>
      <Button type="primary" size="small" @click="screenshot" v-if="showPreview">截图</Button>
    </div>
    <div>
      <video ref="video" muted autoplay width="400" v-if="showPreview"></video>
      <canvas ref="canvas" style="display:none;" />
    </div>
  </div>
</template>
<style lang="less" scoped>
.preview {
  padding: 10px;
}
</style>
<script>
import * as dayjs from "dayjs";
const fs = window.require("fs");
const { ipcRenderer, shell } = window.require("electron");
const path = window.require("path");
export default {
  name: "Preview",
  props: {
    stream: MediaStream
  },
  data() {
    return {
      showPreview: true,
      fileReader: null
    };
  },
  watch: {
    stream() {
      if (this.stream) {
        this.preview();
      }
    }
  },
  mounted() {
    this.initFileReader();
  },
  methods: {
    initFileReader() {
      this.fileReader = new FileReader();
      this.fileReader.onload = () => {
        const buffer = new Buffer(this.fileReader.result);
        const userpath = ipcRenderer.sendSync("getPath");
        const filename = path.join(
          userpath,
          `${dayjs().format("YYYYMMDDTHHmmss")}.png`
        );
        fs.writeFileSync(filename, buffer);
        shell.showItemInFolder(filename);
      };
      this.fileReader.onerror = err => console.error(err);
    },
    screenshot() {
      const { videoWidth, videoHeight } = this.$refs.video;
      this.$refs.canvas.width = videoWidth;
      this.$refs.canvas.height = videoHeight;
      const ctx = this.$refs.canvas.getContext("2d");
      ctx.drawImage(this.$refs.video, 0, 0, videoWidth, videoHeight);
      this.$refs.canvas.toBlob(blob => {
        this.fileReader.readAsArrayBuffer(blob);
      }, "image/png");
    },
    showPreviewChange() {
      if (this.showPreview) {
        this.preview();
      }
    },
    preview() {
      if (this.showPreview) {
        this.$nextTick(() => {
          this.$refs.video.srcObject = this.stream;
        });
      }
    },
    clear() {
      this.$refs.video.srcObject = null;
    }
  }
};
</script>