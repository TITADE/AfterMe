import ExpoModulesCore
import StoreKit

public class StorekitModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Storekit")

    // Async function to fetch product details (Price, Description)
    AsyncFunction("getProducts") { (productIds: [String]) async throws -> [[String: Any]] in
      let products = try await Product.products(for: productIds)
      return products.map { product in
        return [
          "id": product.id,
          "displayName": product.displayName,
          "description": product.description,
          "displayPrice": product.displayPrice,
          "price": product.price
        ]
      }
    }

    // Async function to perform a purchase
    AsyncFunction("purchase") { (productId: String) async throws -> [String: Any] in
      let products = try await Product.products(for: [productId])
      guard let product = products.first else {
        throw NSError(domain: "Storekit", code: 404, userInfo: [NSLocalizedDescriptionKey: "Product not found"])
      }

      let result = try await product.purchase()
      
      switch result {
      case .success(let verification):
          // Check whether the transaction is verified.
          switch verification {
          case .unverified(_, let error):
              throw error
          case .verified(let transaction):
              // Finish the transaction.
              await transaction.finish()
              return ["status": "success", "transactionId": String(transaction.id)]
          }
      case .userCancelled:
          return ["status": "cancelled"]
      case .pending:
          return ["status": "pending"]
      @unknown default:
          return ["status": "unknown"]
      }
    }

    // Async function to check current entitlements (Restores)
    AsyncFunction("getPurchasedProducts") { () async -> [String] in
      var purchasedIds: [String] = []
      
      // Iterate through all verified transactions
      for await result in Transaction.currentEntitlements {
        if case .verified(let transaction) = result {
          purchasedIds.append(transaction.productID)
        }
      }
      return purchasedIds
    }
    
    // Manual restore prompt (rarely needed for SK2, but good for UI)
    AsyncFunction("restore") { () async throws in
      try await AppStore.sync()
    }
  }
}
