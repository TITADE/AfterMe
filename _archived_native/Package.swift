// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "AfterMe",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        // Change to executable so it can be run as an app
        .executable(
            name: "AfterMe",
            targets: ["AfterMe"]),
    ],
    targets: [
        .executableTarget(
            name: "AfterMe",
            dependencies: [],
            path: "AfterMe",
            resources: [
                .process("Resources")
            ],
            swiftSettings: [
                .enableUpcomingFeature("BareSlashRegexLiterals")
            ]
        ),
        .testTarget(
            name: "AfterMeTests",
            dependencies: ["AfterMe"]),
    ]
)
