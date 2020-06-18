<template>
  <div class="preview">
    <video ref="video" autoplay></video>
  </div>
</template>
<style lang="less" scoped>
.preview {
  width: 100%;
  video {
    width: 100%;
    height: 243px;
  }
}
</style>
<script>
export default {
  name: "Preview",
  props: {
    stream: MediaStream
  },
  data() {
    return {
    };
  },
  watch: {
    stream() {
      if (this.stream) {
        this.preview();
      }
    }
  },
  methods: {
    preview() {
      this.$refs.video.srcObject = this.stream;
    },
    clear() {
      this.$refs.video.srcObject = null;
    }
  }
};
</script>