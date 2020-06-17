<template>
  <div class="preview">
    <div>
      <Checkbox v-model="showPreview" @on-change="showPreviewChange">显示预览</Checkbox>
    </div>
    <video ref="video" muted autoplay style="max-width:400px;" v-if="showPreview"></video>
  </div>
</template>
<style lang="less" scoped>
.preview {
  padding: 10px;
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
      showPreview: true
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