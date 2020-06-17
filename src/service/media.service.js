const { desktopCapturer } = window.require("electron");
import { from } from "rxjs";
import { SourceType } from "./../app.constants";

import { map, switchMap } from 'rxjs/operators'
export class MediaService {
  getWindows(...types) {
    if (types.length === 0) {
      types = ["window", "screen"]
    }
    return from(desktopCapturer.getSources({ types })).pipe(
      map((sources) => {
        const result = []
        sources.map((s) => {
          result.push({
            type: 0,
            id: s.id,
            name: s.name,
          })
        })
        return result
      })
    )
  }

  getCamaras() {
    return from(navigator.mediaDevices.enumerateDevices()).pipe(
      map(devices => devices.filter(d => d.kind === "videoinput")),
      map((camaras) => {
        const result = []
        camaras.map((c) => {
          result.push({
            type: 1,
            id: c.deviceId,
            name: c.label
          })
        })
        return result
      })
    )
  }

  getStream({ type, id }, withAudio = true) {
    const stream$ = type === SourceType.SCREEN ? this._getScreenStream(id) : this._getCamaraStream(id)
    if (withAudio) {
      return stream$.pipe(
        switchMap(stream => {
          return this.mixAudio(stream)
        })
      )
    } else {
      return stream$
    }
  }

  mixAudio(stream) {
    return from(navigator.mediaDevices.getUserMedia({ audio: true, video: false })).pipe(
      map(mediaStream => {
        const [audioTrack] = mediaStream.getAudioTracks()
        stream.addTrack(audioTrack)
        return stream
      })
    )
  }

  _getScreenStream(id) {
    const opt = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: id,
          maxWidth: window.screen.width,
          maxHeight: window.screen.height
        }
      }
    }
    return from(navigator.mediaDevices.getUserMedia(opt))
  }

  _getCamaraStream(id) {
    return from(navigator.mediaDevices.enumerateDevices()).pipe(
      map(devices => devices.find(d => d.kind === "videoinput" && d.deviceId === id)),
      switchMap((video) => from(navigator.mediaDevices.getUserMedia({ video })))
    )
  }
}