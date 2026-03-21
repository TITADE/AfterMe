package expo.modules.storekit

import com.android.billingclient.api.*
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import java.util.concurrent.atomic.AtomicReference
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

class StorekitModule : Module() {

  private var billingClient: BillingClient? = null

  /**
   * Holds the CompletableDeferred for the in-flight purchase.
   * Only one purchase can be active at a time (Google Play enforces this).
   */
  private val pendingPurchase = AtomicReference<CompletableDeferred<Map<String, Any>>?>(null)

  private val purchasesUpdatedListener = PurchasesUpdatedListener { billingResult, purchases ->
    val deferred = pendingPurchase.getAndSet(null) ?: return@PurchasesUpdatedListener
    when (billingResult.responseCode) {
      BillingClient.BillingResponseCode.OK -> {
        val purchase = purchases
          ?.filter { it.purchaseState == Purchase.PurchaseState.PURCHASED }
          ?.firstOrNull()
        if (purchase != null) {
          if (!purchase.isAcknowledged) {
            val ackParams = AcknowledgePurchaseParams.newBuilder()
              .setPurchaseToken(purchase.purchaseToken)
              .build()
            billingClient?.acknowledgePurchase(ackParams) {}
          }
          deferred.complete(
            mapOf("status" to "success", "transactionId" to (purchase.orderId ?: ""))
          )
        } else {
          deferred.complete(mapOf("status" to "pending"))
        }
      }
      BillingClient.BillingResponseCode.USER_CANCELED ->
        deferred.complete(mapOf("status" to "cancelled"))
      else ->
        deferred.complete(mapOf("status" to "unknown"))
    }
  }

  /**
   * Returns a ready BillingClient, creating and connecting one if needed.
   * Must be called from inside a runBlocking { } or coroutine scope.
   */
  private suspend fun getOrCreateClient(): BillingClient {
    val existing = billingClient
    if (existing != null && existing.isReady) return existing

    val context = appContext.reactContext
      ?: throw Exception("Android context not available")

    val client = BillingClient.newBuilder(context)
      .setListener(purchasesUpdatedListener)
      .enablePendingPurchases(
        PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
      )
      .build()

    billingClient = client

    suspendCoroutine { cont ->
      client.startConnection(object : BillingClientStateListener {
        override fun onBillingSetupFinished(result: BillingResult) {
          if (result.responseCode == BillingClient.BillingResponseCode.OK) {
            cont.resume(Unit)
          } else {
            cont.resumeWithException(
              Exception("Google Play Billing setup failed: ${result.debugMessage}")
            )
          }
        }
        override fun onBillingServiceDisconnected() {
          billingClient = null
        }
      })
    }

    return client
  }

  private suspend fun queryAllActivePurchases(): List<String> {
    val client = getOrCreateClient()
    val purchasedIds = mutableListOf<String>()

    for (productType in listOf(BillingClient.ProductType.INAPP, BillingClient.ProductType.SUBS)) {
      val purchases = suspendCoroutine<List<Purchase>> { cont ->
        client.queryPurchasesAsync(
          QueryPurchasesParams.newBuilder().setProductType(productType).build()
        ) { _, list -> cont.resume(list) }
      }
      purchases
        .filter { it.purchaseState == Purchase.PurchaseState.PURCHASED }
        .forEach { purchasedIds.addAll(it.products) }
    }

    return purchasedIds
  }

