import Foundation
import SwiftData

@Model
final class VaultItem {
    @Attribute(.unique) var id: UUID
    var name: String
    var documentType: DocumentType
    var issueDate: Date?
    var expiryDate: Date?
    var providerName: String?
    var originalLocation: String?
    var encryptedFilePath: String
    var thumbnailPath: String?
    var tags: [String]
    var createdAt: Date
    var updatedAt: Date
    var bodyText: String? // For text-only Personal Messages (v1)

    init(
        id: UUID = UUID(),
        name: String,
        documentType: DocumentType,
        issueDate: Date? = nil,
        expiryDate: Date? = nil,
        providerName: String? = nil,
        originalLocation: String? = nil,
        encryptedFilePath: String,
        thumbnailPath: String? = nil,
        tags: [String] = [],
        bodyText: String? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.documentType = documentType
        self.issueDate = issueDate
        self.expiryDate = expiryDate
        self.providerName = providerName
        self.originalLocation = originalLocation
        self.encryptedFilePath = encryptedFilePath
        self.thumbnailPath = thumbnailPath
        self.tags = tags
        self.bodyText = bodyText
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

enum DocumentType: String, Codable, CaseIterable {
    case identity
    case legal
    case property
    case finance
    case insurance
    case medical
    case digital
    case personal
    
    var displayName: String {
        switch self {
        case .identity: return "Identity"
        case .legal: return "Legal"
        case .property: return "Property"
        case .finance: return "Finance"
        case .insurance: return "Insurance"
        case .medical: return "Medical"
        case .digital: return "Digital"
        case .personal: return "Personal"
        }
    }
    
    var suggestedDocuments: [String] {
        switch self {
        case .identity: return ["Passport", "Driving Licence", "Birth Certificate", "NI/SSN Card"]
        case .legal: return ["Will", "Power of Attorney", "Trust Documents", "Marriage Certificate"]
        case .property: return ["Deeds", "Mortgage", "Rental Agreements", "Land Registry"]
        case .finance: return ["Bank Accounts", "Investments", "Pension", "Savings"]
        case .insurance: return ["Life", "Health", "Home", "Car"]
        case .medical: return ["Medical History", "Advance Directive", "Organ Donor Card"]
        case .digital: return ["Password Hints", "Email Accounts", "Subscriptions", "Crypto"]
        case .personal: return ["Letters", "Photos", "Voice Messages", "Wishes"]
        }
    }
    
    // Completeness mechanic helper
    var keyDocumentCount: Int {
        return 3 // Default goal for "Vault Health"
    }
}
