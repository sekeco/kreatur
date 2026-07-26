import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getInitials } from "@/lib/utils"

interface AuthorProfile {
  name: string
  avatar: string
  email?: string
  role?: string
  totalArticles?: number
  honorDefault?: number
}

export function AuthorProfileCard({ author }: { author: AuthorProfile }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar className="size-12 rounded-lg">
            <AvatarImage src={author.avatar || undefined} alt={author.name} />
            <AvatarFallback>{getInitials(author.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle className="truncate text-sm">{author.name}</CardTitle>
            {author.email && (
              <p className="truncate text-xs text-muted-foreground">
                {author.email}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text grid grid-cols-3 gap-2">
          {author.role && (
            <div>
              <p className="text-muted-foreground">Peran</p>
              <Badge variant="outline">{author.role}</Badge>
            </div>
          )}
          {author.totalArticles !== undefined && (
            <div>
              <p className="text-muted-foreground">Artikel</p>
              <p className="mt-0.5 font-semibold">{author.totalArticles}</p>
            </div>
          )}
          {author.honorDefault !== undefined && (
            <div>
              <p className="text-muted-foreground">Honor</p>
              <p className="mt-0.5 font-semibold tabular-nums">
                Rp{author.honorDefault.toLocaleString("id-ID")}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
