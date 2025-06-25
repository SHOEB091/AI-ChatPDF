"use client";
import React from "react";
import { Button } from "./ui/button";
import axios from "axios";

type Props = { isPro: boolean };

const SubscriptionButton = (props: Props) => {
  const [loading, setLoading] = React.useState(false);
  const handleSubscription = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/razorpay");
      
      // If it's a management request, direct to subscription management
      if (response.data.type === "manage" && props.isPro) {
        // For a real app, create a management portal here
        // For now, just show an alert as Razorpay doesn't have a direct portal like Stripe
        alert('Your subscription ID: ' + response.data.subscription_id);
        return;
      }
      
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      
      script.onload = () => {
        const razorpayOptions = {
          key: response.data.key_id,
          amount: response.data.amount,
          currency: response.data.currency,
          name: response.data.name,
          description: response.data.description,
          image: response.data.image,
          order_id: response.data.id,
          subscription_id: response.data.subscription_id,
          handler: (paymentResponse: any) => {
            // Payment success
            console.log("Payment successful", paymentResponse);
            
            // Create a subscription if plan_id is available
            if (response.data.plan_id) {
              console.log("Creating subscription...");
              // In a real app, you would create a subscription here
            }
            
            window.location.href = `${window.location.origin}/`;
          },
          prefill: {
            email: response.data.prefill.email
          },
          theme: {
            color: "#0ea5e9" // Tailwind sky-500 color
          }
        };
        
        // @ts-ignore - Razorpay is loaded via script
        const razorpayInstance = new window.Razorpay(razorpayOptions);
        razorpayInstance.open();
      };
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button disabled={loading} onClick={handleSubscription} variant="outline">
      {props.isPro ? "Manage Subscriptions" : "Get Pro"}
    </Button>
  );
};

export default SubscriptionButton;
