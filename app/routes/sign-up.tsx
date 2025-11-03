import { SignUp } from "@clerk/react-router";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center h-screen">
      <SignUp 
        appearance={{
          elements: {
            headerTitle: {
              display: "none"
            },
            headerSubtitle: {
              display: "none"
            }
          }
        }}
      >
        <SignUp.Header>
          <h1 className="text-2xl font-bold text-center mb-2">
            Start Your Free 7-Day Trial
          </h1>
          <p className="text-sm text-gray-600 text-center">
            No credit card required
          </p>
        </SignUp.Header>
      </SignUp>
    </div>
  );
}
