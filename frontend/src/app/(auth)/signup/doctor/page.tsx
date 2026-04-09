import AuthForm from "@/components/auth/AuthForm";

export const metadata = {
  title: 'Join MediCare+ as Healthcare Provider',
  description: 'Register as a healthcare provider on MediCare+ to offer online consultations.',
};


export default function DoctorSignUpPage() {
  return  <AuthForm type='signup' userRole='doctor'/>
}