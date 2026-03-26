Pod::Spec.new do |s|
  s.name           = 'IcloudBackup'
  s.version        = '0.1.0'
  s.summary        = 'iCloud Documents container backup for After Me vault'
  s.description    = 'Expo native module for reading/writing encrypted vault backups to iCloud Documents container'
  s.author         = 'After Me'
  s.homepage       = 'https://github.com/elufadeju/after-me'
  s.platforms      = { :ios => '15.0' }
  s.source         = { path: '.' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.swift"
end
