import AuthForm from "@/components/auth/AuthForm";

export const metadata = {
  title: 'Patient Login - MediCare+',
  description: 'Sign in to your MediCare+ account to access healthcare consultations.',
};

export default function PatientLoginPage() {
  return  <AuthForm type='login' userRole='patient'/>
}