  override fun definition() = ModuleDefinition {
    Name("Storekit")

    /**
     * Fetch product details from Google Play.
     * IDs containing "lifetime" → INAPP (one-time purchase).
     * IDs containing "annual" → SUBS (subscription).
     */
    AsyncFunction("getProducts") { productIds: List<String> ->
      runBlocking {
        val client = getOrCreateClient()
        val results = mutableListOf<Map<String, Any>>()

        val lifetimeIds = productIds.filter { it.contains("lifetime") }
        val annualIds = productIds.filter { it.contains("annual") }

        if (lifetimeIds.isNotEmpty()) {
          val params = QueryProductDetailsParams.newBuilder()
            .setProductList(lifetimeIds.map { id ->
              QueryProductDetailsParams.Product.newBuilder()
                .setProductId(id)
                .setProductType(BillingClient.ProductType.INAPP)
                .build()
            }).build()

          val details = suspendCoroutine<List<ProductDetails>> { cont ->
            client.queryProductDetailsAsync(params) { _, list -> cont.resume(list) }
          }
          details.forEach { d ->
            val priceInfo = d.oneTimePurchaseOfferDetails
            results.add(mapOf(
              "id" to d.productId,
              "displayName" to d.name,
              "description" to d.description,
              "displayPrice" to (priceInfo?.formattedPrice ?: "£79.99"),
              "price" to ((priceInfo?.priceAmountMicros ?: 79990000L) / 1_000_000.0)
            ))
          }
        }

        if (annualIds.isNotEmpty()) {
          val params = QueryProductDetailsParams.newBuilder()
            .setProductList(annualIds.map { id ->
              QueryProductDetailsParams.Product.newBuilder()
                .setProductId(id)
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
            }).build()

          val details = suspendCoroutine<List<ProductDetails>> { cont ->
            client.queryProductDetailsAsync(params) { _, list -> cont.resume(list) }
          }
          details.forEach { d ->
            val phase = d.subscriptionOfferDetails
              ?.firstOrNull()?.pricingPhases?.pricingPhaseList?.lastOrNull()
            results.add(mapOf(
              "id" to d.productId,
              "displayName" to d.name,
              "description" to d.description,
              "displayPrice" to (phase?.formattedPrice ?: "£34.99"),
              "price" to ((phase?.priceAmountMicros ?: 34990000L) / 1_000_000.0)
            ))
          }
        }

        results
      }
    }

    /**
     * Launch the Google Play purchase flow. Waits up to 5 minutes for completion.
     */
    AsyncFunction("purchase") { productId: String ->
      runBlocking {
        val activity = appContext.currentActivity
          ?: throw Exception("No foreground activity — purchase cannot proceed")
        val client = getOrCreateClient()

        val isSubscription = productId.contains("annual")
        val productType =
          if (isSubscription) BillingClient.ProductType.SUBS else BillingClient.ProductType.INAPP

        val queryParams = QueryProductDetailsParams.newBuilder()
          .setProductList(listOf(
            QueryProductDetailsParams.Product.newBuilder()
              .setProductId(productId)
              .setProductType(productType)
              .build()
          )).build()

        val productDetails = suspendCoroutine<ProductDetails?> { cont ->
          client.queryProductDetailsAsync(queryParams) { _, list -> cont.resume(list.firstOrNull()) }
        } ?: throw Exception("Product not found in Google Play: $productId")

        val paramsBuilder = BillingFlowParams.ProductDetailsParams.newBuilder()
          .setProductDetails(productDetails)

        if (isSubscription) {
          val offerToken = productDetails.subscriptionOfferDetails
            ?.firstOrNull()?.offerToken
            ?: throw Exception("No subscription offer available for $productId")
          paramsBuilder.setOfferToken(offerToken)
        }

        val billingFlowParams = BillingFlowParams.newBuilder()
          .setProductDetailsParamsList(listOf(paramsBuilder.build()))
          .build()

        val deferred = CompletableDeferred<Map<String, Any>>()
        pendingPurchase.set(deferred)

        // launchBillingFlow must run on the main thread
        val flowResult = withContext(Dispatchers.Main) {
          client.launchBillingFlow(activity, billingFlowParams)
        }

        if (flowResult.responseCode != BillingClient.BillingResponseCode.OK) {
          pendingPurchase.set(null)
          return@runBlocking mapOf<String, Any>("status" to "unknown")
        }

        withTimeout(300_000L) { deferred.await() }
      }
    }

    /**
     * Return all active purchase product IDs (INAPP + SUBS).
     */
    AsyncFunction("getPurchasedProducts") { ->
      runBlocking { queryAllActivePurchases() }
    }

    /**
     * Restore purchases by re-querying Google Play.
     */
    AsyncFunction("restore") { ->
      runBlocking { queryAllActivePurchases() }
    }
  }
}
