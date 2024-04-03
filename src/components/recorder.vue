<style lang="scss">
  @import '../scss/icons';
</style>

<template>
  <icon-button
    class="ar-icon ar-icon__lg"
    :name="iconButtonType"
    :class="{
      'ar-icon--rec': isRecording,
      'ar-icon--pulse': isRecording && volume > 0.02
    }"
    @click.native="toggleRecorder"/>
</template>

<script>
  import IconButton  from './icon-button'
  import Recorder    from '@/lib/recorder'
  import { convertTimeMMSS }  from '@/lib/utils'

  export default {
    props: {
      attempts : { type: Number },
      time     : { type: Number },

      bitRate    : { type: Number, default: 128   },
      sampleRate : { type: Number, default: 44100 },

      micFailed        : { type: Function },
      beforeRecording  : { type: Function },
      pauseRecording   : { type: Function },
      afterRecording   : { type: Function },
      failedUpload     : { type: Function },
      beforeUpload     : { type: Function },
      successfulUpload : { type: Function },
      selectRecord     : { type: Function },
      filename         : { type: String, default: 'record'   },
      format           : { type: String, default: 'mp3'      },
      headers          : { type: Object, default: () => ({}) },
      uploadUrl        : { type: String                      }
    },
    data () {
      return {
        isUploading   : false,
        recorder      : this._initRecorder(),
        uploadStatus  : null,
      }
    },
    components: {
      IconButton
    },
    mounted () {
      this.$eventBus.$on('start-upload', () => {
        this.isUploading = true
        this.beforeUpload && this.beforeUpload('before upload')
      })

      this.$eventBus.$on('end-upload', (msg) => {
        this.isUploading = false

        if (msg.status === 'success') {
          this.successfulUpload && this.successfulUpload(msg.response)
        } else {
          this.failedUpload && this.failedUpload(msg.response)
        }
      })
    },
    beforeDestroy () {
      this.stopRecorder()
    },
    methods: {
      toggleRecorder () {
        if (!this.isRecording) {
          this.recorder.records = []
          this.recorder.start()
        } else {
          this.recorder.stop()
          this.upload()
        }
      },
      stopRecorder () {
        if (!this.isRecording) {
          return
        }
        this.recorder.stop()
      },
      upload () {
        console.log('Upload URL: ' + this.uploadUrl)
        if (!this.uploadUrl) {
          return
        }

        this.$eventBus.$emit('start-upload')

        const record = this.recorder.records[0]
        const data = new FormData()
        data.append('audio', record.blob, `${this.filename}.mp3`)

        const headers = Object.assign(this.headers, {})
        headers['Content-Type'] = `multipart/form-data; boundary=${data._boundary}`

        this.$http.post(this.uploadUrl, data, { headers: headers }).then(resp => {
          this.$eventBus.$emit('end-upload', { status: 'success', response: resp })
        }).catch(error => {
          this.$eventBus.$emit('end-upload', { status: 'fail', response: error })
        })
      },
      _initRecorder () {
        return new Recorder({
          beforeRecording : this.beforeRecording,
          afterRecording  : this.afterRecording,
          pauseRecording  : this.pauseRecording,
          micFailed       : this.micFailed,
          bitRate         : this.bitRate,
          sampleRate      : this.sampleRate,
          format          : this.format
        })
      }
    },
    computed: {
      iconButtonType () {
        return this.isRecording && this.isPause ? 'mic' : this.isRecording ? 'stop' : 'mic'
      },
      isPause () {
        return this.recorder.isPause
      },
      isRecording () {
        return this.recorder.isRecording
      },
      recordedTime () {
        if (this.time && this.recorder.duration >= this.time * 60) {
          this.stopRecorder()
        }
        return convertTimeMMSS(this.recorder.duration)
      },
      volume () {
        return parseFloat(this.recorder.volume)
      }
    }
  }
</script>

