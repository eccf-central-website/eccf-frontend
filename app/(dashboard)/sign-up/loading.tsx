import LoadingState from '@/components/common/LoadingState'

export default function SignUpLoading() {
  return (
    <LoadingState
      fullscreen
      theme="dark"
      size="md"
      message="Loading Account Setup"
      subtext="Preparing secure fellowship onboarding..."
    />
  )
}
