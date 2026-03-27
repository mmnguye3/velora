import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
      organizationId: string
      organizationName: string
    }
  }

  interface User {
    id: string
    name: string
    email: string
    role: string
    organizationId: string
    organizationName: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    organizationId: string
    organizationName: string
  }
}
