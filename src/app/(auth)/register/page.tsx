"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RegisterStep1 from "@/components/auth/register-step-1";
import RegisterStep2 from "@/components/auth/register-step-2";
import RegisterStep3 from "@/components/auth/register-step-3";

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  const stepTitles = [
    "Create your account",
    "Connect your email",
    "You're all set!",
  ];

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mb-2 flex justify-center gap-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-2 w-12 rounded-full transition-all duration-200 ${
                step <= currentStep
                  ? "bg-gradient-to-r from-[#F6D365] to-[#FDA085]"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
        <CardTitle className="text-2xl">
          {stepTitles[currentStep - 1]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentStep === 1 && (
          <RegisterStep1
            onComplete={(id) => {
              setUserId(id);
              setCurrentStep(2);
            }}
          />
        )}
        {currentStep === 2 && userId && (
          <RegisterStep2
            userId={userId}
            onComplete={() => setCurrentStep(3)}
          />
        )}
        {currentStep === 3 && <RegisterStep3 />}
      </CardContent>
    </Card>
  );
}
