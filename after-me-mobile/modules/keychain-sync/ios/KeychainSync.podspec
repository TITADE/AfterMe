require 'json'
package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'KeychainSync'
  s.version        = package['version']
  s.summary        = 'iCloud Keychain sync for vault key backup'
  s.description    = package['description']
  s.license        = 'MIT'
  s.authors        = { 'After Me' => 'hello@afterme.app' }
  s.homepage       = 'https://afterme.app'
  s.platform       = :ios, '15.0'
  s.swift_version  = '5.4'
  s.source         = { path: '.' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = "**/*.{h,m,swift}"
end
