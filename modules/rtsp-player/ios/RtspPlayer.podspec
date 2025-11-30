Pod::Spec.new do |s|
  s.name           = 'RtspPlayer'
  s.version        = '1.0.0'
  s.summary        = 'RTSP video player with VLCKit'
  s.description    = 'Native iOS RTSP player using VLCKit for React Native'
  s.author         = ''
  s.homepage       = 'https://github.com/nicorito/rtsp-player'
  s.platforms      = { :ios => '14.0', :tvos => '14.0' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'MobileVLCKit', '~> 3.6.0'

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
