import Random from "@reactioncommerce/random";
import {
  STRIPE_PACKAGE_NAME,
  METHOD,
  PAYMENT_METHOD_NAME,
  PROCESSOR,
  riskLevelMap
} from "./constants.js";
import getStripeInstance from "./getStripeInstance.js";

/**
 * Creates a Stripe charge for a single fulfillment group
 * @param {Object} context The request context
 * @param {Object} input Input necessary to create a payment
 * @returns {Object} The payment object in schema expected by the orders plugin
 */
export default async function stripeCreateAuthorizedPayment(context, input) {
  const {
    billingAddress,
    shopId,
    paymentData: { stripePaymentIntentId }
  } = input;

  const stripe = await getStripeInstance(context);
  console.log("stripe data is ",stripe)

  // stripePaymentIntentId = "pi_3OFa2iBZpCZBysTq0JOBwwFA_secret_pIfNNvZxOg5unyf90hDmzdYVd"
  console.log("Payment Data is ",stripePaymentIntentId)
  const intent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
  console.log("Intent is ",intent)
  // const charges = intent.charges.data;
  // let charges = stripe.Charge.list(stripePaymentIntentId)
  // console.log("All charges are ",charges)
  // const chargesPaymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId, {
  //   expand: ['charges.data'], // This includes charges in the response
  // });
  const chargedData = await stripe.charges.retrieve(intent.latest_charge); 
  const charges = [chargedData];
  console.log("Charges Payment intent is ",chargedData)

  return {
    _id: Random.id(),
    address: billingAddress,
    amount: intent.amount / 100,
    createdAt: new Date(),
    data: {
      stripePaymentIntentId,
      intent,
      gqlType: "StripePaymentData" // GraphQL union resolver uses this
    },
    displayName: "Stripe Payment",
    method: METHOD,
    mode: "authorize",
    name: PAYMENT_METHOD_NAME,
    paymentPluginName: STRIPE_PACKAGE_NAME,
    processor: PROCESSOR,
    riskLevel:
      riskLevelMap[
        charges[0] && charges[0].outcome && charges[0].outcome.risk_level
      ] || "normal",
    shopId,
    status: "created",
    transactionId: stripePaymentIntentId,
     transactions: charges
  };
}
