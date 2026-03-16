import SwiftUI

struct ContentView: View {
    // We will inject the authentication state here.
    @State private var isAuthenticated = false
    @State private var isOnboardingComplete = false

    var body: some View {
        if !isOnboardingComplete {
            // Show Onboarding View
            OnboardingView(isOnboardingComplete: $isOnboardingComplete)
        } else if isAuthenticated {
            // Show Vault Dashboard
            DashboardView()
        } else {
            // Show Authentication / Lock Screen
            AuthenticationView(isAuthenticated: $isAuthenticated)
        }
    }
}

// Placeholder Views for now
struct OnboardingView: View {
    @Binding var isOnboardingComplete: Bool
    var body: some View {
        VStack {
            Text("Onboarding")
            Button("Complete Onboarding") {
                isOnboardingComplete = true
            }
        }
    }
}

struct DashboardView: View {
    var body: some View {
        Text("Dashboard - Vault Unlocked")
    }
}

struct AuthenticationView: View {
    @Binding var isAuthenticated: Bool
    var body: some View {
        VStack {
            Text("Locked")
            Button("Unlock with Face ID") {
                // Simulate authentication
                isAuthenticated = true
            }
        }
    }
}
