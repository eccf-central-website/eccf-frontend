import LoadingState from '@/components/common/LoadingState'

export default function LoginLoading() {
  return (
    <LoadingState
      fullscreen
      theme="dark"
      size="md"
      message="Loading Exco Portal"
      subtext="Connecting to fellowship authentication..."
    />
  )
}
