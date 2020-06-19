<template lang="pug">
  div.content
    video(ref="video" :muted="mute" autoplay)
    canvas(ref="canvas" style="display:none;")
</template>
<style lang="less" scoped>
.content {
  width: 100%;
  height: 100%;
  video {
    width: 100%;
    height: 100%;
  }
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
    stream: MediaStream,
    mute: Boolean,
  },
  data() {
    return {
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
        const noticeName = 'screenshotNotice'
        this.$Notice.success({
            title: '保存成功',
            duration: 0,
            name: noticeName,
            render: h => {
                return h('span', [
                    '截屏保存成功',
                    h('a', {
                      on: {
                        click: () => {
                          this.openFolder(filename)
                          this.$Notice.close(noticeName)
                        }
                      },
                    },'打开位置'),
                ])
            }
        });
      };
      this.fileReader.onerror = err => console.error(err);
    },
    openFolder(filename) {
      shell.showItemInFolder(filename);
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
    preview() {
      this.$refs.video.srcObject = this.stream;
    },
    clear() {
      this.$refs.video.srcObject = null;
    }
  }
};
</script>