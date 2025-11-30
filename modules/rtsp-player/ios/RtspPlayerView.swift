import ExpoModulesCore
import MobileVLCKit
import UIKit

class RtspPlayerView: ExpoView, VLCMediaPlayerDelegate {
  private var mediaPlayer: VLCMediaPlayer?
  private var videoView: UIView?
  private var autoplay: Bool = true
  private var hwDecoderEnabled: Bool = true

  var onPlayerStateChange: EventDispatcher?
  var onError: EventDispatcher?
  var onBuffering: EventDispatcher?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    setupPlayer()
  }

  private func setupPlayer() {
    // Initialize VLC media player
    mediaPlayer = VLCMediaPlayer()
    mediaPlayer?.delegate = self

    // Create video view
    videoView = UIView(frame: self.bounds)
    videoView?.backgroundColor = .black
    videoView?.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    if let videoView = videoView {
      self.addSubview(videoView)
      mediaPlayer?.drawable = videoView
    }

    // Configure VLC options
    configurePlayerOptions()
  }

  private func configurePlayerOptions() {
    guard let mediaPlayer = mediaPlayer else { return }

    // Enable hardware decoding
    if hwDecoderEnabled {
      // Hardware acceleration options
      mediaPlayer.media?.addOption("--avcodec-hw=videotoolbox")
    }

    // Network caching (in milliseconds)
    mediaPlayer.media?.addOption("--network-caching=1000")

    // RTSP options
    mediaPlayer.media?.addOption("--rtsp-tcp") // Use TCP instead of UDP
    mediaPlayer.media?.addOption("--rtsp-frame-buffer-size=500000")
  }

  func setSource(uri: String) {
    guard let mediaPlayer = mediaPlayer else { return }

    // Stop current playback
    if mediaPlayer.isPlaying {
      mediaPlayer.stop()
    }

    // Set new media
    let media = VLCMedia(url: URL(string: uri)!)

    // Configure media options
    media.addOption("--network-caching=1000")
    media.addOption("--rtsp-tcp")

    mediaPlayer.media = media

    if autoplay {
      mediaPlayer.play()
    }
  }

  func setPaused(_ paused: Bool) {
    guard let mediaPlayer = mediaPlayer else { return }

    if paused {
      mediaPlayer.pause()
    } else {
      mediaPlayer.play()
    }
  }

  func setAutoplay(_ autoplay: Bool) {
    self.autoplay = autoplay
  }

  func setHwDecoderEnabled(_ enabled: Bool) {
    self.hwDecoderEnabled = enabled
    configurePlayerOptions()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    videoView?.frame = self.bounds
  }

  // MARK: - VLCMediaPlayerDelegate

  func mediaPlayerStateChanged(_ aNotification: Notification) {
    guard let mediaPlayer = mediaPlayer else { return }

    let stateString: String
    switch mediaPlayer.state {
    case .opening:
      stateString = "opening"
    case .buffering:
      stateString = "buffering"
      onBuffering?([:])
    case .playing:
      stateString = "playing"
    case .paused:
      stateString = "paused"
    case .stopped:
      stateString = "stopped"
    case .ended:
      stateString = "ended"
    case .error:
      stateString = "error"
      onError?(["error": "Playback error occurred"])
    default:
      stateString = "unknown"
    }

    onPlayerStateChange?(["state": stateString])
  }

  func mediaPlayerTimeChanged(_ aNotification: Notification) {
    // Optional: Send time updates
  }

  deinit {
    mediaPlayer?.stop()
    mediaPlayer = nil
  }
}
