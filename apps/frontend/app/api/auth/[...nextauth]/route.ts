import NextAuth from "next-auth"
import { AuthOptions } from "next-auth"
// Import your providers here, e.g.:
// import GithubProvider from "next-auth/providers/github"

const authOptions: AuthOptions = {
  // Configure one or more authentication providers
  providers: [
    // Example Provider (replace/add your own):
    // GithubProvider({
    //   clientId: process.env.GITHUB_ID!,
    //   clientSecret: process.env.GITHUB_SECRET!,
    // }),
    // ...add more providers here
  ],
  // Add other NextAuth options if needed (e.g., secret, callbacks, pages)
  // secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 