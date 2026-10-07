/**
 * Sign-in — /login
 *
 * Placeholder until NextAuth lands (feature/dashboard-auth).
 */

import Link from 'next/link'
import { Button } from '@/components/dashboard/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/dashboard/ui/card'

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Exco sign-in</CardTitle>
          <CardDescription>Sign-in is being set up. Please check back soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Back to the ECCF website</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
