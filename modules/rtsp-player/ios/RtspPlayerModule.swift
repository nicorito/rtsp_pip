import ExpoModulesCore
import MobileVLCKit

public class RtspPlayerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("RtspPlayer")

    Events("onPlayerStateChange", "onError", "onBuffering")

    View(RtspPlayerView.self) {
      Prop("source") { (view: RtspPlayerView, source: [String: Any]) in
        if let uri = source["uri"] as? String {
          view.setSource(uri: uri)
        }
      }

      Prop("paused") { (view: RtspPlayerView, paused: Bool) in
        view.setPaused(paused)
      }

      Prop("autoplay") { (view: RtspPlayerView, autoplay: Bool) in
        view.setAutoplay(autoplay)
      }

      Prop("hwDecoderEnabled") { (view: RtspPlayerView, enabled: Bool) in
        view.setHwDecoderEnabled(enabled)
      }
    }
  }
}
