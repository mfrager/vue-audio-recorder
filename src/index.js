import AudioRecorder from '@/components/recorder.vue'

const components = {
  AudioRecorder,

  install (Vue) {
    if (this.installed) {
      return
    }

    this.installed = true

    Vue.prototype.$eventBus = Vue.prototype.$eventBus || new Vue

    Vue.component('audio-recorder', AudioRecorder)
  }
}

export default components

export { AudioRecorder }
